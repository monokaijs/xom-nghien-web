"use client";

import React from 'react';
import { DiscordInvitationLink } from "@/config/discord";

interface HeroCardProps {
  title: string;
  description: string;
  imageUrl: string;
  imageAlt?: string;
  eyebrow?: string;
  actionLabel?: string;
  actionHref?: string;
  theme?: 'community' | 'cs2' | 'palworld' | 'valheim';
  imageFit?: 'cover' | 'contain';
}

const themeClasses = {
  community: 'from-[#e54d42] via-[#cd4143] to-[#9f303d]',
  cs2: 'from-[#d96b2b] via-[#b74335] to-[#682632]',
  palworld: 'from-[#1884aa] via-[#285d79] to-[#142d45]',
  valheim: 'from-[#bd592c] via-[#41463e] to-[#0b2930]',
};

export default function HeroCard({
  title,
  description,
  imageUrl,
  imageAlt,
  eyebrow = 'Cộng đồng',
  actionLabel = 'Tham gia ngay',
  actionHref = DiscordInvitationLink,
  theme = 'community',
  imageFit = 'cover',
}: HeroCardProps) {
  const isExternalLink = /^https?:\/\//.test(actionHref);

  return (
    <section
      className={`bg-gradient-to-br ${themeClasses[theme]} rounded-[30px] p-[30px] flex relative min-h-[300px] overflow-visible max-sm:min-h-[340px] max-sm:p-6`}
    >
      <div className="relative z-10 flex min-h-[240px] w-[58%] flex-col justify-between max-lg:w-[62%] max-sm:w-full">
        <div>
          <div className="flex gap-[15px] items-center mb-[15px]">
            <span
              className="bg-white text-[#e54d42] px-[15px] py-[5px] rounded-[20px] font-semibold text-sm">
              {eyebrow}
            </span>
          </div>
          <h2 className="text-5xl font-bold leading-[1.05] mb-3 max-lg:text-4xl max-sm:text-3xl">{title}</h2>
          <p className="text-sm leading-relaxed max-w-[380px] mb-5 text-white/85">
            {description}
          </p>
        </div>
        <div className="flex gap-5 items-center">
          <a
            href={actionHref}
            target={isExternalLink ? '_blank' : undefined}
            rel={isExternalLink ? 'noreferrer' : undefined}
            className="bg-white text-black border-none px-[15px] py-2 rounded-[15px] font-semibold hover:bg-gray-100 transition-colors"
          >
            {actionLabel}
          </a>
        </div>
      </div>
      <div
        className={`absolute z-[1] pointer-events-none ${
          imageFit === 'contain'
            ? '-right-[8%] bottom-0 h-[124%] w-[68%] max-sm:-right-[26%] max-sm:h-[88%] max-sm:w-[120%] max-sm:opacity-55'
            : '-right-[7%] bottom-0 h-[128%] w-[68%] max-sm:-right-[22%] max-sm:h-[96%] max-sm:w-[112%] max-sm:opacity-45'
        }`}
      >
        <img
          src={imageUrl}
          alt={imageAlt || title}
          fetchPriority="high"
          className={`w-full h-full object-contain object-bottom ${
            imageFit === 'contain'
              ? 'drop-shadow-[0_24px_35px_rgba(0,0,0,0.35)]'
              : '[mask-image:linear-gradient(to_left,black_80%,transparent)]'
          }`}
        />
      </div>
      <div className="absolute inset-0 rounded-[30px] bg-gradient-to-r from-black/10 via-transparent to-black/10 pointer-events-none" />
    </section>
  );
}
