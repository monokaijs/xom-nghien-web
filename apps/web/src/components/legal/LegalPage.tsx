import Link from 'next/link';
import IconSolid from '@/components/IconSolid';

interface LegalPageProps {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt?: string;
  children: React.ReactNode;
}

export default function LegalPage({
  eyebrow,
  title,
  description,
  updatedAt,
  children,
}: LegalPageProps) {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#1a0f12] text-white">
      <div className="mx-auto min-h-full w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <nav className="mb-12 flex flex-wrap items-center justify-between gap-5" aria-label="Điều hướng pháp lý">
          <Link href="/" className="flex items-center gap-3 font-bold text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <IconSolid className="h-5 w-5" />
            </span>
            Xóm Nghiện
          </Link>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
            <Link href="/privacy" className="hover:text-white">Quyền riêng tư</Link>
            <Link href="/terms" className="hover:text-white">Điều khoản</Link>
            <Link href="/support" className="hover:text-white">Hỗ trợ</Link>
          </div>
        </nav>

        <header className="mb-10 border-b border-white/10 pb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent-primary">{eyebrow}</p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">{description}</p>
          {updatedAt && <p className="mt-4 text-sm text-white/40">Cập nhật lần cuối: {updatedAt}</p>}
        </header>

        <article className="legal-copy space-y-9 text-[15px] leading-7 text-white/70">
          {children}
        </article>

        <footer className="mt-14 border-t border-white/10 pt-6 text-sm text-white/40">
          © {new Date().getFullYear()} Xóm Nghiện
        </footer>
      </div>
    </div>
  );
}
