"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { IconLock } from '@tabler/icons-react';

export default function InventoryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [inventoryUrl, setInventoryUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventoryToken = async () => {
      if (status === 'loading') return;

      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/auth/inventory-token');
        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setInventoryUrl(data.url);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to generate inventory token');
        }
      } catch (err) {
        console.error('Error fetching inventory token:', err);
        setError('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryToken();
  }, [session, status]);

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-white/50">Đang tải kho đồ...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
            <IconLock size={40} className="text-white/50" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Yêu Cầu Đăng Nhập</h2>
            <p className="text-white/50 mb-6">Bạn cần đăng nhập để truy cập kho đồ</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-accent-primary rounded-lg hover:bg-[#ff6b76] transition-colors"
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-white/50">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-accent-primary rounded-lg hover:bg-[#ff6b76] transition-colors"
          >
            Thử Lại
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!inventoryUrl) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-white/50">Không thể tải kho đồ</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <div className="flex-1 bg-gradient-to-br from-[#2b161b] to-[#1a0f12] rounded-[30px] overflow-hidden">
          <iframe
            src={inventoryUrl}
            className="w-full h-full border-0"
            title="Kho Đồ"
            allow="clipboard-write"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

