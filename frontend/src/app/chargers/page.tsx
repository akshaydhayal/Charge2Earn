"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { ChargerAccount, fetchChargers } from "@/lib/program";
import { useUIStore } from "@/lib/uiStore";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { WalletNotConnectedError } from "@/components/ui/WalletNotConnectedError";
import { AccountBalances } from "@/components/ui/AccountBalances";

export default function ChargersPage() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [chargers, setChargers] = useState<Array<{ pubkey: PublicKey; data: ChargerAccount }>>([]);
  const chargerVersion = useUIStore(s => s.chargerVersion);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await fetchChargers(connection);
        setChargers(list);
      } finally {
        setLoading(false);
      }
    })();
  }, [connection, chargerVersion]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0e1630] to-[#0b1220]">
      <Nav />
      <AccountBalances />
      <div className="mx-auto max-w-7xl px-4 py-1">
        {/* Wallet Not Connected Error */}
        {!publicKey ? (
          <WalletNotConnectedError />
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-6">
          {/* <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2.5">
            Available Chargers
          </h1> */}
          <p className="text-lg font-semibold text-gray-300 max-w-2xl mx-auto">
            Select a charging point to start your session and earn AMP points
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3.5 bg-white/5 backdrop-blur-xl rounded-xl px-6 py-5 border border-gray-600/20">
              <Spinner />
              <span className="text-white text-base">Fetching chargers…</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && chargers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">
              🔌
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Chargers Available</h3>
            <p className="text-gray-400">Check back later or register a new charger</p>
          </div>
        )}

        {/* Chargers Grid */}
        {!loading && chargers.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chargers.map((c) => {
              const owner = new PublicKey(c.data.authority);
              return (
                <div key={c.pubkey.toBase58()} className="group relative">
                  {/* Card */}
                  <div className="relative bg-gradient-to-br from-[#0b1220] to-[#0f1b2d] backdrop-blur-xl rounded-md border border-indigo-900/30 hover:border-indigo-700/40 transition-all duration-300 transform group-hover:scale-[1.02] overflow-hidden">
                    {/* Header */}
                    <div className="p-3.5 border-b border-indigo-900/30">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-indigo-700/50 rounded-md flex items-center justify-center text-base text-white">
                            ⚡
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-white">{c.data.name}</h3>
                            <p className="text-indigo-200/80 text-xs">{c.data.city}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-indigo-100">{c.data.power_kw} kW</div>
                          <div className="text-[11px] text-indigo-200/70">Power</div>
                        </div>
                      </div>
                      
                      <p className="text-indigo-100/60 text-[11px] mb-2.5">{c.data.address}</p>
                      
                      <div className="flex items-center gap-2 text-[11px] text-indigo-200/70">
                        <span className="px-1.5 py-0.5 bg-indigo-900/40 rounded-full">Code: {c.data.code}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="p-3.5 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="text-center p-2 bg-indigo-900/30 rounded-md">
                          <div className="text-[13px] font-semibold text-indigo-100">{c.data.rate_points_per_sec.toString()}</div>
                          <div className="text-[10px] text-indigo-200/70">AMP/sec</div>
                        </div>
                        <div className="text-center p-2 bg-indigo-900/30 rounded-md">
                          <div className="text-[13px] font-semibold text-indigo-100">{c.data.price_per_sec_lamports.toString()}</div>
                          <div className="text-[10px] text-indigo-200/70">Lamports/sec</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5 text-indigo-200/70">
                          <span>📍</span>
                          <span>{c.data.latitude.toFixed(4)}, {c.data.longitude.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="p-3.5 pt-0">
                      <Link 
                        href={`/charger/${owner.toBase58()}/${encodeURIComponent(c.data.code)}`} 
                        className="w-full group/btn relative inline-flex items-center justify-center px-3.5 py-2 bg-indigo-700/70 text-white font-semibold rounded-md hover:bg-indigo-700 transition-all duration-300 transform hover:scale-[1.02] border border-indigo-700/40 cursor-pointer"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <span>Select Charger</span>
                          <span className="group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}



