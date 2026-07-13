import type { Metadata } from 'next';
import { GameServersCard, HeroCard, LatestMatchesCard, LeaderboardCard } from '@/components/cards';
import DashboardColumns from '@/components/game/DashboardColumns';
import GameDirectoryCard from '@/components/game/GameDirectoryCard';
import { getServersWithStatus } from '@/lib/utils/servers';

export const metadata: Metadata = {
  title: 'Counter-Strike 2 | Xóm Nghiện',
  description: 'Máy chủ, bảng xếp hạng và lịch sử trận đấu Counter-Strike 2 của Xóm Nghiện.',
};

export const dynamic = 'force-dynamic';

export default async function CounterStrikePage() {
  const servers = await getServersWithStatus('cs2');

  return (
    <DashboardColumns
      sidebar={(
        <>
          <GameDirectoryCard activeGameId="cs2" />
          <LeaderboardCard />
        </>
      )}
    >
      <HeroCard
        title="Counter-Strike 2"
        description="Vào máy chủ cộng đồng, theo dõi phong độ và xem lại những trận đấu mới nhất của anh em Xóm Nghiện."
        imageUrl="https://cdn.xomnghien.com/agents.webp"
        eyebrow="Xóm Nghiện CS2"
        actionLabel="Kho Đồ"
        actionHref="/cs2/inventory"
        theme="cs2"
      />

      <GameServersCard title="Máy Chủ Counter-Strike 2" initialServers={servers} layout="grid" />

      <LatestMatchesCard />
    </DashboardColumns>
  );
}
