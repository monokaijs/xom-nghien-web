import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { db } from '@xom/db';
import { gameConfigurationVersions, gameConfigurations } from '@xom/db';
import { getGameDefinition } from '@xom/game-config';

export const GET = requireAdmin(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const configurationId = Number(id);
  const rows = await db
    .select({
      configuration: gameConfigurations,
      currentVersion: gameConfigurationVersions,
    })
    .from(gameConfigurations)
    .leftJoin(gameConfigurationVersions, eq(gameConfigurations.currentVersionId, gameConfigurationVersions.id))
    .where(eq(gameConfigurations.id, configurationId))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
  }

  const versions = await db
    .select()
    .from(gameConfigurationVersions)
    .where(eq(gameConfigurationVersions.configurationId, configurationId))
    .orderBy(desc(gameConfigurationVersions.versionNumber));

  return NextResponse.json({
    configuration: {
      ...rows[0].configuration,
      currentVersion: rows[0].currentVersion,
      versions,
    },
  });
});

export const PUT = requireAdmin(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  const configurationId = Number(id);
  const existing = await db
    .select()
    .from(gameConfigurations)
    .where(eq(gameConfigurations.id, configurationId))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const description = body.description ? String(body.description) : null;
    const isActive = body.isActive !== false ? 1 : 0;
    const definition = getGameDefinition(existing[0].gameKey);
    const config = definition.validateConfig(body.config);

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const versionId = await db.transaction(async (tx) => {
      const versions = await tx
        .select()
        .from(gameConfigurationVersions)
        .where(eq(gameConfigurationVersions.configurationId, configurationId))
        .orderBy(desc(gameConfigurationVersions.versionNumber))
        .limit(1);
      const nextVersion = (versions[0]?.versionNumber || 0) + 1;
      const versionInsert = await tx.insert(gameConfigurationVersions).values({
        configurationId,
        versionNumber: nextVersion,
        config,
        createdBy: user.steamId,
      });
      const newVersionId = versionInsert[0].insertId;
      await tx
        .update(gameConfigurations)
        .set({
          name,
          description,
          isActive,
          currentVersionId: newVersionId,
        })
        .where(eq(gameConfigurations.id, configurationId));
      return newVersionId;
    });

    return NextResponse.json({ success: true, versionId });
  } catch (error: any) {
    console.error('Error updating game configuration:', error);
    return NextResponse.json({ error: error.message || 'Failed to update configuration' }, { status: 400 });
  }
});

export const DELETE = requireAdmin(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> },
) => {
  const { id } = await context.params;
  await db
    .update(gameConfigurations)
    .set({ isActive: 0 })
    .where(eq(gameConfigurations.id, Number(id)));
  return NextResponse.json({ success: true });
});
