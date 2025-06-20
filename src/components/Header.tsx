'use client';

import {Button} from "@/components/ui/button";
import DiscordIcon from "@/components/DiscordIcon";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { User, LogOut } from "lucide-react";

export default function Header() {
  const { user, isLoggedIn, login, logout } = useAuth();

  return <header className="border-b sticky top-0 z-50 border-white/10 bg-black/20 backdrop-blur-sm">
    <div className="container mx-auto px-4 py-4">
      <nav className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-red-800">
            Checkmate
          </Link>
          <div className="hidden md:flex space-x-6">
            <a href="#rent" className="text-gray-300 hover:text-white transition-colors">Thuê máy chủ</a>
            <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Liên hệ</a>
            {isLoggedIn && (
              <Link href="/skin-changer" className="text-gray-300 hover:text-red-400 transition-colors">
                Skin Changer
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link href={'https://discord.gg/bDGqfUee3Q'} target={'_blank'}>
            <Button className="bg-[#5865F2] hover:bg-[#5865F2]/80 text-white transition-colors">
              <DiscordIcon className='w-8 h-8' fill={'white'}/>
              Discord
            </Button>
          </Link>

          {isLoggedIn && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-gray-300 hidden sm:block">{user.username}</span>
              </div>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="border-white/20 text-gray-300 hover:bg-white/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={login}
              className="bg-[#171a21] hover:bg-[#2a475e] text-white border border-[#4c6b22] transition-colors"
            >
              <User className="w-4 h-4 mr-2" />
              Steam Login
            </Button>
          )}
        </div>
      </nav>
    </div>
  </header>
}
