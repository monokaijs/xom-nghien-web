'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  Star,
  Sparkles,
  Zap
} from 'lucide-react';
import { weapons } from '@/lib/config/weapons';

interface WeaponSlideProps {
  weapon: {
    name: string;
    image: string;
  };
  index: number;
  isActive: boolean;
}

function WeaponSlide({ weapon, index, isActive }: WeaponSlideProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`relative w-full h-[500px] rounded-2xl overflow-hidden transition-all duration-500 ${
      isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-60'
    }`}>
      {/* Background Image */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900">
        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <Target className="w-16 h-16 mb-4" />
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-8">
        {/* Weapon Index */}
        <div className="absolute top-6 left-6 w-12 h-12 bg-red-600/90 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-lg font-bold">
          {index + 1}
        </div>

        {/* Rarity Stars */}
        <div className="absolute top-6 right-6 flex items-center gap-1">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        </div>

        {/* Weapon Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-red-400">
            <Sparkles className="w-5 h-5" />
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
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <span className="text-slate-400 text-sm font-medium">Weapon Skins</span>
          <h2 className="text-4xl font-bold text-white mb-4 mt-2">
            Vũ Khí<br/><span className={'bg-clip-text bg-gradient-to-br from-red-500 to-red-800 text-transparent'}>Trong Server</span>
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Khám phá bộ sưu tập vũ khí đẹp mắt có sẵn trong server của chúng tôi
          </p>
        </div>

        {/* Weapons Carousel */}
        <div className="relative max-w-4xl mx-auto mb-12">
          {/* Main Carousel Container */}
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
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
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
          >
            <ChevronRight className="w-6 h-6" />
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

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Miễn phí</h3>
            <p className="text-gray-300 text-sm">
              Tất cả weapon skins đều miễn phí cho người chơi
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Chất lượng cao</h3>
            <p className="text-gray-300 text-sm">
              Chỉ những skin đẹp nhất được chọn lọc kỹ càng
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Cập nhật thường xuyên</h3>
            <p className="text-gray-300 text-sm">
              Bộ sưu tập được cập nhật với skin mới hàng tuần
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-red-600/20 to-red-800/20 border border-red-500/30 rounded-lg p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-4">
              Sẵn sàng trải nghiệm?
            </h3>
            <p className="text-gray-300 mb-6 max-w-md mx-auto">
              Tham gia server ngay để sử dụng tất cả weapon skins này hoàn toàn miễn phí!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3">
                <Target className="w-4 h-4 mr-2" />
                Tham gia server
              </Button>
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white px-8 py-3"
              >
                Xem hướng dẫn
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
