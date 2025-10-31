"use client";

import { Nav } from "@/components/ui/Nav";
import { AccountBalances } from "@/components/ui/AccountBalances";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { ChargerAccount, DriverAccount, fetchChargerByPda, fetchDriver, findChargerPda, findDriverPda, findListingPda, findSessionPda, ixCancelListing, ixCreateListing, ixStartSession, ixStopSession } from "@/lib/program";
import { useUIStore } from "@/lib/uiStore";

export default function ChargerDetailPage() {
  const params = useParams<{ owner: string; code: string }>();
  const ownerPk = useMemo(() => new PublicKey(params.owner), [params.owner]);
  const code = decodeURIComponent(params.code);

  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [chargerPda, setChargerPda] = useState<PublicKey | null>(null);
  const [charger, setCharger] = useState<ChargerAccount | null>(null);
  const [driverPda, setDriverPda] = useState<PublicKey | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverAccount | null>(null);
  const [busy, setBusy] = useState(false);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [endTs, setEndTs] = useState<number | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [listingAmount, setListingAmount] = useState(0);
  const [listingPrice, setListingPrice] = useState(0);
  const [listingOpen, setListingOpen] = useState(false);
  const [now, setNow] = useState<number>(() => Math.floor(Date.now() / 1000));
  const pushToast = useUIStore(s => s.pushToast);
  const bumpAccountBalanceVersion = useUIStore(s => s.bumpAccountBalanceVersion);

  // live ticker every second while charging
  useEffect(() => {
    if (!startTs || endTs) return;
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTs, endTs]);

  // Keep final values after stop: if endTs exists, freeze elapsed at (endTs - startTs)
  const elapsed = startTs ? (endTs ? endTs - startTs : now - startTs) : 0;
  function formatBig(n: bigint) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  function lamportsToSolString(lamports: bigint) {
    const sol = Number(lamports) / 1_000_000_000;
    if (!isFinite(sol)) return "";
    return sol.toFixed(sol >= 1 ? 2 : 6);
  }

  useEffect(() => {
    const [pda] = findChargerPda(code, ownerPk);
    setChargerPda(pda);
  }, [code, ownerPk]);

  useEffect(() => {
    (async () => {
      if (!chargerPda) return;
      const data = await fetchChargerByPda(connection, chargerPda);
      setCharger(data);
    })();
  }, [connection, chargerPda]);

  useEffect(() => {
    if (!publicKey) return;
    const [drv] = findDriverPda(publicKey);
    setDriverPda(drv);
  }, [publicKey]);

  useEffect(() => {
    (async () => {
      if (!driverPda) return;
      const data = await fetchDriver(connection, driverPda);
      setDriverInfo(data);
    })();
  }, [connection, driverPda, txSig, endTs]);

  async function onStart() {
    if (!publicKey || !driverPda || !chargerPda) return;
    try {
      setBusy(true);
      const now = Math.floor(Date.now() / 1000);
      setStartTs(now);
      const [sessPda] = findSessionPda(chargerPda, driverPda, now);
      const ix = ixStartSession({ user: publicKey, driverPda, sessionPda: sessPda, chargerPda, startTs: now });
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      setTxSig(sig);
      pushToast({ message: "Charging session started.", tx: sig });
    } catch (e) {
      console.error(e);
      alert(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onStop() {
    if (!publicKey || !driverPda || !chargerPda || !startTs) return;
    try {
      setBusy(true);
      const now = Math.floor(Date.now() / 1000);
      setEndTs(now);
      const ix = ixStopSession({ user: publicKey, sessionPda: findSessionPda(chargerPda, driverPda, startTs)[0], driverPda, chargerPda, chargerOwner: ownerPk, endTs: now });
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "finalized");
      setTxSig(sig);
      bumpAccountBalanceVersion(); // Refresh account balances
      pushToast({ message: "Charging session ended.", tx: sig });
    } catch (e) {
      console.error(e);
      alert(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onCreateListing() {
    if (!publicKey || !driverPda) return;
    try {
      setBusy(true);
      const [listingPda] = findListingPda(publicKey);
      const ix = ixCreateListing({ seller: publicKey, driverPda, listingPda, amountPoints: listingAmount, pricePerPointLamports: listingPrice });
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "finalized");
      setTxSig(sig);
      bumpAccountBalanceVersion(); // Refresh account balances
      pushToast({ message: "Points listed on marketplace.", tx: sig });
    } catch (e) {
      console.error(e);
      alert(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onCancelListing() {
    if (!publicKey || !driverPda) return;
    try {
      setBusy(true);
      const [listingPda] = findListingPda(publicKey);
      const tx = new Transaction().add(ixCancelListing({ seller: publicKey, driverPda, listingPda }));
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "finalized");
      setTxSig(sig);
      bumpAccountBalanceVersion(); // Refresh account balances
      pushToast({ message: "Listing canceled.", tx: sig });
    } catch (e) {
      console.error(e);
      alert(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0e1630] to-[#0b1220] text-white">
      <Nav />
      <AccountBalances />
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Charger Info Card */}
        {charger && (
          <div className="group relative mb-8">
            {/* Main Card */}
            <div className="relative bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 backdrop-blur-xl rounded-2xl border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 overflow-hidden shadow-lg shadow-blue-500/10">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30">
                      ⚡
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-1.5">{charger.name}</h1>
                      <p className="text-gray-300">{charger.address}, {charger.city}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-300">
                          Code: {charger.code}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-200 mb-1">{charger.power_kw} kW</div>
                    <div className="text-xs text-gray-400">Power Output</div>
              </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 rounded-xl p-3.5 text-center border border-blue-500/20">
                    <div className="text-xl font-bold text-gray-200 mb-1">{charger.rate_points_per_sec.toString()}</div>
                    <div className="text-[11px] text-gray-400 uppercase tracking-wide">AMP/sec</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 rounded-xl p-3.5 text-center border border-blue-500/20">
                    <div className="text-xl font-bold text-gray-200 mb-1">{charger.price_per_sec_lamports.toString()}</div>
                    <div className="text-[11px] text-gray-400 uppercase tracking-wide">Lamports/sec</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 rounded-xl p-3.5 text-center border border-blue-500/20">
                    <div className="text-xl font-bold text-gray-200 mb-1">{charger.latitude.toFixed(4)}</div>
                    <div className="text-[11px] text-gray-400 uppercase tracking-wide">Latitude</div>
                </div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 rounded-xl p-3.5 text-center border border-blue-500/20">
                    <div className="text-xl font-bold text-gray-200 mb-1">{charger.longitude.toFixed(4)}</div>
                    <div className="text-[11px] text-gray-400 uppercase tracking-wide">Longitude</div>
                </div>
                </div>

                {/* Owner Info */}
                <div className="mt-5 p-3.5 bg-gradient-to-r from-blue-500/15 to-indigo-500/10 rounded-xl border border-blue-500/20">
                  <div className="text-xs text-gray-400 mb-1.5">Charger Owner</div>
                  <div className="text-xs font-mono text-white break-all">{ownerPk.toBase58()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charging Session (Controls + Live Stats) */}
        <div className="group relative mb-8">
          <div className="relative bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 backdrop-blur-xl rounded-xl border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 p-5 shadow-lg shadow-emerald-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <h2 className="text-xl font-bold text-white">Charging Session</h2>
            </div>
              {txSig && (
                <a 
                  href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer text-sm"
                >
                  View Transaction ↗️
                </a>
              )}
          </div>
          
            {/* Controls + Stats */}
            <div className="grid gap-5 items-start">
              {/* Controls */}
              <div>
                <p className="text-gray-400 text-sm mb-3">Start and stop your charging session to earn AMP points</p>
                <div className="flex gap-3.5">
                  <button 
                    disabled={!publicKey || !driverPda || !chargerPda || busy} 
                    onClick={onStart} 
                    className="group/btn flex-1 relative px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 transform hover:scale-105 border border-emerald-500/30 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span>{busy ? "Starting..." : "Start Charging"}</span>
                      <span className="group-hover/btn:translate-x-1 transition-transform duration-300">⚡</span>
                    </span>
                  </button>
                  
                  <button 
                    disabled={!publicKey || !driverPda || !chargerPda || !startTs || busy} 
                    onClick={onStop} 
                    className="group/btn flex-1 relative px-5 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-lg hover:from-red-500 hover:to-orange-500 transition-all duration-300 transform hover:scale-105 border border-red-500/30 shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span>{busy ? "Stopping..." : "End Charging"}</span>
                      <span className="group-hover/btn:translate-x-1 transition-transform duration-300">⏹️</span>
                    </span>
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-lg p-3 border border-emerald-500/20">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Elapsed</div>
                    <div className="text-2xl font-bold text-gray-200 tabular-nums leading-none mt-1">{elapsed}s</div>
              </div>
                  <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-lg p-3 border border-emerald-500/20">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">AMP Points</div>
                    <div className="text-2xl font-bold text-gray-200 tabular-nums leading-none mt-1">
                      {charger ? formatBig((charger.rate_points_per_sec || BigInt(0)) * BigInt(elapsed)) : "0"}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-lg p-3 border border-emerald-500/20">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Cost</div>
                    <div className="text-2xl font-bold text-gray-200 tabular-nums leading-none mt-1 flex items-baseline justify-center gap-1">
                      <span>{charger ? lamportsToSolString((charger.price_per_sec_lamports || BigInt(0)) * BigInt(elapsed)) : "0"}</span>
                      <span className="text-sm font-normal">SOL</span>
                    </div>
                  </div>
                </div>
              </div>

              
            </div>
          </div>
        </div>

        {/* Points Management */}
        <div className="group relative">
          <div className="relative bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-amber-500/10 backdrop-blur-xl rounded-xl border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 p-6 shadow-lg shadow-purple-500/10">
            <div className="flex items-center justify-between mb-6">
            <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <h2 className="text-xl font-bold text-white">Points Management</h2>
                </div>
                <p className="text-gray-400 text-sm">List or cancel your AMP points on the marketplace</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-sm text-gray-400">Your AMP Balance:</span>
                  <span className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg border border-purple-500/30 text-sm shadow-md shadow-purple-500/20">
                  {driverInfo ? formatBig(driverInfo.amp_balance) : "0"}
                </span>
              </div>
            </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setListingOpen(true)} 
                  className="group/btn relative px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 transform hover:scale-105 border border-purple-500/30 shadow-lg shadow-purple-500/20 cursor-pointer"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>List Points</span>
                    <span className="group-hover/btn:translate-x-1 transition-transform duration-300">💰</span>
                  </span>
                </button>
                
                <button 
                  disabled={!publicKey || !driverPda || busy} 
                  onClick={onCancelListing} 
                  className="group/btn relative px-5 py-2.5 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-semibold rounded-lg hover:from-gray-600 hover:to-gray-500 transition-all duration-300 transform hover:scale-105 border border-gray-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>Cancel Listing</span>
                    <span className="group-hover/btn:translate-x-1 transition-transform duration-300">❌</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {listingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="group relative w-full max-w-lg mx-4">
              <div className="relative bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-xl border border-gray-600/20 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white">List AMP Points</h3>
                  <button 
                    onClick={() => setListingOpen(false)} 
                    className="w-8 h-8 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center text-white hover:text-gray-300 transition-all duration-300 cursor-pointer"
                  >
                    ✕
                  </button>
              </div>
                
                <p className="text-gray-400 text-sm mb-4">Choose amount and price per point (lamports) to list on the marketplace.</p>
                
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm text-gray-400 mb-2 block">Amount to list (AMP)</span>
                    <input 
                      type="number" 
                      className="w-full rounded-lg px-3.5 py-2.5 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500/40 focus:border-gray-500/40 transition-all duration-300" 
                      value={listingAmount} 
                      onChange={e => setListingAmount(parseInt(e.target.value))} 
                      placeholder="Enter amount"
                    />
                </label>
                  
                  <label className="block">
                    <span className="text-sm text-gray-400 mb-2 block">Price per point (lamports)</span>
                    <input 
                      type="number" 
                      className="w-full rounded-lg px-3.5 py-2.5 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500/40 focus:border-gray-500/40 transition-all duration-300" 
                      value={listingPrice} 
                      onChange={e => setListingPrice(parseInt(e.target.value))} 
                      placeholder="Enter price"
                    />
                </label>
              </div>
                
                <div className="mt-5 flex gap-3">
                  <button 
                    disabled={!publicKey || !driverPda || busy || (driverInfo ? listingAmount > Number(driverInfo.amp_balance) : false)} 
                    onClick={async () => { await onCreateListing(); setListingOpen(false); }} 
                    className="group/btn flex-1 relative px-5 py-2.5 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 border border-gray-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span>{busy ? "Submitting..." : "Create/Update"}</span>
                      <span className="group-hover/btn:translate-x-1 transition-transform duration-300">💰</span>
                    </span>
                  </button>
                  
                  <button 
                    disabled={!publicKey || !driverPda || busy} 
                    onClick={async () => { await onCancelListing(); setListingOpen(false); }} 
                    className="group/btn flex-1 relative px-5 py-2.5 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 border border-gray-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span>Cancel Listing</span>
                      <span className="group-hover/btn:translate-x-1 transition-transform duration-300">❌</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


