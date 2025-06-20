import {Button} from "@/components/ui/button";
import DiscordIcon from "@/components/DiscordIcon";
import Link from "next/link";

export default function Header() {
  return <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
    <div className="container mx-auto px-4 py-4">
      <nav className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-red-800">
            Checkmate
          </div>
          <div className="hidden md:flex space-x-6">
            <a href="#rent" className="text-gray-300 hover:text-white transition-colors">Thuê máy chủ</a>
            <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Liên hệ</a>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link href={'https://discord.gg/bDGqfUee3Q'} target={'_blank'}>
            <Button className="bg-[#5865F2] hover:bg-[#5865F2]/80 text-white transition-colors">
              <DiscordIcon className='w-8 h-8' fill={'white'}/>
              Discord
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  </header>
}
