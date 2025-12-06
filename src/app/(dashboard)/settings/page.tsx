"use client";

import React, { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { IconBrandGoogle, IconBrandDiscord, IconBrandGithub, IconCheck, IconAlertCircle, IconLink, IconUnlink, IconBrandSteam } from '@tabler/icons-react';

interface OAuthProviders {
  steam: boolean;
  google: boolean;
  discord: boolean;
  github: boolean;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [providers, setProviders] = useState<OAuthProviders>({
    steam: false,
    google: false,
    discord: false,
    github: false,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchProviders();
    }
  }, [status, router]);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/profile/oauth-providers');
      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      }
    } catch (error) {
      console.error('Error fetching OAuth providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (provider: string) => {
    setActionLoading(provider);
    setMessage(null);

    try {
      await signIn(provider, { callbackUrl: '/settings' });
    } catch (error) {
      setMessage({ type: 'error', text: `Không thể liên kết ${provider}` });
      setActionLoading(null);
    }
  };

  const handleUnlink = async (provider: string) => {
    setActionLoading(provider);
    setMessage(null);

    try {
      const response = await fetch(`/api/profile/oauth-providers?provider=${provider}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Đã hủy liên kết ${provider} thành công!` });
        await fetchProviders();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi hủy liên kết' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/50">Đang tải...</div>
      </div>
    );
  }

  const providerConfig = [
    {
      id: 'steam',
      name: 'Steam',
      icon: <IconBrandSteam size={24} className="text-white" />,
      color: 'text-white',
      bgColor: 'bg-[#171a21]',
      connected: providers.steam,
    },
    {
      id: 'google',
      name: 'Google',
      icon: <IconBrandGoogle size={24} className="text-[#4285F4]" />,
      color: 'text-[#4285F4]',
      bgColor: 'bg-[#4285F4]/10',
      connected: providers.google,
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: <IconBrandDiscord size={24} className="text-[#5865F2]" />,
      color: 'text-[#5865F2]',
      bgColor: 'bg-[#5865F2]/10',
      connected: providers.discord,
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: <IconBrandGithub size={24} className="text-white" />,
      color: 'text-white',
      bgColor: 'bg-white/10',
      connected: providers.github,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Bảo Mật Tài Khoản</h2>
        <p className="text-white/50">Quản lý các phương thức đăng nhập của bạn.</p>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {message.type === 'success' ? <IconCheck size={20} /> : <IconAlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
        <h3 className="font-bold mb-4">Nhà Cung Cấp Xác Thực</h3>
        <p className="text-white/60 text-sm mb-6">
          Liên kết tài khoản của bạn với các nhà cung cấp xác thực để đăng nhập dễ dàng hơn.
        </p>

        <div className="space-y-4">
          {providerConfig.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${provider.bgColor} flex items-center justify-center`}>
                  {provider.icon}
                </div>
                <div>
                  <div className="font-medium">{provider.name}</div>
                  <div className="text-sm text-white/50">
                    {provider.connected ? 'Đã liên kết' : 'Chưa liên kết'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {provider.connected ? (
                  <>
                    <div className="flex items-center gap-2 text-green-500 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Đã kết nối</span>
                    </div>
                    {provider.id !== 'steam' && (
                      <button
                        onClick={() => handleUnlink(provider.id)}
                        disabled={actionLoading === provider.id}
                        className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IconUnlink size={18} />
                        <span>{actionLoading === provider.id ? 'Đang hủy...' : 'Hủy liên kết'}</span>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleLink(provider.id)}
                    disabled={actionLoading === provider.id}
                    className="px-4 py-2 rounded-lg bg-accent-primary hover:bg-accent-primary/80 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IconLink size={18} />
                    <span>{actionLoading === provider.id ? 'Đang liên kết...' : 'Liên kết'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

