import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SERVER_QUEUE_NAME, getRedisConnectionOptions } from '@xom/queue';
import { HealthController } from './health.controller';
import { ServerQueueProcessor } from './queue/server-queue.processor';
import { HostProcessor } from './server/host.processor';
import { GameServerProcessor } from './server/game-server.processor';
import { RconProcessor } from './rcon/rcon.processor';
import { GameServerLogsController } from './server/logs.controller';

@Module({
  imports: [
    BullModule.forRoot({
      connection: getRedisConnectionOptions(),
    }),
    BullModule.registerQueue({
      name: SERVER_QUEUE_NAME,
    }),
  ],
  controllers: [HealthController, GameServerLogsController],
  providers: [ServerQueueProcessor, HostProcessor, GameServerProcessor, RconProcessor],
})
export class AppModule {}
