"use client";

import React from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {IconDashboard, IconSettings, IconUsers, IconTrophy, IconServer, IconTerminal} from '@tabler/icons-react';

export default function AdminLayout({
                                      children,
                                    }: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Tổng Quan',
      href: '/admin',
      icon: <IconDashboard size={20}/>,
      exact: true,
    },
    {
      label: 'Quản Lý Người Dùng',
      href: '/admin/users',
      icon: <IconUsers size={20}/>,
    },
    {
      label: 'Quản Lý Trận Đấu',
      href: '/admin/matches',
      icon: <IconTrophy size={20}/>,
    },
    {
      label: 'Giải Đấu CS2',
      href: '/admin/tournaments',
      icon: <IconTrophy size={20}/>,
    },
    {
      label: 'Quản Lý Server',
      href: '/admin/servers',
      icon: <IconServer size={20}/>,
    },
    {
      label: 'RCON Console',
      href: '/admin/rcon',
      icon: <IconTerminal size={20}/>,
    },
    {
      label: 'Cài Đặt Hệ Thống',
      href: '/admin/settings',
      icon: <IconSettings size={20}/>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-bg-sidebar/50 rounded-[20px] p-4 flex flex-col gap-2 border border-white/5 h-fit">
          <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 px-3">Menu Admin</div>
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive
                  ? 'bg-accent-primary text-white font-medium shadow-lg shadow-accent-primary/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </aside>

        {/* Admin Content */}
        <div className="flex-1 bg-bg-sidebar/30 rounded-[20px] border border-white/5 p-6 overflow-y-auto min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
