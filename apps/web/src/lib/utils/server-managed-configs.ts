import { asc, db, inArray, serverManagedConfigs } from '@xom/db';
import type { ServerManagedConfig } from '@/types/server';

export async function getServerManagedConfigsById(serverIds: number[]) {
  const result = new Map<number, ServerManagedConfig[]>();
  for (const id of serverIds) result.set(id, []);
  if (serverIds.length === 0) return result;

  const rows = await db.select().from(serverManagedConfigs)
    .where(inArray(serverManagedConfigs.serverId, serverIds))
    .orderBy(asc(serverManagedConfigs.sortOrder), asc(serverManagedConfigs.id));
  for (const row of rows) {
    result.get(row.serverId)?.push({ path: row.path, contents: row.contents, sha256: row.sha256 });
  }
  return result;
}
