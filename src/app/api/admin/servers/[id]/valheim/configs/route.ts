import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/database';
import { valheimModConfigs } from '@/lib/db/schema';
import {
  ensureValheimManifest,
  manifestErrorResponse,
  normalizeConfigContent,
  normalizeConfigPath,
  normalizeConfigTarget,
} from '@/lib/valheim-manifest';

export const POST = requireAdmin(async (
  request: NextRequest,
  user,
  segmentData: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await segmentData.params;
    const serverId = Number.parseInt(id, 10);
    await ensureValheimManifest(serverId);
    const body = await request.json();
    const result = await db.insert(valheimModConfigs).values({
      server_id: serverId,
      path: normalizeConfigPath(body.path),
      content: normalizeConfigContent(body.content),
      target: normalizeConfigTarget(body.target),
      enabled: body.enabled === false ? 0 : 1,
      updated_by: user.steamId,
    });
    return NextResponse.json({ success: true, configId: result[0].insertId });
  } catch (error) {
    const result = manifestErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
});
