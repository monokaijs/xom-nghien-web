import Link from 'next/link';
import { IconChevronRight } from '@tabler/icons-react';
import { Games, type GameId } from '@/config/games';

interface GameDirectoryCardProps {
  activeGameId?: GameId;
}

export default function GameDirectoryCard({ activeGameId }: GameDirectoryCardProps) {
  return (
    <section aria-labelledby="game-directory-title" className="flex flex-col gap-3">
      <div>
        <h2 id="game-directory-title" className="text-lg font-semibold">Trò Chơi</h2>
        <p className="mt-1 text-xs text-text-secondary">Chọn game để khám phá máy chủ và hoạt động cộng đồng.</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {Games.map((game) => {
          const isActive = game.id === activeGameId;
          const content = (
            <>
              <span className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl border ${
                isActive ? 'border-accent-primary/70 bg-accent-primary/10' : 'border-white/5 bg-white/5'
              }`}>
                <img src={game.image} alt="" className="h-full w-full object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{game.name}</span>
                <span className={`mt-0.5 block text-xs ${isActive ? 'text-accent-primary' : 'text-text-secondary'}`}>
                  {isActive ? 'Đang xem' : 'Khám phá'}
                </span>
              </span>
              <IconChevronRight size={20} className={isActive ? 'text-accent-primary' : 'text-white/35'} />
            </>
          );

          return (
            <Link
              key={game.id}
              href={game.href}
              aria-current={isActive ? 'page' : undefined}
              className={`group flex items-center gap-3 rounded-[18px] border p-2.5 transition-all duration-200 ${
                isActive
                  ? 'border-accent-primary/25 bg-accent-primary/10'
                  : 'border-transparent bg-bg-sidebar/55 hover:border-white/10 hover:bg-card-bg'
              }`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
