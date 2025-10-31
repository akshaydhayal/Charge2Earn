"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Nav } from "@/components/ui/Nav";
import { useConnection } from "@solana/wallet-adapter-react";
import { PROGRAM_PUBKEY } from "@/lib/program";
import { Spinner } from "@/components/ui/Spinner";
import { PublicKey } from "@solana/web3.js";

// Simple leaderboard for driver PDAs only

type Row = { type: "driver"; pubkey: string; amp: bigint };

export default function LeaderboardPage() {
  const { connection } = useConnection();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const program = PROGRAM_PUBKEY;
        const accounts = await connection.getProgramAccounts(program);
        const candidatePubkeys: PublicKey[] = accounts.map(a => a.pubkey);
        const fetched = await Promise.all(
          candidatePubkeys.map(async pk => {
            const info = await connection.getAccountInfo(pk);
            if (!info?.data) return null;
            // account_type (byte 0) must be 2 (driver)
            const accountType = new DataView(info.data.buffer, info.data.byteOffset, 1).getUint8(0);
            if (accountType !== 2) return null;
            // layout: [account_type:1][is_initialized:1][owner:32][amp_balance:8]...
            if (info.data.length < 1 + 1 + 32 + 8) return null;
            const amp = new DataView(info.data.buffer, info.data.byteOffset + 1 + 1 + 32, 8).getBigUint64(0, true);
            return { type: "driver" as const, pubkey: pk.toBase58(), amp } satisfies Row;
          })
        );
        const filtered = (fetched.filter(Boolean) as Row[]).sort((a, b) => Number(b.amp - a.amp)).slice(0, 50);
        if (!cancelled) setRows(filtered);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection]);

  function formatBig(n: bigint) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0e1630] to-[#0b1220]">
      <Nav />
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2.5">
            Driver&apos;s Leaderboard
          </h1>
          <p className="text-base text-gray-400 max-w-2xl mx-auto">
            Top eco-drivers ranked by their AMP point balances
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3.5 bg-white/5 backdrop-blur-xl rounded-xl px-6 py-5 border border-gray-600/20">
              <Spinner />
              <span className="text-white text-base">Fetching driver accounts…</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && rows.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">
              🏆
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Drivers Found</h3>
            <p className="text-gray-400">Start charging to appear on the leaderboard</p>
          </div>
        )}

        {/* Leaderboard */}
        {!loading && rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((r, index) => {
              const isTopThree = index < 3;
              
              return (
            <div key={r.pubkey} className="group relative">
                  {/* Card */}
              <div className={`relative bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-md border border-gray-600/20 hover:border-gray-500/40 transition-all duration-300 transform group-hover:scale-105 overflow-hidden ${
                isTopThree ? 'ring ring-gray-500/20' : ''
              }`}>
                <div className="p-3.5">
                  <div className="flex items-center justify-between gap-3">
                        {/* Rank & Driver Info */}
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-md flex items-center justify-center font-bold text-sm ${
                            isTopThree 
                              ? 'bg-gray-600 text-white' 
                              : 'bg-gray-700/50 text-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          
                      <div className="flex items-center gap-3">
                            <Image
                              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${r.pubkey}`}
                              alt="avatar"
                              width={36}
                              height={36}
                              className="w-9 h-9 rounded-full border border-gray-600/30"
                              unoptimized
                            />
                            <div>
                          <div className="text-white font-semibold text-xs">
                                {isTopThree ? `🥇🥈🥉`[index] : ''} Driver #{index + 1}
                              </div>
                          <div className="text-gray-400 text-[11px] font-mono">
                                {r.pubkey.slice(0, 8)}…{r.pubkey.slice(-8)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* AMP Balance */}
                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold text-gray-200">
                            {formatBig(r.amp)}
                          </div>
                      <div className="text-[11px] text-gray-400">AMP Points</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



