"use client";

import React from 'react';
import {
    IconHome,
    IconDeviceGamepad2,
    IconGift,
    IconDeviceTv,
    IconChartPie,
    IconShoppingBag,
    IconMessageCircle,
    IconSearch,
    IconBell,
    IconShoppingCart,
    IconPlus,
} from '@tabler/icons-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex w-[95vw] h-[90vh] bg-bg-dark rounded-[40px] overflow-hidden shadow-2xl p-5 gap-5 max-lg:w-full max-lg:h-screen max-lg:rounded-none max-lg:p-2.5 max-md:flex-col max-md:h-screen max-md:overflow-y-auto">
            {/* --- Left Sidebar --- */}
            <aside className="w-20 bg-bg-sidebar flex flex-col items-center py-5 rounded-[30px] max-md:w-full max-md:h-auto max-md:flex-row max-md:px-5 max-md:py-2.5 max-md:justify-between max-md:sticky max-md:top-0 max-md:z-50 max-md:mb-2.5">
                <div className="w-10 h-10 bg-white text-black font-black text-2xl flex items-center justify-center rounded-[10px] mb-10 max-md:mb-0 max-md:w-[30px] max-md:h-[30px] max-md:text-base">
                    N
                </div>
                <nav className="flex flex-col gap-[30px] flex-1 max-md:flex-row max-md:gap-[15px] max-md:overflow-x-auto max-md:px-2.5 max-md:items-center">
                    <a href="#" className="text-accent-primary transition-colors duration-300 flex items-center justify-center"><IconHome size={24} /></a>
                    <a href="#" className="text-text-secondary hover:text-accent-primary transition-colors duration-300 flex items-center justify-center"><IconDeviceGamepad2 size={24} /></a>
                    <a href="#" className="text-text-secondary hover:text-accent-primary transition-colors duration-300 flex items-center justify-center"><IconGift size={24} /></a>
                    <a href="#" className="text-text-secondary hover:text-accent-primary transition-colors duration-300 flex items-center justify-center"><IconDeviceTv size={24} /></a>
                    <a href="#" className="text-text-secondary hover:text-accent-primary transition-colors duration-300 flex items-center justify-center"><IconChartPie size={24} /></a>
                    <a href="#" className="text-text-secondary hover:text-accent-primary transition-colors duration-300 flex items-center justify-center"><IconShoppingBag size={24} /></a>
                    <a href="#" className="text-text-secondary hover:text-accent-primary transition-colors duration-300 flex items-center justify-center"><IconMessageCircle size={24} /></a>
                </nav>
                <div className="max-md:hidden">
                    <button className="w-10 h-10 rounded-xl bg-[#3a2025] border border-dashed border-[#666] text-[#aaa] flex items-center justify-center cursor-pointer hover:bg-[#4a2a30] transition-colors">
                        <IconPlus size={24} />
                    </button>
                </div>
            </aside>

            {/* --- Main Content --- */}
            <main className="flex-1 p-2.5 overflow-y-auto flex flex-col scrollbar-hide max-md:p-0 max-md:overflow-visible">
                {/* Header */}
                <header className="flex justify-between items-center mb-[30px] flex-wrap gap-5 max-md:flex-col max-md:items-start">
                    <div className="text-2xl font-normal text-[#aaa]">
                        <h1>Good evening, <span className="text-white font-bold">NIKITIN</span></h1>
                    </div>
                    <div className="flex items-center gap-5 max-md:w-full max-md:justify-between">
                        <div className="bg-card-bg px-5 py-2.5 rounded-[20px] flex items-center gap-2.5 text-[#aaa] w-[300px] max-md:w-full">
                            <IconSearch size={24} />
                            <input type="text" placeholder="Search" className="bg-transparent border-none text-white outline-none w-full placeholder-[#aaa]" />
                        </div>
                        <button className="bg-card-bg border-none w-10 h-10 rounded-full text-white flex items-center justify-center cursor-pointer hover:bg-[#4a2a30] transition-colors">
                            <IconShoppingCart size={24} />
                        </button>
                        <button className="bg-card-bg border-none w-10 h-10 rounded-full text-white flex items-center justify-center cursor-pointer relative hover:bg-[#4a2a30] transition-colors">
                            <IconBell size={24} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent-primary rounded-full"></span>
                        </button>
                    </div>
                </header>

                {/* Content */}
                {children}
            </main>

            {/* --- Social Sidebar --- */}
            <aside className="w-20 bg-bg-sidebar flex flex-col items-center py-5 rounded-[30px] border-l border-white/5 max-md:w-full max-md:h-auto max-md:flex-row max-md:px-5 max-md:overflow-x-auto max-md:mt-5 max-md:border-l-0">
                <div className="mb-[30px] max-md:mb-0 max-md:mr-[15px]">
                    <div className="w-[50px] h-[50px] rounded-full overflow-hidden bg-[#555]">
                        <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-full h-full object-cover" />
                    </div>
                </div>
                <div className="flex-1 flex flex-col gap-[15px] items-center max-md:flex-row">
                    <div className="w-10 h-10 rounded-full relative">
                        <img src="https://i.pravatar.cc/150?img=3" alt="Friend" className="w-full h-full rounded-full object-cover" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2b161b] bg-[#2ecc71]"></div>
                    </div>
                    <div className="w-10 h-10 rounded-full relative">
                        <img src="https://i.pravatar.cc/150?img=5" alt="Friend" className="w-full h-full rounded-full object-cover" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2b161b] bg-[#f1c40f]"></div>
                        <span className="absolute -top-[5px] left-1/2 -translate-x-1/2 bg-[#e54d42] text-[8px] px-1 py-0.5 rounded whitespace-nowrap">In Game</span>
                    </div>
                    <div className="w-10 h-10 rounded-full relative">
                        <img src="https://i.pravatar.cc/150?img=9" alt="Friend" className="w-full h-full rounded-full object-cover" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2b161b] bg-[#95a5a6]"></div>
                    </div>
                    <div className="w-10 h-10 rounded-full relative">
                        <img src="https://i.pravatar.cc/150?img=12" alt="Friend" className="w-full h-full rounded-full object-cover" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2b161b] bg-[#2ecc71]"></div>
                    </div>
                    <div className="w-10 h-10 rounded-full relative">
                        <img src="https://i.pravatar.cc/150?img=23" alt="Friend" className="w-full h-full rounded-full object-cover" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2b161b] bg-[#2ecc71]"></div>
                    </div>
                    <div className="w-10 h-10 rounded-full relative">
                        <img src="https://i.pravatar.cc/150?img=33" alt="Friend" className="w-full h-full rounded-full object-cover" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2b161b] bg-[#2ecc71]"></div>
                    </div>
                    <div className="w-10 h-10 rounded-full relative">
                        <img src="https://i.pravatar.cc/150?img=44" alt="Friend" className="w-full h-full rounded-full object-cover" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2b161b] bg-[#2ecc71]"></div>
                    </div>
                </div>
                <div className="flex flex-col gap-[15px] max-md:flex-row max-md:ml-auto">
                    <button className="w-10 h-10 rounded-[15px] bg-[#3b1e25] border-none text-[#aaa] flex items-center justify-center cursor-pointer hover:bg-[#4a2a30] transition-colors"><IconMessageCircle size={24} /></button>
                    <button className="w-10 h-10 rounded-[15px] bg-[#3b1e25] border-none text-[#aaa] flex items-center justify-center cursor-pointer hover:bg-[#4a2a30] transition-colors"><div className="w-[30px] h-[30px] rounded-full bg-[#555]"></div></button>
                    <button className="w-10 h-10 rounded-[15px] bg-[#3b1e25] border-none text-[#aaa] flex items-center justify-center cursor-pointer hover:bg-[#4a2a30] transition-colors"><div className="w-[30px] h-[30px] rounded-full bg-[#555]"></div></button>
                    <button className="w-10 h-10 rounded-[15px] bg-[#3b1e25] border-none text-[#aaa] flex items-center justify-center cursor-pointer hover:bg-[#4a2a30] transition-colors"><div className="w-[30px] h-[30px] rounded-full bg-[#555]"></div></button>
                </div>
            </aside>
        </div>
    );
}
