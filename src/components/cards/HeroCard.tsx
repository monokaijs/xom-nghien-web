"use client";

import React from 'react';

interface HeroCardProps {
  title: string;
  description: string;
  imageUrl: string;
  tags?: string[];
  reviews?: number;
}

export default function HeroCard({title, description, imageUrl, tags = [], reviews = 53}: HeroCardProps) {
  return (
    <div
      className="bg-gradient-to-r from-[#e54d42] to-[#b83b45] rounded-[30px] p-[30px] flex relative min-h-[300px] max-md:flex-col">
      <div className="flex-1 z-10 flex flex-col justify-between">
        <div>
          <div className="flex gap-[15px] items-center mb-[15px]">
            <span
              className="bg-white text-[#e54d42] px-[15px] py-[5px] rounded-[20px] font-semibold text-sm">Popular</span>
            <div className="flex gap-2.5">
              {tags.map((tag, i) => (
                <div key={i}
                     className="w-6 h-6 bg-black/30 rounded-full flex items-center justify-center text-xs font-bold">
                  {tag}
                </div>
              ))}
            </div>
          </div>
          <h2 className="text-5xl font-bold mb-2.5">{title}</h2>
          <p className="text-sm leading-relaxed max-w-[300px] mb-5 opacity-90">
            {description}
          </p>
        </div>
        <div className="flex gap-5 items-center">
          <div className="flex">
            <div className="w-[30px] h-[30px] bg-[#ccc] rounded-full border-2 border-[#e54d42] -mr-2.5"></div>
            <div className="w-[30px] h-[30px] bg-[#ccc] rounded-full border-2 border-[#e54d42] -mr-2.5"></div>
            <div className="w-[30px] h-[30px] bg-[#ccc] rounded-full border-2 border-[#e54d42] -mr-2.5"></div>
          </div>
          <button
            className="bg-white text-black border-none px-[15px] py-2 rounded-[15px] font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
            👍 +{reviews} Reviews
          </button>
        </div>
      </div>
      <div
        className="absolute -right-[50px] bottom-0 h-[120%] z-[1] max-md:relative max-md:w-full max-md:h-[200px] max-md:right-0 max-md:top-0 max-md:mt-5">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover [mask-image:linear-gradient(to_left,black_80%,transparent)] max-md:[mask-image:linear-gradient(to_top,black_80%,transparent)]"
        />
      </div>
    </div>
  );
}
