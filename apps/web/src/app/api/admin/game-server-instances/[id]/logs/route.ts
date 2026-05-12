import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

function normalizeTail(value: string | null) {
  const parsed = Number(value || 300);
  if (!Number.isInteger(parsed) || parsed < 1) return 300;
  return Math.min(parsed, 1000);
}

export const GET = requireAdmin(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ id: string }> },
) => {
  const spawnerUrl = process.env.SPAWNER_INTERNAL_URL;
  const serverSecret = process.env.SERVER_SECRET_KEY;

  if (!spawnerUrl || !serverSecret) {
    return NextResponse.json(
      { error: 'Spawner log proxy is not configured' },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const tail = normalizeTail(new URL(request.url).searchParams.get('tail'));
  const target = new URL(`/internal/game-server-instances/${id}/logs`, spawnerUrl);
  target.searchParams.set('tail', String(tail));

  try {
    const response = await fetch(target, {
      headers: {
        'x-server-secret': serverSecret,
      },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch server logs' },
      { status: 503 },
    );
  }
});
