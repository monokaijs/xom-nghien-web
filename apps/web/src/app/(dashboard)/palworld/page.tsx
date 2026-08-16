import type { Metadata } from 'next';
import { GameServersCard, HeroCard } from '@/components/cards';
import DashboardColumns from '@/components/game/DashboardColumns';
import GameDirectoryCard from '@/components/game/GameDirectoryCard';

export const metadata: Metadata = {
  title: 'Palworld | Xóm Nghiện',
  description: 'Danh sách máy chủ Palworld của cộng đồng Xóm Nghiện.',
};

export default function PalworldPage() {
  return (
    <DashboardColumns sidebar={<GameDirectoryCard activeGameId="palworld" />} stackSidebarOnTablet>
      <HeroCard
        title="Palworld"
        description="Cùng xây căn cứ, săn Pal và khám phá thế giới mở trên máy chủ cộng đồng Xóm Nghiện."
        imageUrl="/images/ragnahawk.png"
        imageAlt="Ragnahawk bay qua thẻ giới thiệu Palworld"
        eyebrow="Máy chủ cộng đồng"
        actionLabel="Xem Máy Chủ"
        actionHref="#servers"
        theme="palworld"
        imageFit="contain"
      />

      <GameServersCard title="Máy Chủ Palworld" gameId="palworld" layout="grid" />
    </DashboardColumns>
  );
}
