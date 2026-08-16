import type { Metadata } from 'next';
import Cs2InventoryPage from '@/components/game/Cs2InventoryPage';

export const metadata: Metadata = {
  title: 'Kho Đồ CS2 | Xóm Nghiện',
};

export default function InventoryPage() {
  return (
    <div className="h-full min-h-[560px]">
      <Cs2InventoryPage />
    </div>
  );
}
