"use client";

import React from 'react';
import {IconPlayerPlayFilled, IconX} from '@tabler/icons-react';

interface DownloadCardProps {
  title?: string;
  seeAllLink?: string;
  gameName?: string;
  gameImage?: string;
  gameCategory?: string;
  timeRemaining?: string;
  downloadProgress?: string;
  progressPercentage?: number;
}

export default function DownloadCard({
                                       title = "Last Downloads",
                                       seeAllLink = "#",
                                       gameName = "FIFA 23",
                                       gameImage = "https://media.contentapi.ea.com/content/dam/ea/fifa/fifa-23/common/fifa23-grid-tile-16x9.jpg.adapt.crop16x9.1023w.jpg",
                                       gameCategory = "Sports simulator",
                                       timeRemaining = "1 hour 23 min.",
                                       downloadProgress = "265Mb of 1.23Gb",
                                       progressPercentage = 25
                                     }: DownloadCardProps) {
  return (
    <>
      <div className="flex justify-between items-center -mb-2.5">
        <h3 className="text-lg font-semibold">{title}</h3>
        <a href={seeAllLink} className="text-text-secondary no-underline text-sm hover:text-white transition-colors">See
          More</a>
      </div>
      <div
        className="bg-gradient-to-r from-[#a8323a] to-[#2b161b] rounded-[25px] p-5 flex flex-col gap-[15px] relative overflow-hidden">
        <div className="flex gap-[15px] items-center">
          <div className="w-[60px] h-[60px] bg-white rounded-[15px] overflow-hidden">
            <img src={gameImage} alt={gameName} className="w-full h-full object-cover"/>
          </div>
          <div>
            <h4 className="text-lg">{gameName}</h4>
            <p
              className="text-xs text-[#ccc] bg-black/20 px-2 py-0.5 rounded-[10px] inline-block mt-[5px]">{gameCategory}</p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-semibold">{timeRemaining}</span>
            <span className="font-normal text-xs text-[#aaa]">{downloadProgress}</span>
          </div>
          <div className="flex gap-2.5">
            <button
              className="w-9 h-9 rounded-full border-none flex items-center justify-center cursor-pointer bg-[#e54d42] text-white hover:bg-[#ff6b76] transition-colors">
              <IconPlayerPlayFilled size={16}/>
            </button>
            <button
              className="w-9 h-9 rounded-full border-none flex items-center justify-center cursor-pointer bg-white text-black hover:bg-gray-200 transition-colors">
              <IconX size={16}/>
            </button>
          </div>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#e54d42]" style={{width: `${progressPercentage}%`}}></div>
        </div>
      </div>
    </>
  );
}
