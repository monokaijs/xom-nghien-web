'use client';

import { Suspense, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { IconBrandDiscord, IconCheck, IconLink } from '@tabler/icons-react';

function DiscordConnectContent() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const callbackUrl = `/connect/discord?token=${encodeURIComponent(token)}`;

  async function confirmLink() {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/profile/discord-link/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const body = await response.json() as { error?: string; creditedPoints?: number };
      if (!response.ok) throw new Error(body.error || 'Không thể kết nối Discord.');
      const credited = Number(body.creditedPoints || 0);
      setResult({
        success: true,
        message: credited > 0
          ? `Đã kết nối và cộng ${credited.toLocaleString('vi-VN')} điểm hoạt động trước đó.`
          : 'Đã kết nối tài khoản Discord thành công.',
      });
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : 'Có lỗi xảy ra.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <header>
        <p className="mb-1 text-sm font-medium text-[#5865F2]">Tài khoản cộng đồng</p>
        <h1 className="text-3xl font-bold">Kết nối Discord</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Xác nhận để điểm tin nhắn và thời gian voice được ghi nhận cho tài khoản này.
        </p>
      </header>

      <section className="rounded-[30px] border border-white/5 bg-gradient-to-br from-[#2b161b] to-[#1a0f12] p-7">
        <div className="mb-6 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5865F2]/15 text-[#5865F2]">
            <IconBrandDiscord size={30} />
          </span>
          <div>
            <h2 className="font-bold">Discord Xóm Nghiện</h2>
            <p className="text-sm text-white/50">Liên kết dùng một lần, hết hạn sau 10 phút</p>
          </div>
        </div>

        {!token ? (
          <p className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
            Liên kết không hợp lệ. Hãy chạy lại lệnh <code>/link</code> trong Discord.
          </p>
        ) : status === 'loading' ? (
          <p className="py-4 text-center text-white/50">Đang kiểm tra đăng nhập...</p>
        ) : status === 'unauthenticated' ? (
          <button
            type="button"
            onClick={() => signIn(undefined, { callbackUrl })}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-primary px-5 py-3 font-medium text-white transition-colors hover:bg-accent-primary/80"
          >
            <IconLink size={20} />
            Đăng nhập để tiếp tục
          </button>
        ) : result?.success ? (
          <div className="rounded-xl bg-green-500/10 p-5 text-green-400">
            <div className="flex items-center gap-2 font-medium"><IconCheck size={20} /> Hoàn tất</div>
            <p className="mt-2 text-sm">{result.message}</p>
            <Link href="/leaderboard" className="mt-4 inline-block text-sm underline">Xem bảng xếp hạng</Link>
          </div>
        ) : (
          <>
            {result && <p className="mb-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-400">{result.message}</p>}
            <button
              type="button"
              onClick={confirmLink}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-5 py-3 font-medium text-white transition-colors hover:bg-[#4752C4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconBrandDiscord size={20} />
              {loading ? 'Đang kết nối...' : 'Xác nhận kết nối Discord'}
            </button>
          </>
        )}
      </section>
    </div>
  );
}

export default function DiscordConnectPage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-white/50">Đang tải liên kết...</p>}>
      <DiscordConnectContent />
    </Suspense>
  );
}
