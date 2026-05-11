import crypto from 'crypto';
import { and, eq, inArray, isNull, notInArray, sql } from '@xom/db';
import { db } from '@xom/db';
import {
  gameConfigurationVersions,
  gameConfigurations,
  gameCredentials,
  gameServerDeployments,
  gameServerInstances,
  gameServerJobs,
  serverHostPortAllocations,
  serverHosts,
} from '@xom/db';
import { encryptSecret, generatePassword } from '@xom/db/crypto';
import { getGameDefinition } from '@xom/game-config';
import { recordServerEvent } from './events';
import { enqueueGameServerDbJob } from './queue';
import { PortBinding, PortRequest, sanitizeDockerName } from './types';

type Transaction = any;

function normalizeIds(value: unknown, field: string) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${field} must be a non-empty array`);
  }

  const ids = [...new Set(value.map((item) => Number(item)))];
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new Error(`${field} contains invalid ids`);
  }

  return ids;
}

function makeProjectName(gameKey: string, configId: number, hostId: number) {
  const suffix = crypto.randomBytes(4).toString('hex');
  return sanitizeDockerName(`xom-${gameKey}-${configId}-${hostId}-${suffix}`);
}

async function allocatePort(
  tx: Transaction,
  host: typeof serverHosts.$inferSelect,
  request: PortRequest,
) {
  const allocations: Array<{ port: number; protocol: string }> = await tx
    .select({
      port: serverHostPortAllocations.port,
      protocol: serverHostPortAllocations.protocol,
    })
    .from(serverHostPortAllocations)
    .where(eq(serverHostPortAllocations.hostId, host.id));

  const used = new Set(allocations.map((allocation: { port: number; protocol: string }) => `${allocation.port}:${allocation.protocol}`));
  for (let port = host.portRangeStart; port <= host.portRangeEnd; port++) {
    if (request.protocols.every((protocol) => !used.has(`${port}:${protocol}`))) {
      return port;
    }
  }

  throw new Error(`No available ${request.name} port on host ${host.name}`);
}

async function reserveCredential(
  tx: Transaction,
  gameKey: string,
  credentialType: string | undefined,
) {
  if (!credentialType) return null;

  const credentials = await tx
    .select()
    .from(gameCredentials)
    .where(and(
      eq(gameCredentials.gameKey, gameKey),
      eq(gameCredentials.type, credentialType),
      eq(gameCredentials.isActive, 1),
      isNull(gameCredentials.assignedInstanceId),
    ))
    .limit(1);

  if (credentials.length === 0) {
    throw new Error(`No available ${credentialType} credential for ${gameKey}`);
  }

  return credentials[0];
}

async function assertHostCapacity(tx: Transaction, host: typeof serverHosts.$inferSelect) {
  const activeInstances: Array<{ id: number }> = await tx
    .select({ id: gameServerInstances.id })
    .from(gameServerInstances)
    .where(and(
      eq(gameServerInstances.hostId, host.id),
      notInArray(gameServerInstances.status, ['deleted']),
    ));

  if (activeInstances.length >= host.maxInstances) {
    throw new Error(`Host ${host.name} has no available instance slots`);
  }
}

async function loadConfigurations(tx: Transaction, ids: number[]) {
  const rows: Array<{
    configuration: typeof gameConfigurations.$inferSelect;
    version: typeof gameConfigurationVersions.$inferSelect;
  }> = await tx
    .select({
      configuration: gameConfigurations,
      version: gameConfigurationVersions,
    })
    .from(gameConfigurations)
    .innerJoin(
      gameConfigurationVersions,
      eq(gameConfigurations.currentVersionId, gameConfigurationVersions.id),
    )
    .where(and(
      inArray(gameConfigurations.id, ids),
      eq(gameConfigurations.isActive, 1),
    ));

  if (rows.length !== ids.length) {
    throw new Error('One or more configurations are missing or inactive');
  }

  return ids.map((id) => {
    const row = rows.find((item) => item.configuration.id === id);
    if (!row) throw new Error(`Configuration ${id} was not found`);
    return row;
  });
}

async function loadHosts(tx: Transaction, ids: number[]) {
  const rows: Array<typeof serverHosts.$inferSelect> = await tx
    .select()
    .from(serverHosts)
    .where(and(inArray(serverHosts.id, ids), eq(serverHosts.enabled, 1)));

  if (rows.length !== ids.length) {
    throw new Error('One or more hosts are missing or disabled');
  }

  return ids.map((id) => {
    const host = rows.find((row) => row.id === id);
    if (!host) throw new Error(`Host ${id} was not found`);
    return host;
  });
}

export async function createGameServerDeployment(input: {
  configurationIds: unknown;
  hostIds: unknown;
  createdBy: string;
}) {
  const configurationIds = normalizeIds(input.configurationIds, 'configurationIds');
  const hostIds = normalizeIds(input.hostIds, 'hostIds');
  const deploymentName = `Deploy ${configurationIds.length} config(s) to ${hostIds.length} host(s)`;

  const result = await db.transaction(async (tx) => {
    const configurations = await loadConfigurations(tx, configurationIds);
    const hosts = await loadHosts(tx, hostIds);
    const totalCount = configurations.length * hosts.length;

    const deploymentInsert = await tx.insert(gameServerDeployments).values({
      name: deploymentName,
      status: 'queued',
      totalCount,
      queuedCount: totalCount,
      succeededCount: 0,
      failedCount: 0,
      createdBy: input.createdBy,
    });
    const deploymentId = deploymentInsert[0].insertId;
    const createdInstances: number[] = [];
    const createdJobs: Array<{ dbJobId: number; instanceId: number; deploymentId: number }> = [];

    for (const { configuration, version } of configurations) {
      const definition = getGameDefinition(configuration.gameKey);
      const configSnapshot = definition.validateConfig(version.config);
      const portRequests = definition.getRequiredPorts(configSnapshot);

      for (const host of hosts) {
        await assertHostCapacity(tx, host);

        const credential = await reserveCredential(tx, definition.key, definition.credentialType);
        const projectName = makeProjectName(definition.key, configuration.id, host.id);
        const containerName = projectName;
        const rconPassword = generatePassword();
        const portBindings: PortBinding[] = [];

        for (const request of portRequests) {
          const hostPort = await allocatePort(tx, host, request);
          for (const protocol of request.protocols) {
            portBindings.push({
              name: request.name,
              hostPort,
              containerPort: request.containerPort,
              protocol,
            });
          }
        }

        const gamePort = portBindings.find((binding) => binding.name === 'game');
        const encryptedServerPassword = typeof configSnapshot.serverPassword === 'string' && configSnapshot.serverPassword
          ? encryptSecret(configSnapshot.serverPassword)
          : null;

        const instanceInsert = await tx.insert(gameServerInstances).values({
          deploymentId,
          hostId: host.id,
          configurationId: configuration.id,
          configurationVersionId: version.id,
          gameKey: definition.key,
          name: `${configuration.name} @ ${host.name}`,
          status: 'queued',
          desiredState: 'online',
          visibility: 'public',
          ownerId: input.createdBy,
          dockerProjectName: projectName,
          containerName,
          connectAddress: gamePort ? `${host.publicAddress}:${gamePort.hostPort}` : null,
          queryPort: gamePort?.hostPort || null,
          ports: portBindings,
          configSnapshot,
          encryptedRconPassword: encryptSecret(rconPassword),
          encryptedServerPassword,
          credentialId: credential?.id || null,
        });

        const instanceId = instanceInsert[0].insertId;
        createdInstances.push(instanceId);

        for (const binding of portBindings) {
          await tx.insert(serverHostPortAllocations).values({
            hostId: host.id,
            instanceId,
            port: binding.hostPort,
            protocol: binding.protocol,
          });
        }

        if (credential) {
          await tx
            .update(gameCredentials)
            .set({ assignedInstanceId: instanceId })
            .where(eq(gameCredentials.id, credential.id));
        }

        const jobInsert = await tx.insert(gameServerJobs).values({
          instanceId,
          deploymentId,
          type: 'provision',
          status: 'queued',
          payload: {},
        });
        createdJobs.push({ dbJobId: jobInsert[0].insertId, instanceId, deploymentId });
      }
    }

    return { deploymentId, instanceIds: createdInstances, jobs: createdJobs };
  });

  try {
    await Promise.all(
      result.jobs.map((job) => enqueueGameServerDbJob({
        dbJobId: job.dbJobId,
        instanceId: job.instanceId,
        deploymentId: job.deploymentId,
        type: 'provision',
      })),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db
      .update(gameServerJobs)
      .set({ status: 'failed', error: message })
      .where(inArray(gameServerJobs.id, result.jobs.map((job) => job.dbJobId)));
    await recordServerEvent({
      deploymentId: result.deploymentId,
      type: 'deployment_queue_failed',
      level: 'error',
      message,
    });
    throw new Error(`Deployment records were created but queue enqueue failed: ${message}`);
  }

  await recordServerEvent({
    deploymentId: result.deploymentId,
    type: 'deployment_created',
    message: `Queued ${result.instanceIds.length} server instance(s)`,
    metadata: {
      configurationIds,
      hostIds,
    },
  });

  return result;
}

export async function refreshDeploymentStatus(deploymentId: number | null | undefined) {
  if (!deploymentId) return;

  const rows = await db
    .select({
      status: gameServerInstances.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(gameServerInstances)
    .where(eq(gameServerInstances.deploymentId, deploymentId))
    .groupBy(gameServerInstances.status);

  const counts = new Map(rows.map((row) => [row.status, Number(row.count)]));
  const failed = counts.get('failed') || 0;
  const succeeded = counts.get('online') || 0;
  const queued = (counts.get('queued') || 0) + (counts.get('provisioning') || 0);
  const total = rows.reduce((sum, row) => sum + Number(row.count), 0);
  const status = total > 0 && succeeded + failed >= total
    ? failed > 0 ? 'completed_with_failures' : 'completed'
    : failed > 0 ? 'running_with_failures' : 'running';

  await db
    .update(gameServerDeployments)
    .set({
      status,
      totalCount: total,
      queuedCount: queued,
      succeededCount: succeeded,
      failedCount: failed,
    })
    .where(eq(gameServerDeployments.id, deploymentId));
}
