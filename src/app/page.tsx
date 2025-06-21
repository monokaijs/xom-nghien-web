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
              Team <span className="text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-red-950/10">
              Checkmate
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
            {/* Basic Plan */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm relative">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Basic</h3>
                  <div className="text-4xl font-bold text-slate-300 mb-1">150k</div>
                  <div className="text-slate-400 text-sm">VNĐ/tháng</div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-red-400 flex-shrink-0"/>
                    <span className="text-neutral-300">12 Player Slots</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shirt className="w-5 h-5 text-slate-400 flex-shrink-0"/>
                    <span className="text-neutral-400 line-through">Hỗ trợ ModSkin</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-slate-400 flex-shrink-0"/>
                    <span className="text-neutral-400 line-through">Anti-cheat</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-slate-400 flex-shrink-0"/>
                    <span className="text-neutral-400 line-through">Demo xem lại</span>
                  </div>
                </div>

                <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                  Chọn gói Basic
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan - Popular */}
            <Card className="bg-white/5 border-red-500/30 backdrop-blur-sm relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Phổ biến
                </span>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-red-400 mb-1">250k</div>
                  <div className="text-slate-400 text-sm">VNĐ/tháng</div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-red-400 flex-shrink-0"/>
                    <span className="text-neutral-300">12 Player Slots</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shirt className="w-5 h-5 text-red-400 flex-shrink-0"/>
                    <span className="text-neutral-300">Hỗ trợ ModSkin</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-red-400 flex-shrink-0"/>
                    <span className="text-neutral-300">Anti-cheat</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-slate-400 flex-shrink-0"/>
                    <span className="text-neutral-400 line-through">Demo xem lại</span>
                  </div>
                </div>

                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                  Chọn gói Pro
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm relative">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                  <div className="text-4xl font-bold text-slate-300 mb-1">350k</div>
                  <div className="text-slate-400 text-sm">VNĐ/tháng</div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-red-400 flex-shrink-0"/>
                    <span className="text-neutral-300">12 Player Slots</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shirt className="w-5 h-5 text-red-400 flex-shrink-0"/>
                    <span className="text-neutral-300">Hỗ trợ ModSkin</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-red-400 flex-shrink-0"/>
                    <span className="text-neutral-300">Anti-cheat</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-red-400 flex-shrink-0"/>
                    <span className="text-neutral-300">Demo xem lại</span>
                  </div>
                </div>

                <Button className="w-full bg-slate-700 hover:bg-red-600 text-white transition-colors">
                  Chọn gói Premium
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-12">
            <p className="text-slate-400 text-sm mb-4">
              Tất cả các gói đều bao gồm hỗ trợ 24/7 và cập nhật miễn phí
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                So sánh chi tiết
              </Button>
              <Link href={'#contact'}>
                <Button variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                  Liên hệ tư vấn
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Weapons Section */}
      <WeaponsSection/>

      {/* Contact Section */}
      <ContactSection/>

      <footer className="bg-black/40 border-t border-white/10 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">TEAM CHECKMATE</div>
              <p className="text-red-200">Community Powered Counter-Strike 2 Server</p>
            </div>
          </div>

          <div className="border-t border-red-800/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-red-200">© 2025 Team Checkmate.</p>
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
