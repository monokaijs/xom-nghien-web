import React from 'react';
import { GameServersCard, HeroCard, LatestMatchesCard, LeaderboardCard } from '@/components/cards';
import { IconChevronRight } from '@tabler/icons-react';
import { Games } from "@/config/games";
import { getServersWithStatus } from '@/lib/utils/servers';
import { getMatches } from '@/lib/utils/matches';
import { getLeaderboard } from '@/lib/utils/leaderboard';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export default async function Dashboard() {
  const [servers, matchesData, leaderboardData] = await Promise.all([
    getServersWithStatus(),
    getMatches(5, 0),
    getLeaderboard(),
  ]);

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-[30px] max-lg:grid-cols-1 max-lg:overflow-y-auto">
      {/* Left Column */}
      <div className="flex flex-col gap-5 min-w-0 min-h-0">
        {/* Hero Card */}
        <HeroCard
          title="Tham gia Discord"
          description="Tham gia cộng đồng Discord để giao lưu cùng nhau, tham gia các Give Away và Giải đấu CS2, AOE để nhận nhiều phần thưởng thú vị."
          imageUrl="/agents.png"
        />

        {/* Game Servers */}
        <GameServersCard initialServers={servers} />

        {/* Latest Matches */}
        <LatestMatchesCard initialMatches={matchesData.matches} />
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-[30px] max-lg:grid max-lg:grid-cols-2 max-lg:gap-[30px] max-md:grid-cols-1">
        {/* Game List */}
        <div className="flex flex-col gap-[15px]">
          {Games.map((game) => (
            <div
              key={game.id}
              className="bg-bg-dark p-2.5 rounded-[20px] flex items-center gap-[15px] transition-colors duration-300 hover:bg-card-bg cursor-pointer"
            >
              <img src={game.image} alt={game.name} className="w-[50px] h-[50px] rounded-xl object-cover" />
              <div className="flex-1">
                <h4 className="text-sm font-medium">{game.name}</h4>
              </div>
              <IconChevronRight size={24} />
            </div>
          ))}
        </div>

        {/* Leaderboard */}
        <LeaderboardCard initialData={leaderboardData} />
      </div>
    </div>
  );
}

