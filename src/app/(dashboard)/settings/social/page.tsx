"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { IconBrandFacebook, IconBrandSpotify, IconBrandTwitter, IconBrandInstagram, IconBrandGithub, IconCheck, IconAlertCircle } from '@tabler/icons-react';

interface SocialLinks {
  facebook: string;
  spotify: string;
  twitter: string;
  instagram: string;
  github: string;
}

export default function SocialSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    facebook: '',
    spotify: '',
    twitter: '',
    instagram: '',
    github: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchSocialLinks();
    }
  }, [status, router]);

  const fetchSocialLinks = async () => {
    try {
      const response = await fetch('/api/profile/social-links');
      if (response.ok) {
        const data = await response.json();
        setSocialLinks(data);
      }
    } catch (error) {
      console.error('Error fetching social links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/profile/social-links', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(socialLinks),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Đã lưu liên kết mạng xã hội thành công!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra khi lưu' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (platform: keyof SocialLinks, value: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: value }));
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/50">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Liên Kết Mạng Xã Hội</h2>
        <p className="text-white/50">Thêm liên kết đến các trang mạng xã hội của bạn.</p>
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
        <h3 className="font-bold mb-4">Hồ Sơ Mạng Xã Hội</h3>
        <p className="text-white/60 text-sm mb-6">
          Các liên kết này sẽ hiển thị trên trang hồ sơ công khai của bạn.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <IconBrandFacebook size={20} className="text-[#1877F2]" />
              Facebook
            </label>
            <input
              type="url"
              value={socialLinks.facebook}
              onChange={(e) => handleChange('facebook', e.target.value)}
              placeholder="https://facebook.com/username"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <IconBrandSpotify size={20} className="text-[#1DB954]" />
              Spotify
            </label>
            <input
              type="url"
              value={socialLinks.spotify}
              onChange={(e) => handleChange('spotify', e.target.value)}
              placeholder="https://open.spotify.com/user/username"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>




          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <IconBrandTwitter size={20} className="text-[#1DA1F2]" />
              Twitter / X
            </label>
            <input
              type="url"
              value={socialLinks.twitter}
              onChange={(e) => handleChange('twitter', e.target.value)}
              placeholder="https://twitter.com/username"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <IconBrandInstagram size={20} className="text-[#E4405F]" />
              Instagram
            </label>
            <input
              type="url"
              value={socialLinks.instagram}
              onChange={(e) => handleChange('instagram', e.target.value)}
              placeholder="https://instagram.com/username"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <IconBrandGithub size={20} className="text-white" />
              GitHub
            </label>
            <input
              type="url"
              value={socialLinks.github}
              onChange={(e) => handleChange('github', e.target.value)}
              placeholder="https://github.com/username"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-accent-primary px-6 py-2 rounded-lg text-white font-medium hover:bg-[#ff6b76] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
