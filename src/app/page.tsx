import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Heart, PlaneIcon, Shield, Shirt, StoreIcon, Users, Video} from "lucide-react";
import Header from "@/components/Header";
import GameServersSection from "@/components/GameServersSection";
import ContactSection from "@/components/ContactSection";
import WeaponsSection from "@/components/WeaponsSection";
import AgentPic from '@/lib/assets/agent2.png';
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header/>
      <section className="py-8 lg:py-20 px-4 lg:h-[90vh] relative overflow-hidden">
        <div
          className={'absolute z-0 left-0 right-0 top-0 bottom-0 w-full h-full inset-0 pointer-events-none bg-contain bg-no-repeat bg-center opacity-15'}
          style={{
            backgroundImage: `url(${AgentPic.src})`,
          }}
        />
        <div className="container mx-auto pb-8 text-center flex flex-col h-full relative z-10">
          <div className={'flex-1'}>
            <div className="mb-6">
              <span className="text-slate-400 text-sm font-medium">Chào mừng đến với</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Xóm <span className="text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-red-950/10">
              Nghiện
            </span>
            </h1>
            <p className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
              Server Cộng đồng Counter-strike 2 miễn phí
            </p>
            <div className={'my-16 flex flex-row items-center justify-center gap-4'}>
              <Link href={'#rent'}>
                <Button size="lg"
                        className="bg-red-600/80 border border-red-500/80 hover:bg-red-600 text-white px-8 py-3 transition-colors">
                  <PlaneIcon className="w-5 h-5 mr-1"/>
                  Thuê máy chủ
                </Button>
              </Link>
              <Link href={'/skin-changer'}>
                <Button size="lg"
                        className="bg-white/10 border border-white-500/15 hover:bg-white text-white hover:text-black px-8 py-3 transition-colors">
                  <StoreIcon className="w-5 h-5 mr-1"/>
                  Skins Changer
                </Button>
              </Link>
            </div>
          </div>
          <GameServersSection/>
        </div>
      </section>

      <section id={'rent'} className="py-20 px-4 bg-black/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <span className="text-slate-400 text-sm font-medium">Counter-strike 2</span>
            <h2 className="text-4xl font-bold text-white mb-4 mt-2">
              Thuê Máy chủ
            </h2>
            <p className="text-neutral-300 text-lg">
              Chọn gói phù hợp với nhu cầu của bạn
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            Coming soon...
          </div>

        </div>
      </section>

      {/* Contact Section */}
      <ContactSection/>

      <footer className="bg-black/40 border-t border-white/10 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">XÓM NGHIỆN</div>
              <p className="text-red-200">Community Powered Counter-Strike 2 Server</p>
            </div>
          </div>

          <div className="border-t border-red-800/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-red-200">© 2025 Xóm Nghiện.</p>
            <p className="text-red-200 flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500"/> by
              <a href="https://monokaijs.com"
                 className="text-red-300 hover:text-red-400 transition-colors ml-1">@monokaijs</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
