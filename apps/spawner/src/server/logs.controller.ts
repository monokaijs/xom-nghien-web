import { Controller, Get, Headers, NotFoundException, Param, Query, UnauthorizedException } from '@nestjs/common';
import { eq } from '@xom/db';
import { db, gameServerInstances, serverHosts } from '@xom/db';
import { RemoteDockerHost, getSshConfig, shellQuote } from './remote-docker-host';

function normalizeTail(value: string | undefined) {
  const parsed = Number(value || 300);
  if (!Number.isInteger(parsed) || parsed < 1) return 300;
  return Math.min(parsed, 1000);
}

@Controller('/internal/game-server-instances')
export class GameServerLogsController {
  @Get('/:id/logs')
  async logs(
    @Param('id') id: string,
    @Query('tail') tailQuery: string | undefined,
    @Headers('x-server-secret') serverSecret: string | undefined,
  ) {
    if (!process.env.SERVER_SECRET_KEY || serverSecret !== process.env.SERVER_SECRET_KEY) {
      throw new UnauthorizedException('Invalid server secret');
    }

    const rows = await db
      .select({
        instance: gameServerInstances,
        host: serverHosts,
      })
      .from(gameServerInstances)
      .innerJoin(serverHosts, eq(gameServerInstances.hostId, serverHosts.id))
      .where(eq(gameServerInstances.id, Number(id)))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('Server instance not found');
    }

    const { instance, host } = rows[0];
    const remote = new RemoteDockerHost(getSshConfig(host));
    const tail = normalizeTail(tailQuery);

    try {
      await remote.connect();
      const result = await remote.exec(
        `docker logs --timestamps --tail ${tail} ${shellQuote(instance.containerName)} 2>&1 || true`,
      );
      const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();

      return {
        logs: output ? output.split(/\r?\n/) : [],
        fetchedAt: new Date().toISOString(),
      };
    } finally {
      await remote.dispose();
    }
  }
}
