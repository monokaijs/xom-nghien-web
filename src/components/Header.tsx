'use client';

import {Button} from "@/components/ui/button";
import DiscordIcon from "@/components/DiscordIcon";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { User, LogOut, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import SteamIcon from "@/components/SteamIcon";

export default function Header() {
  const { user, isLoggedIn, login, logout } = useAuth();

  const NavigationLinks = () => (
    <>
      <a href="#rent" className="text-neutral-300 hover:text-white transition-colors">Thuê máy chủ</a>
      <a href="#contact" className="text-neutral-300 hover:text-white transition-colors">Liên hệ</a>
      {isLoggedIn && (
        <>
          <Link href="/skin-changer" className="text-neutral-300 hover:text-red-400 transition-colors">
            Skin Changer
          </Link>
          <Link href="/skin-changer/loadout" className="text-neutral-300 hover:text-red-400 transition-colors">
            My Loadout
          </Link>
        </>
      )}
    </>
  );

  return <header className="border-b sticky top-0 z-50 border-white/10 bg-black/20 backdrop-blur-sm">
    <div className="container mx-auto px-4 py-4">
      <nav className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-red-800">
            Checkmate
          </Link>
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            <NavigationLinks />
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Discord Button - Hidden on small screens, shown on medium+ */}
          <Link href={'https://discord.gg/bDGqfUee3Q'} target={'_blank'} className="hidden sm:block">
            <Button className="bg-[#5865F2] hover:bg-[#5865F2]/80 text-white transition-colors h-8">
              <DiscordIcon className='w-6 h-6 md:w-8 md:h-8' fill={'white'}/>
              <span className="hidden md:inline ml-2">Discord</span>
            </Button>
          </Link>

          {/* User Authentication */}
          {isLoggedIn && user ? (
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center gap-2">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-neutral-300 hidden lg:block">{user.username}</span>
              </div>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="border-white/20 text-neutral-300 hover:bg-white/10"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Logout</span>
              </Button>
            </div>
          ) : (
            <Button
              className="bg-red-600 hover:bg-red-500 text-white transition-colors h-8"
              onClick={login}
              size="sm"
            >
              <SteamIcon className='w-6 h-6 md:w-8 md:h-8' fill={'white'}/>
              <span className="hidden md:inline ml-2">Steam Login</span>
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden text-neutral-300 hover:text-white">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-black/95 border-white/10">
              <SheetHeader>
                <SheetTitle className="text-white text-left">Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-4 mt-6">
                <NavigationLinks />

                {/* Mobile Discord Link */}
                <Link href={'https://discord.gg/bDGqfUee3Q'} target={'_blank'} className="sm:hidden">
                  <Button className="w-full bg-[#5865F2] hover:bg-[#5865F2]/80 text-white transition-colors">
                    <DiscordIcon className='w-6 h-6' fill={'white'}/>
                    <span className="ml-2">Discord</span>
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  </header>
}
