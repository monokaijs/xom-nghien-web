import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, like, or } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { db } from '@xom/db';
import { gameConfigurationVersions, gameConfigurations } from '@xom/db';
import { getGameDefinition, listGameDefinitions } from '@xom/game-config';

export const GET = requireAdmin(async (request: NextRequest) => {
  const params = new URL(request.url).searchParams;
  const search = params.get('search') || '';
  const gameKey = params.get('gameKey') || '';
  const gameKeyCondition = gameKey ? eq(gameConfigurations.gameKey, gameKey) : undefined;
  const searchCondition = search ? or(
    like(gameConfigurations.name, `%${search}%`),
    like(gameConfigurations.gameKey, `%${search}%`),
  ) : undefined;
  const whereClause = gameKeyCondition && searchCondition
    ? and(gameKeyCondition, searchCondition)
    : gameKeyCondition || searchCondition;

  const rows = await db
    .select({
      configuration: gameConfigurations,
      version: gameConfigurationVersions,
    })
    .from(gameConfigurations)
    .leftJoin(gameConfigurationVersions, eq(gameConfigurations.currentVersionId, gameConfigurationVersions.id))
    .where(whereClause)
    .orderBy(desc(gameConfigurations.created_at));

  return NextResponse.json({
    gameDefinitions: listGameDefinitions(),
    configurations: rows.map((row) => ({
      ...row.configuration,
      currentVersion: row.version,
    })),
  });
});

export const POST = requireAdmin(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const gameKey = String(body.gameKey || 'cs2').trim();
    const name = String(body.name || '').trim();
    const description = body.description ? String(body.description) : null;
    const isActive = body.isActive !== false ? 1 : 0;
    const definition = getGameDefinition(gameKey);
    const config = definition.validateConfig(body.config);

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      const configInsert = await tx.insert(gameConfigurations).values({
        gameKey: definition.key,
        name,
        description,
        isActive,
        createdBy: user.steamId,
      });
      const configurationId = configInsert[0].insertId;
      const versionInsert = await tx.insert(gameConfigurationVersions).values({
        configurationId,
        versionNumber: 1,
        config,
        createdBy: user.steamId,
      });
      const versionId = versionInsert[0].insertId;
      await tx
        .update(gameConfigurations)
        .set({ currentVersionId: versionId })
        .where(eq(gameConfigurations.id, configurationId));

      return { configurationId, versionId };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error creating game configuration:', error);
    return NextResponse.json({ error: error.message || 'Failed to create configuration' }, { status: 400 });
  }
});
