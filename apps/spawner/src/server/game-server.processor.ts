import { Injectable } from '@nestjs/common';
import { eq, sql } from '@xom/db';
import {
  db,
  gameCredentials,
  gameServerDeployments,
  gameServerInstances,
  gameServerJobs,
  serverHostPortAllocations,
  serverHosts,
} from '@xom/db';
import { decryptSecret } from '@xom/db/crypto';
import { getSpawnerGameAdapter } from '../games';
import { recordServerEvent } from './events';
import { RemoteDockerHost, getSshConfig, remotePathJoin, shellQuote } from './remote-docker-host';
import type { PortBinding } from './types';

@Injectable()
export class GameServerProcessor {
  async markJobRunning(dbJobId: number) {
    await db
      .update(gameServerJobs)
      .set({ status: 'running', attempts: sql`${gameServerJobs.attempts} + 1` })
      .where(eq(gameServerJobs.id, dbJobId));
  }

  async markJobSucceeded(dbJobId: number) {
    await db
      .update(gameServerJobs)
      .set({ status: 'succeeded', error: null })
      .where(eq(gameServerJobs.id, dbJobId));
  }

  async markJobFailed(
    dbJobId: number,
    instanceId: number,
    deploymentId: number | null | undefined,
    error: unknown,
    options: { markInstanceFailed?: boolean } = {},
  ) {
    const message = error instanceof Error ? error.message : String(error);
    await db
      .update(gameServerJobs)
      .set({ status: 'failed', error: message })
      .where(eq(gameServerJobs.id, dbJobId));
    if (options.markInstanceFailed !== false) {
      await db
        .update(gameServerInstances)
        .set({ status: 'failed', lastError: message })
        .where(eq(gameServerInstances.id, instanceId));
    }

    await recordServerEvent({
      instanceId,
      deploymentId,
      type: 'job_failed',
      level: 'error',
      message,
    });
  }

  async processAction(type: string, instanceId: number) {
    if (type === 'provision' || type === 'retry') {
      await this.provisionInstance(instanceId);
    } else if (type === 'start') {
      await this.runComposeAction(instanceId, 'start');
    } else if (type === 'stop') {
      await this.runComposeAction(instanceId, 'stop');
    } else if (type === 'restart') {
      await this.runComposeAction(instanceId, 'restart');
    } else if (type === 'delete') {
      await this.deleteInstance(instanceId);
    } else if (type === 'sync-status') {
      await this.syncInstanceStatus(instanceId);
    } else {
      throw new Error(`Unsupported game server action: ${type}`);
    }
  }

  async refreshDeploymentStatus(deploymentId: number | null | undefined) {
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

  private async loadContext(instanceId: number) {
    const rows = await db
      .select({
        instance: gameServerInstances,
        host: serverHosts,
      })
      .from(gameServerInstances)
      .innerJoin(serverHosts, eq(gameServerInstances.hostId, serverHosts.id))
      .where(eq(gameServerInstances.id, instanceId))
      .limit(1);

    if (rows.length === 0) {
      throw new Error('Server instance not found');
    }

    const credential = rows[0].instance.credentialId
      ? await db
        .select()
        .from(gameCredentials)
        .where(eq(gameCredentials.id, rows[0].instance.credentialId))
        .limit(1)
        .then((items) => items[0] || null)
      : null;

    return { ...rows[0], credential };
  }

  private async withRemote<T>(
    host: typeof serverHosts.$inferSelect,
    fn: (remote: RemoteDockerHost, instanceBasePath: string) => Promise<T>,
  ) {
    const remote = new RemoteDockerHost(getSshConfig(host));
    try {
      await remote.connect();
      const hostBasePath = await remote.resolveBasePath(host.baseDeployPath);
      return await fn(remote, hostBasePath);
    } finally {
      await remote.dispose();
    }
  }

  private async provisionInstance(instanceId: number) {
    const { instance, host, credential } = await this.loadContext(instanceId);
    const adapter = getSpawnerGameAdapter(instance.gameKey);
    const config = adapter.validateConfig(instance.configSnapshot);
    const credentialValue = credential ? decryptSecret(credential.encryptedValue) : undefined;
    const rconPassword = decryptSecret(instance.encryptedRconPassword);

    await db
      .update(gameServerInstances)
      .set({ status: 'provisioning', lastError: null })
      .where(eq(gameServerInstances.id, instance.id));

    await recordServerEvent({
      instanceId: instance.id,
      deploymentId: instance.deploymentId,
      type: 'provision_started',
      message: `Provisioning ${instance.name}`,
    });

    await this.withRemote(host, async (remote, hostBasePath) => {
      const instancePath = remotePathJoin(hostBasePath, instance.dockerProjectName);
      const rendered = adapter.render({
        config,
        projectName: instance.dockerProjectName,
        containerName: instance.containerName,
        hostPublicAddress: host.publicAddress,
        portBindings: instance.ports as PortBinding[],
        credentialValue,
        rconPassword,
      });

      await remote.exec(`mkdir -p ${shellQuote(instancePath)}`);
      await remote.exec([
        'rm -rf',
        shellQuote(remotePathJoin(instancePath, 'custom_files')),
        shellQuote(remotePathJoin(instancePath, 'docker-compose.yml')),
      ].join(' '));
      if (adapter.key === 'cs2') {
        await remote.exec('docker network inspect cs2_game-net >/dev/null 2>&1 || docker network create cs2_game-net');
      }
      await remote.uploadFiles(instancePath, rendered.files);
      await remote.exec(`cd ${shellQuote(instancePath)} && docker compose up -d`);

      await db
        .update(gameServerInstances)
        .set({
          status: 'online',
          desiredState: 'online',
          connectAddress: rendered.connectAddress,
          queryPort: rendered.queryPort,
          provisionedAt: new Date(),
          lastError: null,
        })
        .where(eq(gameServerInstances.id, instance.id));
    });

    await recordServerEvent({
      instanceId: instance.id,
      deploymentId: instance.deploymentId,
      type: 'provision_completed',
      message: `${instance.name} is online`,
    });
  }

  private async runComposeAction(instanceId: number, action: 'start' | 'stop' | 'restart') {
    const { instance, host } = await this.loadContext(instanceId);
    const status = action === 'start' ? 'starting' : action === 'stop' ? 'stopping' : 'restarting';
    await db.update(gameServerInstances).set({ status }).where(eq(gameServerInstances.id, instance.id));

    await this.withRemote(host, async (remote, hostBasePath) => {
      const instancePath = remotePathJoin(hostBasePath, instance.dockerProjectName);
      await remote.exec(`cd ${shellQuote(instancePath)} && docker compose ${action}`);
    });

    await db
      .update(gameServerInstances)
      .set({
        status: action === 'stop' ? 'offline' : 'online',
        desiredState: action === 'stop' ? 'offline' : 'online',
        lastError: null,
      })
      .where(eq(gameServerInstances.id, instance.id));

    await recordServerEvent({
      instanceId: instance.id,
      deploymentId: instance.deploymentId,
      type: action,
      message: `Completed ${action}`,
    });
  }

  private async deleteInstance(instanceId: number) {
    const { instance, host } = await this.loadContext(instanceId);
    await db.update(gameServerInstances).set({ status: 'deleting' }).where(eq(gameServerInstances.id, instance.id));

    await this.withRemote(host, async (remote, hostBasePath) => {
      const instancePath = remotePathJoin(hostBasePath, instance.dockerProjectName);
      await remote.exec(`if [ -d ${shellQuote(instancePath)} ]; then cd ${shellQuote(instancePath)} && docker compose down -v; fi`);
      await remote.exec(`rm -rf ${shellQuote(instancePath)}`);
    });

    await db.delete(serverHostPortAllocations).where(eq(serverHostPortAllocations.instanceId, instance.id));
    await db
      .update(gameCredentials)
      .set({ assignedInstanceId: null })
      .where(eq(gameCredentials.assignedInstanceId, instance.id));
    await db
      .update(gameServerInstances)
      .set({
        status: 'deleted',
        desiredState: 'deleted',
        lastError: null,
      })
      .where(eq(gameServerInstances.id, instance.id));

    await recordServerEvent({
      instanceId: instance.id,
      deploymentId: instance.deploymentId,
      type: 'delete',
      message: `Deleted ${instance.name}`,
    });
  }

  private async syncInstanceStatus(instanceId: number) {
    const { instance, host } = await this.loadContext(instanceId);

    await this.withRemote(host, async (remote) => {
      const result = await remote.exec(`docker inspect -f '{{.State.Running}}' ${shellQuote(instance.containerName)} 2>/dev/null || echo false`);
      const isRunning = result.stdout.trim() === 'true';
      await db
        .update(gameServerInstances)
        .set({ status: isRunning ? 'online' : 'offline' })
        .where(eq(gameServerInstances.id, instance.id));
    });
  }
}
