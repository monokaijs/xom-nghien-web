"use client";

import React, { useState, useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import {
  IconBell,
  IconHome,
  IconLogin,
  IconLogout,
  IconMenu2,
  IconPackage,
  IconSearch,
  IconX,
  IconSettings,
  IconShield,
  IconHeadphones,
} from '@tabler/icons-react';
import IconSolid from "@/components/IconSolid";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import LoginModal from '@/components/auth/LoginModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showFloatingNav, setShowFloatingNav] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting());
  const pathname = usePathname();
  const dashboardThemeClass = pathname === '/valheim' || pathname.startsWith('/valheim/')
    ? 'theme-valheim'
    : pathname === '/palworld' || pathname.startsWith('/palworld/')
      ? 'theme-palworld'
      : '';
  const mainRef = useRef<HTMLElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLElement>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setGreeting(getGreeting());
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    const handleScroll = () => {
      if (mainElement.scrollTop > 100) {
        setShowFloatingNav(true);
      } else {
        setShowFloatingNav(false);
      }
    };

    mainElement.addEventListener('scroll', handleScroll);
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    mobileCloseButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsMobileMenuOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !mobileDrawerRef.current) return;

      const focusableElements = Array.from(
        mobileDrawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      mobileMenuButtonRef.current?.focus();
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <div className={`${dashboardThemeClass} fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 max-md:hidden ${showFloatingNav ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none invisible'}`}>
        <div className="bg-bg-sidebar/95 backdrop-blur-md px-6 py-3 rounded-[20px] flex items-center gap-5 shadow-2xl border border-white/10 w-max">
          <div className="text-base font-normal text-[#aaa] whitespace-nowrap">
            {isLoading ? (
              <span>Đang tải...</span>
            ) : session?.user ? (
              <span>{greeting}, <span className="text-white font-bold">{session.user.name || 'Người chơi'}</span></span>
            ) : (
              <span>{greeting}, <span className="text-white font-bold">Khách</span></span>
            )}
          </div>
          <button
            className="bg-card-bg border-none w-9 h-9 rounded-full text-white flex items-center justify-center cursor-pointer relative hover:bg-[#4a2a30] transition-colors flex-shrink-0">
            <IconBell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent-primary rounded-full"></span>
          </button>
          {!isLoading && (
            session?.user ? (
              <button
                onClick={() => signOut()}
                className="bg-accent-primary border-none px-4 py-2 rounded-full text-white flex items-center gap-2 cursor-pointer hover:bg-[#ff6b76] transition-colors text-sm whitespace-nowrap flex-shrink-0"
                title="Đăng xuất"
              >
                <IconLogout size={18} />
                <span>Đăng Xuất</span>
              </button>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-accent-primary border-none px-4 py-2 rounded-full text-white flex items-center gap-2 cursor-pointer hover:bg-[#ff6b76] transition-colors text-sm whitespace-nowrap flex-shrink-0"
                title="Đăng nhập"
              >
                <IconLogin size={18} />
                <span>Đăng Nhập</span>
              </button>
            )
          )}
        </div>
      </div>

      <header
        className={`${dashboardThemeClass} hidden max-md:flex fixed top-0 left-0 right-0 z-50 bg-bg-sidebar h-16 items-center justify-between px-5 border-b border-white/5`}>
        <button
          ref={mobileMenuButtonRef}
          onClick={() => setIsMobileMenuOpen(true)}
          className="w-10 h-10 flex items-center justify-center text-white"
          aria-label="Mở menu điều hướng"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          <IconMenu2 size={24} />
        </button>
        <div className="w-8 h-8 bg-white text-black font-black text-lg flex items-center justify-center rounded-lg">
          <IconSolid className={'w-5 h-5'} />
        </div>
        {!isLoading && !session?.user ? (
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/5"
            aria-label="Đăng nhập"
          >
            <IconLogin size={22} />
          </button>
        ) : (
          <div className="w-10 h-10" aria-hidden="true" />
        )}
      </header>
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="hidden max-md:block fixed inset-0 bg-black/60 z-[60]"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Drawer */}
          <aside
            ref={mobileDrawerRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Menu điều hướng"
            className={`${dashboardThemeClass} hidden max-md:flex fixed left-0 top-0 bottom-0 w-64 bg-bg-sidebar z-[70] flex-col overflow-y-auto p-5`}
          >
            <div className="flex items-center justify-between mb-10">
              <div
                className="w-10 h-10 bg-white text-black font-black text-2xl flex items-center justify-center rounded-lg">
                <IconSolid className={'w-5 h-5'} />
              </div>
              <button
                ref={mobileCloseButtonRef}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-white"
                aria-label="Đóng menu điều hướng"
              >
                <IconX size={24} />
              </button>
            </div>

            <nav className="flex flex-col gap-5 flex-1">
              <Link href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 transition-colors duration-300 p-3 rounded-lg hover:bg-white/5 ${pathname === '/' ? 'text-accent-primary' : 'text-text-secondary hover:text-accent-primary'
                  }`}>
                <IconHome size={24} />
                <span>Trang Chủ</span>
              </Link>
              <Link href="/voice"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 transition-colors duration-300 p-3 rounded-lg hover:bg-white/5 ${pathname === '/voice' ? 'text-accent-primary' : 'text-text-secondary hover:text-accent-primary'}`}>
                <IconHeadphones size={24} />
                <span>Voice Rooms</span>
              </Link>
              {session?.user && (
                <>
                  <Link href="/cs2/inventory"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-current={pathname === '/cs2/inventory' ? 'page' : undefined}
                    className={`flex items-center gap-4 transition-colors duration-300 p-3 rounded-lg hover:bg-white/5 ${pathname === '/cs2/inventory' ? 'text-accent-primary' : 'text-text-secondary hover:text-accent-primary'
                      }`}>
                    <IconPackage size={24} />
                    <span>Kho Đồ CS2</span>
                  </Link>
                  <Link href="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 transition-colors duration-300 p-3 rounded-lg hover:bg-white/5 ${pathname === '/settings' ? 'text-accent-primary' : 'text-text-secondary hover:text-accent-primary'
                      }`}>
                    <IconSettings size={24} />
                    <span>Cài Đặt</span>
                  </Link>
                </>
              )}
            </nav>

            {!isLoading && !session?.user && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-accent-primary px-4 py-3 font-medium text-white transition-colors hover:bg-[#ff6b76]"
              >
                <IconLogin size={20} />
                <span>Đăng Nhập</span>
              </button>
            )}

            {session?.user && session.user.steamId && (
              <div className="p-4 border-t border-white/10">
                <Link href={`/player/${session.user.steamId}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#555] border-2 border-white/10">
                    <img
                      src={session.user.avatar || session.user.image || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
                      alt={session.user.name || 'User'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{session.user.name}</p>
                    <p className="text-text-secondary text-sm">Người Chơi Steam</p>
                  </div>
                </Link>
              </div>
            )}
          </aside>
        </>
      )}

      <div
        className={`${dashboardThemeClass} flex w-[95vw] h-[90vh] bg-bg-dark rounded-[40px] overflow-hidden shadow-2xl max-lg:w-full max-lg:h-dvh max-lg:rounded-none max-md:flex-col max-md:overflow-y-auto max-md:pt-16 max-md:p-0 max-md:w-full max-md:rounded-none`}>
        <aside className="w-20 m-5 mr-0 bg-bg-sidebar flex flex-col items-center py-5 rounded-[30px] max-md:hidden">
          <Link href={"/"}>
            <div
              className="w-10 h-10 bg-white text-black font-black text-2xl flex items-center justify-center rounded-[10px] mb-10">
              <IconSolid className={'w-5 h-5'} />
            </div>
          </Link>
          <nav className="flex flex-col gap-[30px] flex-1">
            <Link
              href="/"
              className={`transition-colors duration-300 flex items-center justify-center ${pathname === '/' ? 'text-accent-primary' : 'text-text-secondary hover:text-accent-primary'
                }`}
              title="Trang Chủ"
            >
              <IconHome size={24} />
            </Link>
            <Link
              href="/voice"
              className={`transition-colors duration-300 flex items-center justify-center ${pathname === '/voice' ? 'text-accent-primary' : 'text-text-secondary hover:text-accent-primary'}`}
              title="Voice Rooms"
            >
              <IconHeadphones size={24} />
            </Link>
            {session?.user && (
              <Link
                href="/cs2/inventory"
                aria-current={pathname === '/cs2/inventory' ? 'page' : undefined}
                className={`transition-colors duration-300 flex items-center justify-center ${pathname === '/cs2/inventory' ? 'text-accent-primary' : 'text-text-secondary hover:text-accent-primary'
                  }`}
                title="Kho Đồ CS2"
              >
                <IconPackage size={24} />
              </Link>
            )}
          </nav>
          {session?.user && (
            <>
              {session.user.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`transition-colors duration-300 flex items-center justify-center mb-4 ${pathname?.startsWith('/admin') ? 'text-accent-primary' : 'text-text-secondary hover:text-accent-primary'
                    }`}
                  title="Quản Trị"
                >
                  <IconShield size={20} />
                </Link>
              )}
              <Link
                href="/settings"
                className={`transition-colors duration-300 flex items-center justify-center mb-4 ${pathname === '/settings' ? 'text-accent-primary' : 'text-text-secondary hover:text-accent-primary'
                  }`}
                title="Cài Đặt"
              >
                <IconSettings size={20} />
              </Link>
              {session.user.steamId && (
                <Link href={`/player/${session.user.steamId}`} className="mt-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#555] border-2 border-white/10 hover:border-accent-primary transition-colors cursor-pointer">
                    <img
                      src={session.user.avatar || session.user.image || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
                      alt={session.user.name || 'User'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
                      }}
                    />
                  </div>
                </Link>
              )}
            </>
          )}
        </aside>
        <main ref={mainRef} className="flex-1 p-7.5 overflow-y-auto flex flex-col scrollbar-hide max-md:p-5 max-md:overflow-visible relative">
          {/* Header (Desktop Only) */}
          <header className="flex justify-between items-center mb-[30px] flex-wrap gap-5 max-md:hidden">
            <div className="text-2xl font-normal text-[#aaa]">
              {isLoading ? (
                <h1>Đang tải...</h1>
              ) : session?.user ? (
                <h1>{greeting}, <span className="text-white font-bold">{session.user.name || 'Người chơi'}</span></h1>
              ) : (
                <h1>{greeting}, <span className="text-white font-bold">Khách</span></h1>
              )}
            </div>
            <div className="flex items-center gap-5">
              <div className="bg-card-bg px-5 py-2.5 rounded-[20px] flex items-center gap-2.5 text-[#aaa] w-[300px]">
                <IconSearch size={24} />
                <input type="text" placeholder="Tìm kiếm"
                  className="bg-transparent border-none text-white outline-none w-full placeholder-[#aaa]" />
              </div>
              <button
                className="bg-card-bg border-none w-10 h-10 rounded-full text-white flex items-center justify-center cursor-pointer relative hover:bg-[#4a2a30] transition-colors">
                <IconBell size={24} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent-primary rounded-full"></span>
              </button>
              {!isLoading && (
                session?.user ? (
                  <button
                    onClick={() => signOut()}
                    className="bg-accent-primary border-none px-4 py-2 rounded-full text-white flex items-center gap-2 cursor-pointer hover:bg-[#ff6b76] transition-colors"
                    title="Đăng xuất"
                  >
                    <IconLogout size={20} />
                    <span>Đăng Xuất</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="bg-accent-primary border-none px-4 py-2 rounded-full text-white flex items-center gap-2 cursor-pointer hover:bg-[#ff6b76] transition-colors"
                    title="Đăng nhập"
                  >
                    <IconLogin size={20} />
                    <span className={'line-clamp-1'}>Đăng Nhập</span>
                  </button>
                )
              )}
            </div>
          </header>
          {children}
        </main>
      </div>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}
