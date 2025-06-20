'use client';

import {useEffect, useState} from 'react';
import {ChevronLeft, ChevronRight, Sparkles, Star, Target} from 'lucide-react';
import {weapons} from '@/lib/config/weapons';
import Agent from '@/lib/assets/agent.png';

interface WeaponSlideProps {
  weapon: {
    name: string;
    image: string;
  };
  index: number;
  isActive: boolean;
}

function WeaponSlide({weapon, index, isActive}: WeaponSlideProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`relative w-full h-[500px] rounded-2xl overflow-hidden transition-all duration-500 ${
      isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-60'
    }`}>
      {/* Background Image */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900">
        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
            <Target className="w-16 h-16 mb-4"/>
            <span className="text-lg">Image not available</span>
          </div>
        ) : (
          <img
            src={weapon.image}
            alt={weapon.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40"/>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-8">
        {/* Weapon Index */}
        <div
          className="absolute top-6 left-6 w-12 h-12 bg-red-600/90 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-lg font-bold">
          {index + 1}
        </div>

        {/* Rarity Stars */}
        <div className="absolute top-6 right-6 flex items-center gap-1">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
        </div>

        {/* Weapon Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-red-400">
            <Sparkles className="w-5 h-5"/>
            <span className="text-sm font-medium">Available in-game</span>
          </div>

          <h3 className="text-3xl font-bold text-white leading-tight">
            {weapon.name}
          </h3>

          <p className="text-gray-300 text-lg max-w-md">
            Weapon skin miễn phí có sẵn trong server
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WeaponsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % weapons.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % weapons.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + weapons.length) % weapons.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  return (
    <section className="container mx-auto relative py-20 px-4">
      <div
        className={'absolute z-0 left-0 right-0 top-0 bottom-0 w-full h-full inset-0 pointer-events-none bg-no-repeat opacity-5 bg-bottom-right'}
        style={{
          backgroundImage: `url(${Agent.src})`,
        }}
      />

      <div className="text-center mb-16 z-10">
        <span className="text-neutral-400 text-sm font-medium">Weapon Skins</span>
        <h2 className="text-4xl font-bold text-white mb-4 mt-2">
          Vũ Khí<br/><span className={'bg-clip-text bg-gradient-to-br from-red-500 to-red-800 text-transparent'}>Trong Server</span>
        </h2>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Khám phá bộ sưu tập vũ khí đẹp mắt có sẵn trong server của chúng tôi
        </p>
      </div>

      {/* Weapons Carousel */}
      <div className="relative max-w-4xl mx-auto mb-12 z-10">
        {/* Main Carousel Container */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{transform: `tranneutralX(-${currentIndex * 100}%)`}}
          >
            {weapons.map((weapon, index) => (
              <div key={`${weapon.name}-${index}`} className="w-full flex-shrink-0 px-4">
                <WeaponSlide
                  weapon={weapon}
                  index={index}
                  isActive={index === currentIndex}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -tranneutral-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
        >
          <ChevronLeft className="w-6 h-6"/>
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -tranneutral-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
        >
          <ChevronRight className="w-6 h-6"/>
        </button>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-8 gap-3">
          {weapons.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-red-500 scale-125'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
