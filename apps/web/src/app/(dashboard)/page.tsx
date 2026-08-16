import React from 'react';
import { CommunityLeaderboardCard, GameServersCard, HeroCard } from '@/components/cards';
import DashboardColumns from '@/components/game/DashboardColumns';
import GameDirectoryCard from '@/components/game/GameDirectoryCard';

export default function Dashboard() {
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

      <GameServersCard layout="grid" />
    </DashboardColumns>
  );
}
