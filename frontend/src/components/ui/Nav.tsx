"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useUIStore } from "@/lib/uiStore";

export function Nav() {
  const openAddCharger = useUIStore(s => s.openAddCharger);
  
  return (
    <div className="sticky top-0 z-50 border-b border-indigo-900/30 bg-[#0b1220]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0b1220]/60">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="group flex items-center space-x-2.5 cursor-pointer">
          <div className="w-9 h-9 bg-indigo-700/60 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300 text-white">
            ⚡
          </div>
          <span className="text-xl font-bold text-white group-hover:text-gray-300 transition-all duration-300">
            Charge2Earn
          </span>
        </Link>
        
        <nav className="hidden md:flex gap-1.5">
          <Link 
            href="/chargers" 
            className="group relative px-3.5 py-2 rounded-md text-indigo-200/80 hover:text-white transition-all duration-300 hover:bg-indigo-900/40 cursor-pointer"
          >
            <span className="relative z-10">Chargers</span>
          </Link>
          <Link 
            href="/marketplace" 
            className="group relative px-3.5 py-2 rounded-md text-indigo-200/80 hover:text-white transition-all duration-300 hover:bg-indigo-900/40 cursor-pointer"
          >
            <span className="relative z-10">Marketplace</span>
          </Link>
          <Link 
            href="/leaderboard" 
            className="group relative px-3.5 py-2 rounded-md text-indigo-200/80 hover:text-white transition-all duration-300 hover:bg-indigo-900/40 cursor-pointer"
          >
            <span className="relative z-10">Leaderboard</span>
          </Link>
        </nav>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={openAddCharger} 
            className="group relative px-3.5 py-2 bg-indigo-700/70 text-white font-medium rounded-md hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 border border-indigo-800/40 cursor-pointer"
          >
            <span className="relative z-10">Add Charger</span>
          </button>
          <WalletMultiButton className="!bg-indigo-900 !text-white !rounded-md !px-3.5 !py-2 !text-sm !font-medium hover:!bg-indigo-800 !transition-all !duration-300 hover:!scale-105 !border !border-indigo-800/40" />
        </div>
      </div>
    </div>
  );
}



