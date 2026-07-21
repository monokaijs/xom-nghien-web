import type { Metadata } from 'next';
import { GameServersCard, HeroCard } from '@/components/cards';
import DashboardColumns from '@/components/game/DashboardColumns';
import GameDirectoryCard from '@/components/game/GameDirectoryCard';

export const metadata: Metadata = {
  title: 'Valheim | Xóm Nghiện',
  description: 'Danh sách máy chủ Valheim của cộng đồng Xóm Nghiện.',
};

export default function ValheimPage() {
  return (
    <DashboardColumns sidebar={<GameDirectoryCard activeGameId="valheim" />} stackSidebarOnTablet>
      <HeroCard
        title="Valheim"
        description="Sinh tồn, dựng căn cứ và chinh phục Cửu Giới cùng anh em Xóm Nghiện."
        imageUrl="/images/valheim.png"
        imageAlt="Hai chiến binh Valheim"
        eyebrow="Máy chủ cộng đồng"
        actionLabel="Xem Máy Chủ"
        actionHref="#servers"
        theme="valheim"
        imageFit="contain"
      />

      <GameServersCard title="Máy Chủ Valheim" gameId="valheim" layout="grid" />
    </DashboardColumns>
  );
}
