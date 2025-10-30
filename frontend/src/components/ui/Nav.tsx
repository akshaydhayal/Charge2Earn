"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useUIStore } from "@/lib/uiStore";

export function Nav() {
  const openAddCharger = useUIStore(s => s.openAddCharger);
  const isDark = true; // our global themes are dark bases
  const barClass = isDark
    ? "sticky top-0 z-50 border-b border-white/10 bg-black/30 text-white backdrop-blur supports-[backdrop-filter]:bg-black/20"
    : "sticky top-0 z-50 border-b bg-white/70 text-gray-900 backdrop-blur supports-[backdrop-filter]:bg-white/50";
  return (
    <div className={barClass}>
      <div className="mx-auto max-w-6xl px-3 py-1.5 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold cursor-pointer">
          ⚡ Charge2Earn
        </Link>
        <nav className="hidden md:flex gap-5 text-sm">
          <Link href="/chargers" className="hover:underline cursor-pointer">Chargers</Link>
          <Link href="/marketplace" className="hover:underline cursor-pointer">Points Marketplace</Link>
          <Link href="/leaderboard" className="hover:underline cursor-pointer">Driver's Leaderboard</Link>
        </nav>
        <div className="ml-4 flex items-center gap-2">
          <button onClick={openAddCharger} className="mr-1 rounded-md border px-3 py-1.5 text-sm cursor-pointer">Add Charger</button>
          <WalletMultiButton className="!bg-black !text-white !rounded-md !px-3 !py-1.5" />
        </div>
      </div>
    </div>
  );
}



