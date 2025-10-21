"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function Nav() {
  return (
    <div className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold">
          ⚡ Charge2Earn
        </Link>
        <nav className="hidden md:flex gap-6 text-sm">
          <Link href="/operator" className="hover:underline">Operator</Link>
          <Link href="/driver" className="hover:underline">Driver</Link>
          <Link href="/marketplace" className="hover:underline">Marketplace</Link>
          <Link href="/leaderboard" className="hover:underline">Leaderboard</Link>
        </nav>
        <div className="ml-4">
          <WalletMultiButton className="!bg-black !text-white !rounded-md !px-3 !py-2" />
        </div>
      </div>
    </div>
  );
}



