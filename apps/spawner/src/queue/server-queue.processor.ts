import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import {
  SERVER_JOB_NAMES,
  SERVER_QUEUE_NAME,
  type GameServerJobPayload,
  type RconJobPayload,
  type ServerJobPayload,
  type ValidateHostJobPayload,
} from '@xom/queue';
import { HostProcessor } from '../server/host.processor';
import { GameServerProcessor } from '../server/game-server.processor';
import { RconProcessor } from '../rcon/rcon.processor';
import { recordServerEvent } from '../server/events';

@Processor(SERVER_QUEUE_NAME)
export class ServerQueueProcessor extends WorkerHost {
  constructor(
    private readonly hostProcessor: HostProcessor,
    private readonly gameServerProcessor: GameServerProcessor,
    private readonly rconProcessor: RconProcessor,
  ) {
    super();
  }

  async process(job: Job<ServerJobPayload, unknown, string>) {
    if (job.name === SERVER_JOB_NAMES.validateHost) {
      const payload = job.data as ValidateHostJobPayload;
      await this.hostProcessor.validateHost(payload.hostId, payload.dbJobId);
      return;
    }

    if (job.name === SERVER_JOB_NAMES.rcon) {
      const payload = job.data as RconJobPayload;
      await this.gameServerProcessor.markJobRunning(payload.dbJobId);
      try {
        await this.rconProcessor.execute(payload.instanceId, payload.command);
        await this.gameServerProcessor.markJobSucceeded(payload.dbJobId);
      } catch (error) {
        await this.gameServerProcessor.markJobFailed(payload.dbJobId, payload.instanceId, payload.deploymentId, error, {
          markInstanceFailed: false,
        });
        await recordServerEvent({
          instanceId: payload.instanceId,
          deploymentId: payload.deploymentId,
          type: 'rcon_error',
          level: 'error',
          message: error instanceof Error ? error.message : String(error),
          metadata: { command: payload.command },
        });
        throw error;
      }
      return;
    }

    const payload = job.data as GameServerJobPayload;
    const type = this.mapGameServerJobType(job.name);
    await this.gameServerProcessor.markJobRunning(payload.dbJobId);
    try {
      await this.gameServerProcessor.processAction(type, payload.instanceId);
      await this.gameServerProcessor.markJobSucceeded(payload.dbJobId);
    } catch (error) {
      await this.gameServerProcessor.markJobFailed(payload.dbJobId, payload.instanceId, payload.deploymentId, error);
      throw error;
    } finally {
      await this.gameServerProcessor.refreshDeploymentStatus(payload.deploymentId);
    }
  }

  private mapGameServerJobType(jobName: string) {
    switch (jobName) {
      case SERVER_JOB_NAMES.provision:
        return 'provision';
      case SERVER_JOB_NAMES.start:
        return 'start';
      case SERVER_JOB_NAMES.stop:
        return 'stop';
      case SERVER_JOB_NAMES.restart:
        return 'restart';
      case SERVER_JOB_NAMES.delete:
        return 'delete';
      case SERVER_JOB_NAMES.retry:
        return 'retry';
      case SERVER_JOB_NAMES.syncStatus:
        return 'sync-status';
      default:
        throw new Error(`Unsupported queue job: ${jobName}`);
    }
  }
}
