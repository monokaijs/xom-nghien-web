import type { Metadata } from 'next';
import Link from 'next/link';
import { IconTrophy } from '@tabler/icons-react';
import CommunityLeaderboardList from '@/components/community/CommunityLeaderboardList';
import { getCommunityLeaderboard } from '@/lib/utils/community-leaderboard';
import { normalizeLeaderboardPeriod, type CommunityLeaderboardPeriod } from '@/lib/utils/community-leaderboard-period';
import type { CommunityLeaderboardPlayer } from '@/types/community-leaderboard';

export const metadata: Metadata = {
  title: 'Bảng Xếp Hạng Cộng Đồng | Xóm Nghiện',
  description: 'Bảng xếp hạng người chơi Xóm Nghiện theo điểm hoạt động cộng đồng.',
};

export const dynamic = 'force-dynamic';

const periods: Array<{ id: CommunityLeaderboardPeriod; label: string }> = [
  { id: 'week', label: 'Tuần này' },
  { id: 'month', label: 'Tháng này' },
  { id: 'all', label: 'Tất cả' },
];

export default async function CommunityLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const period = normalizeLeaderboardPeriod((await searchParams).period || 'week');
  let players: CommunityLeaderboardPlayer[] = [];
  let failed = false;

  try {
    players = await getCommunityLeaderboard(100, period);
  } catch (error) {
    console.error('Error rendering community leaderboard:', error);
    failed = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="mb-1 text-sm font-medium text-accent-primary">Cộng Đồng Xóm Nghiện</p>
        <h1 className="text-3xl font-bold max-sm:text-2xl">Bảng Xếp Hạng</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          Điểm hoạt động Discord theo tuần, tháng và toàn bộ thời gian.
        </p>
      </header>

      <section
        className="rounded-[30px] bg-gradient-to-br from-[#2b161b] to-[#1a0f12] p-6 max-sm:p-4"
        aria-labelledby="community-ranking-heading"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/15 text-accent-primary">
              <IconTrophy size={21} aria-hidden="true" />
            </span>
            <div>
              <h2 id="community-ranking-heading" className="text-xl font-bold">Điểm Người Chơi</h2>
              <p className="text-xs text-white/50">Top 100 người chơi</p>
            </div>
          </div>
          <nav className="flex rounded-xl bg-black/20 p-1" aria-label="Khoảng thời gian bảng xếp hạng">
            {periods.map((item) => (
              <Link
                key={item.id}
                href={`/leaderboard?period=${item.id}`}
                aria-current={period === item.id ? 'page' : undefined}
                className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                  period === item.id ? 'bg-accent-primary text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {failed ? (
          <p className="py-12 text-center text-white/50" role="alert">Chưa thể tải bảng xếp hạng.</p>
        ) : players.length === 0 ? (
          <p className="py-12 text-center text-white/50">Chưa có người chơi trong bảng xếp hạng.</p>
        ) : (
          <CommunityLeaderboardList players={players} />
        )}
      </section>
    </div>
  );
}
