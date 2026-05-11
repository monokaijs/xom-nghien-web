import { NextRequest, NextResponse } from 'next/server';
import { desc } from '@xom/db';
import { requireAdmin } from '@/lib/auth';
import { db } from '@xom/db';
import { gameServerDeployments } from '@xom/db';
import { createGameServerDeployment } from '@/lib/server-management/deployments';

export const GET = requireAdmin(async () => {
  const deployments = await db
    .select()
    .from(gameServerDeployments)
    .orderBy(desc(gameServerDeployments.created_at))
    .limit(100);

  return NextResponse.json({ deployments });
});

export const POST = requireAdmin(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const result = await createGameServerDeployment({
      configurationIds: body.configurationIds,
      hostIds: body.hostIds,
      createdBy: user.steamId,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error creating game server deployment:', error);
    return NextResponse.json({ error: error.message || 'Failed to create deployment' }, { status: 400 });
  }
});
