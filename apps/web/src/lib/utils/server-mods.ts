import { asc, db, inArray, serverMods } from '@xom/db';
import { toServerMod } from '@/lib/server-mods';
import type { ServerMod } from '@/types/server';

export async function getServerModsById(serverIds: number[]) {
  const result = new Map<number, ServerMod[]>();
  for (const id of serverIds) result.set(id, []);
  if (serverIds.length === 0) return result;

  const rows = await db.select().from(serverMods)
    .where(inArray(serverMods.serverId, serverIds))
    .orderBy(asc(serverMods.sortOrder), asc(serverMods.id));

  for (const row of rows) {
    result.get(row.serverId)?.push(toServerMod(row));
  }
  return result;
}
