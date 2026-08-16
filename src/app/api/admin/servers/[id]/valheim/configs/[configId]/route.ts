import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/database';
import { valheimModConfigs } from '@/lib/db/schema';
import {
  ensureValheimManifest,
  manifestErrorResponse,
  normalizeConfigContent,
  normalizeConfigPath,
  normalizeConfigTarget,
  ValheimManifestError,
} from '@/lib/valheim-manifest';

async function ids(segmentData: { params: Promise<{ id: string; configId: string }> }) {
  const params = await segmentData.params;
  const serverId = Number.parseInt(params.id, 10);
  const configId = Number.parseInt(params.configId, 10);
  await ensureValheimManifest(serverId);
  if (!Number.isInteger(configId) || configId <= 0) throw new ValheimManifestError('Invalid config id');
  return { serverId, configId };
}

export const PUT = requireAdmin(async (
  request: NextRequest,
  user,
  segmentData: { params: Promise<{ id: string; configId: string }> },
) => {
  try {
    const { serverId, configId } = await ids(segmentData);
    const body = await request.json();
    const result = await db.update(valheimModConfigs).set({
      path: normalizeConfigPath(body.path),
      content: normalizeConfigContent(body.content),
      target: normalizeConfigTarget(body.target),
      enabled: body.enabled === false ? 0 : 1,
      updated_by: user.steamId,
    }).where(and(eq(valheimModConfigs.id, configId), eq(valheimModConfigs.server_id, serverId)));
    if (result[0].affectedRows === 0) throw new ValheimManifestError('Config not found', 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = manifestErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
});

export const DELETE = requireAdmin(async (
  request: NextRequest,
  user,
  segmentData: { params: Promise<{ id: string; configId: string }> },
) => {
  try {
    const { serverId, configId } = await ids(segmentData);
    const result = await db.delete(valheimModConfigs)
      .where(and(eq(valheimModConfigs.id, configId), eq(valheimModConfigs.server_id, serverId)));
    if (result[0].affectedRows === 0) throw new ValheimManifestError('Config not found', 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = manifestErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
});
