"use client";

import React from 'react';
import { DiscordInvitationLink } from "@/config/discord";

interface HeroCardProps {
  title: string;
  description: string;
  imageUrl: string;
}

export default function HeroCard({ title, description, imageUrl }: HeroCardProps) {
  return (
    <div
      className="bg-gradient-to-r from-[#e54d42] to-[#b83b45] rounded-[30px] p-[30px] flex relative min-h-[300px] max-md:flex-col max-md:overflow-hidden">
      <div className="flex-1 z-10 flex flex-col justify-between">
        <div>
          <div className="flex gap-[15px] items-center mb-[15px]">
            <span
              className="bg-white text-[#e54d42] px-[15px] py-[5px] rounded-[20px] font-semibold text-sm">
              Cộng đồng
            </span>
          </div>
          <h2 className="text-5xl font-bold mb-2.5">{title}</h2>
          <p className="text-sm leading-relaxed max-w-[300px] mb-5 opacity-90">
            {description}
          </p>
        </div>
        <div className="flex gap-5 items-center">
          <a href={DiscordInvitationLink} target="_blank">
            <button
              className="bg-white text-black border-none px-[15px] py-2 rounded-[15px] font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
            >
              Tham gia ngay
            </button>
          </a>
          <div className="flex">
            <div className="w-[30px] h-[30px] bg-[#ccc] rounded-full border-2 border-[#e54d42] -mr-2.5"></div>
            <div className="w-[30px] h-[30px] bg-[#ccc] rounded-full border-2 border-[#e54d42] -mr-2.5"></div>
            <div className="w-[30px] h-[30px] bg-[#ccc] rounded-full border-2 border-[#e54d42] -mr-2.5"></div>
          </div>
        </div>
      </div>
      <div
        className="absolute -right-[50px] bottom-0 h-[120%] z-[1] max-md:h-[300px] max-md:w-[250px] max-md:-right-10 max-md:bottom-0">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover [mask-image:linear-gradient(to_left,black_80%,transparent)]"
        />
      </div>
    </div>
  );
}
