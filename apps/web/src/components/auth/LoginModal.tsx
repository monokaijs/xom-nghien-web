"use client";

import React, { useEffect, useId, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { IconX, IconBrandSteam, IconBrandGoogle, IconBrandDiscord, IconBrandGithub } from '@tabler/icons-react';
import Link from 'next/link';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const headingId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const providers = [
    {
      id: 'steam',
      name: 'Steam',
      icon: <IconBrandSteam size={24} />,
      color: 'bg-[#171a21] hover:bg-[#1b2838]',
      textColor: 'text-white',
    },
    {
      id: 'google',
      name: 'Google',
      icon: <IconBrandGoogle size={24} />,
      color: 'bg-white hover:bg-gray-100',
      textColor: 'text-gray-900',
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: <IconBrandDiscord size={24} />,
      color: 'bg-[#5865F2] hover:bg-[#4752C4]',
      textColor: 'text-white',
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: <IconBrandGithub size={24} />,
      color: 'bg-[#24292e] hover:bg-[#2f363d]',
      textColor: 'text-white',
    },
  ];

  const handleLogin = (providerId: string) => {
    signIn(providerId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="bg-gradient-to-br from-[#2b161b] to-[#1a0f12] rounded-[30px] p-8 max-w-md w-full border border-white/10 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id={headingId} className="text-2xl font-bold">Đăng Nhập</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Đóng cửa sổ đăng nhập"
          >
            <IconX size={20} />
          </button>
        </div>

        <p className="text-white/60 mb-6">
          Chọn một phương thức đăng nhập để tiếp tục
        </p>

        <div className="space-y-3">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleLogin(provider.id)}
              className={`w-full ${provider.color} ${provider.textColor} px-6 py-3 rounded-xl flex items-center justify-center gap-3 transition-all font-medium shadow-lg hover:shadow-xl`}
            >
              {provider.icon}
              <span>Đăng nhập với {provider.name}</span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-white/40">
          Bằng cách đăng nhập, bạn đồng ý với <Link href="/terms" onClick={onClose} className="text-white/65 underline">Điều khoản</Link> và <Link href="/privacy" onClick={onClose} className="text-white/65 underline">Chính sách quyền riêng tư</Link>.
        </p>
      </div>
    </div>
  );
}
