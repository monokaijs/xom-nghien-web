"use client";

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { HeroCard, GameServersCard, DownloadCard } from '@/components/cards';
import { IconChevronRight } from '@tabler/icons-react';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-[2fr_1fr] gap-[30px] h-full max-lg:grid-cols-1 max-lg:overflow-y-auto">
        {/* Left Column */}
        <div className="flex flex-col gap-[30px] min-w-0">
          {/* Hero Card */}
          <HeroCard
            title="Valorant"
            description="Valorant is a multiplayer computer game developed and published by Riot Games. Valorant is Riot Games' first first-person shooter game."
            imageUrl="/agents.png"
            tags={['S', 'E']}
            reviews={53}
          />

          {/* Game Servers */}
          <GameServersCard />

          {/* Last Downloads */}
          <DownloadCard />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-[30px] max-lg:flex-row max-lg:flex-wrap">
          {/* Game List */}
          <div className="flex flex-col gap-[15px] max-lg:flex-1 max-lg:min-w-[300px]">
            <div className="bg-bg-dark p-2.5 rounded-[20px] flex items-center gap-[15px] transition-colors duration-300 hover:bg-card-bg cursor-pointer">
              <img src="https://image.api.playstation.com/vulcan/img/rnd/202010/2217/LsaR585t2cmu1a5i4a5i5a5i.png" alt="Unravel 2" className="w-[50px] h-[50px] rounded-xl object-cover" />
              <div className="flex-1">
                <h4 className="text-sm font-medium">Unravel 2 <span className="text-accent-primary text-xs block">(Standard Edition + Starter Pass)</span></h4>
              </div>
              <IconChevronRight size={24} />
            </div>
            <div className="bg-bg-dark p-2.5 rounded-[20px] flex items-center gap-[15px] transition-colors duration-300 hover:bg-card-bg cursor-pointer">
              <img src="https://play-lh.googleusercontent.com/u4s0z7Uf7y6y7y7y7y7y7y7y7y7y7y7y7y7y7y7y7y7y7y7y7y7y7y7y7y7y7y7y" alt="Subway Surf" className="w-[50px] h-[50px] rounded-xl object-cover" />
              <div className="flex-1">
                <h4 className="text-sm font-medium">Subway Surf</h4>
              </div>
              <IconChevronRight size={24} />
            </div>
            <div className="bg-bg-dark p-2.5 rounded-[20px] flex items-center gap-[15px] transition-colors duration-300 hover:bg-card-bg cursor-pointer">
              <img src="https://image.api.playstation.com/vulcan/ap/rnd/202202/2816/m254e54e54e54e54e54e54e5.png" alt="RDR3" className="w-[50px] h-[50px] rounded-xl object-cover" />
              <div className="flex-1">
                <h4 className="text-sm font-medium">Red Dead Redemption 3 <span className="text-accent-primary text-xs block">(Premium Pack)</span></h4>
              </div>
              <IconChevronRight size={24} />
            </div>
          </div>

          {/* Statistics */}
          <div className="flex justify-between items-center -mb-2.5 max-lg:w-full">
            <h3 className="text-lg font-semibold">Your Statistic</h3>
            <a href="#"><IconChevronRight size={24} /></a>
          </div>
          <div className="bg-gradient-to-br from-[#2b161b] to-[#1a0f12] rounded-[30px] p-[30px] flex-1 flex flex-col items-center justify-center relative max-lg:flex-1 max-lg:min-w-[300px]">
            <div className="relative w-[200px] h-[200px] flex items-center justify-center mb-5">
              <div className="w-[180px] h-[180px] rounded-full bg-[conic-gradient(from_0deg,#ff5f6d,#ffc371,#a18cd1,#fbc2eb,#ff5f6d)] flex items-center justify-center p-5 blur-[10px] absolute"></div>
              <div className="absolute w-[160px] h-[160px] rounded-full border-[10px] border-white/10 border-t-white border-r-[#ff5f6d] -rotate-45"></div>
              <div className="w-[120px] h-[120px] bg-[#1a0f12] rounded-full z-10 flex flex-col items-center justify-center">
                <span className="text-xs text-[#aaa]">Total hours</span>
                <span className="text-xl font-bold">12,340h</span>
              </div>
            </div>
            <div className="flex gap-5 w-full justify-around">
              <div className="flex flex-col items-center gap-[5px]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-[#e54d42]">D</div>
                <span>2,340h</span>
              </div>
              <div className="flex flex-col items-center gap-[5px]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-[#f9ca24] text-black">R</div>
                <span>5,420h</span>
              </div>
              <div className="flex flex-col items-center gap-[5px]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-[#6c5ce7]">C</div>
                <span>4,580h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
