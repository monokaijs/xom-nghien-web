import { Injectable } from '@nestjs/common';
import { eq } from '@xom/db';
import Rcon from 'rcon';
import { db, gameServerInstances, serverHosts } from '@xom/db';
import { decryptSecret } from '@xom/db/crypto';
import { recordServerEvent } from '../server/events';

@Injectable()
export class RconProcessor {
  async execute(instanceId: number, command: string) {
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
      throw new Error('Instance not found');
    }

    const { instance, host } = rows[0];
    const rconPassword = decryptSecret(instance.encryptedRconPassword);
    const port = instance.queryPort || 27015;
    const responses = await this.send(host.publicAddress, port, rconPassword, command);

    await recordServerEvent({
      instanceId: instance.id,
      deploymentId: instance.deploymentId,
      type: 'rcon_response',
      message: responses.join('\n') || 'Command executed with no response',
      metadata: { command, responses },
    });
  }

  private send(host: string, port: number, password: string, command: string) {
    return new Promise<string[]>((resolve, reject) => {
      const responses: string[] = [];
      let resolved = false;
      const conn = new Rcon(host, port, password);

      const finish = (error?: Error) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        try {
          conn.disconnect();
        } catch {}
        if (error) {
          reject(error);
        } else {
          resolve(responses);
        }
      };

      const timeout = setTimeout(() => finish(new Error('RCON connection timeout')), 10000);

      conn.on('auth', () => conn.send(command));
      conn.on('response', (response: string) => {
        responses.push(response);
        finish();
      });
      conn.on('error', (error: Error) => finish(error));
      conn.on('end', () => finish());

      try {
        conn.connect();
      } catch (error: any) {
        finish(error);
      }
    });
  }
}
