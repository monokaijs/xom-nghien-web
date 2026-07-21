import React from 'react';
import { CommunityLeaderboardCard, GameServersCard, HeroCard, LatestMatchesCard } from '@/components/cards';
import DashboardColumns from '@/components/game/DashboardColumns';
import GameDirectoryCard from '@/components/game/GameDirectoryCard';
import { getServersWithStatus } from '@/lib/utils/servers';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const servers = await getServersWithStatus();

  return (
    <DashboardColumns
      sidebar={(
        <>
          <GameDirectoryCard />
          <CommunityLeaderboardCard />
        </>
      )}
    >
      <HeroCard
        title="Tham gia Discord"
        description="Tham gia cộng đồng Discord để giao lưu cùng nhau, tham gia các Give Away và Giải đấu CS2, AOE để nhận nhiều phần thưởng thú vị."
        imageUrl="https://cdn.xomnghien.com/agents.webp"
      />

      <GameServersCard initialServers={servers} layout="grid" />

      <LatestMatchesCard />
    </DashboardColumns>
  );
}
