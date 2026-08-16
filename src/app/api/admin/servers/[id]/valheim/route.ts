import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/database';
import { valheimManifests, valheimModConfigs } from '@/lib/db/schema';
import {
  ensureValheimManifest,
  manifestErrorResponse,
  publishValheimManifest,
  validatePackages,
} from '@/lib/valheim-manifest';

function serverId(value: string): number {
  return Number.parseInt(value, 10);
}

export const GET = requireAdmin(async (
  request: NextRequest,
  user,
  segmentData: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await segmentData.params;
    const idNumber = serverId(id);
    const manifest = await ensureValheimManifest(idNumber);
    const configs = await db.select().from(valheimModConfigs)
      .where(eq(valheimModConfigs.server_id, idNumber))
      .orderBy(valheimModConfigs.path, valheimModConfigs.target);
    return NextResponse.json({
      manifest: {
        manifestId: manifest.manifest_id,
        manifestPath: `/api/valheim/manifests/${manifest.manifest_id}?token=${manifest.access_token}`,
        packages: manifest.packages,
        serverRevision: manifest.server_revision,
        clientRevision: manifest.client_revision,
        publishedAt: manifest.published_at,
      },
      configs,
    });
  } catch (error) {
    const result = manifestErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
});

export const PUT = requireAdmin(async (
  request: NextRequest,
  user,
  segmentData: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await segmentData.params;
    const idNumber = serverId(id);
    await ensureValheimManifest(idNumber);
    const body = await request.json();
    const packages = validatePackages(body.packages);
    await db.update(valheimManifests).set({ packages })
      .where(eq(valheimManifests.server_id, idNumber));
    return NextResponse.json({ success: true, packages });
  } catch (error) {
    const result = manifestErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
});

export const POST = requireAdmin(async (
  request: NextRequest,
  user,
  segmentData: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await segmentData.params;
    const manifest = await publishValheimManifest(serverId(id), user.steamId);
    return NextResponse.json({ success: true, manifest });
  } catch (error) {
    const result = manifestErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
});
