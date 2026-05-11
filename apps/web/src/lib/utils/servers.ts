import { db } from '@xom/db';
import { gameConfigurations, gameServerInstances, serverHosts } from '@xom/db';
import { desc, eq, inArray } from '@xom/db';

export async function getServersWithStatus() {
  try {
    const rows = await db
      .select({
        instance: gameServerInstances,
        host: serverHosts,
        configurationName: gameConfigurations.name,
      })
      .from(gameServerInstances)
      .innerJoin(serverHosts, eq(gameServerInstances.hostId, serverHosts.id))
      .innerJoin(gameConfigurations, eq(gameServerInstances.configurationId, gameConfigurations.id))
      .where(inArray(gameServerInstances.status, ['online', 'offline', 'provisioning', 'queued', 'failed']))
      .orderBy(desc(gameServerInstances.created_at));

    return rows.map(({ instance, host, configurationName }) => {
      const address = instance.connectAddress || `${host.publicAddress}:${instance.queryPort || 27015}`;
      const [ip, portText] = address.split(':');
      const maxPlayers = Number((instance.configSnapshot as any)?.maxPlayers || 0);

      return {
        id: instance.id.toString(),
        name: configurationName || instance.name,
        type: instance.gameKey,
        ip,
        port: Number(portText || instance.queryPort || 27015),
        online: instance.status === 'online',
        map: String((instance.configSnapshot as any)?.map || ''),
        players: {
          current: 0,
          max: maxPlayers,
          list: [],
        },
        lastUpdated: new Date().toISOString(),
        error: instance.lastError || undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching deployed servers:', error);
    return [];
  }
}
