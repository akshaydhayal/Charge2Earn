"use client";

import { Nav } from "@/components/ui/Nav";
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
  const [themeIdx, setThemeIdx] = useState(0);

  const themes = [
    // Keep: Aurora
    {
      name: "Aurora",
      card: "bg-gradient-to-r from-emerald-900 to-indigo-900 text-white",
      stat: "bg-gradient-to-r from-emerald-950 to-indigo-950 text-white",
      border: "border-emerald-400/30",
      subText: "text-emerald-200/80",
      label: "text-emerald-300/80",
      badge: "bg-white/10",
    },
    // Keep: Cyber Grid
    {
      name: "Cyber Grid",
      card: "bg-[#0d0f14] text-white",
      stat: "bg-[#0d0f14] text-white",
      border: "border-cyan-400/20",
      subText: "text-cyan-200/80",
      label: "text-cyan-300/70",
      badge: "bg-cyan-400/10",
    },
    // New 1: Volt Blue (electric blue accents)
    {
      name: "Volt Blue",
      card: "bg-gradient-to-r from-sky-900 to-indigo-950 text-white",
      stat: "bg-gradient-to-r from-sky-950 to-indigo-950 text-white",
      border: "border-sky-400/30",
      subText: "text-sky-200/80",
      label: "text-sky-300/80",
      badge: "bg-white/10",
    },
    // New 2: Mint Slate (slate dark with mint highlights)
    {
      name: "Mint Slate",
      card: "bg-gradient-to-r from-slate-900 to-slate-800 text-white",
      stat: "bg-slate-950 text-white",
      border: "border-emerald-400/20",
      subText: "text-emerald-200/80",
      label: "text-emerald-300/80",
      badge: "bg-emerald-400/10",
    },
    // New 3: Paper Light (clean light mode)
    {
      name: "Paper Light",
      card: "bg-gradient-to-r from-white to-gray-50 text-gray-900",
      stat: "bg-white text-gray-900",
      border: "border-gray-200",
      subText: "text-gray-600",
      label: "text-gray-500",
      badge: "bg-gray-100",
    },
  ];
  const t = themes[themeIdx];
  const isDark = t.card.includes("text-white");

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
      pushToast({ message: "Listing canceled.", tx: sig });
    } catch (e) {
      console.error(e);
      alert(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Theme toggle moved to navbar globally */}
        {charger && (
          <div className={`mt-2 rounded-2xl border ${t.border} p-6 ${t.card}`}>
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="min-w-[220px]">
                <div className="text-2xl font-semibold">{charger.name}</div>
                <div className={`text-sm ${t.subText}`}>{charger.address}, {charger.city}</div>
                <div className={`mt-1 text-xs ${t.label}`}>Code: {charger.code}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-center w-full md:w-auto">
                <div className={`rounded-lg px-4 py-3 ${t.badge}`}>
                  <div className={`text-[10px] uppercase tracking-wider ${t.label}`}>Power</div>
                  <div className="text-lg font-medium">{charger.power_kw} kW</div>
                </div>
                <div className={`rounded-lg px-4 py-3 ${t.badge}`}>
                  <div className={`text-[10px] uppercase tracking-wider ${t.label}`}>Rate</div>
                  <div className="text-lg font-medium">{charger.rate_points_per_sec.toString()} AMP Points/sec</div>
                </div>
                <div className={`rounded-lg px-4 py-3 ${t.badge}`}>
                  <div className={`text-[10px] uppercase tracking-wider ${t.label}`}>Price</div>
                  <div className="text-lg font-medium whitespace-nowrap">{charger.price_per_sec_lamports.toString()} lamports/sec</div>
                </div>
                <div className={`rounded-lg px-4 py-3 ${t.badge}`}>
                  <div className={`text-[10px] uppercase tracking-wider ${t.label}`}>Geo</div>
                  <div className="text-sm font-medium">{charger.latitude.toFixed(4)}, {charger.longitude.toFixed(4)}</div>
                </div>
                <div className={`rounded-lg px-4 py-3 col-span-2 md:col-span-1 ${t.badge}`}>
                  <div className={`text-[10px] uppercase tracking-wider ${t.label}`}>Owner</div>
                  <div className="text-xs font-mono break-all">{ownerPk.toBase58()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-medium">Session Controls</h2>
            <p className="text-sm text-gray-600 mt-1">Start and stop your session for this charger.</p>
            <div className="mt-3 flex gap-3">
              <button disabled={!publicKey || !driverPda || !chargerPda || busy} onClick={onStart} className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50 cursor-pointer">{busy ? "Starting..." : "Start Charging"}</button>
              <button disabled={!publicKey || !driverPda || !chargerPda || !startTs || busy} onClick={onStop} className="rounded-md border px-4 py-2 disabled:opacity-50 cursor-pointer">{busy ? "Stopping..." : "End Charging"}</button>
            </div>
          </div>
          
          {/* Full-width, dark-themed live session stats */}
          <div className={`md:col-span-2 mt-2 rounded-xl border p-6 ${t.stat} ${t.border}`}>
            <div className="grid gap-6 md:grid-cols-3 text-center select-none">
              <div>
                <div className={`uppercase tracking-wide text-xs ${t.label}`}>Time</div>
                <div className="text-6xl font-semibold tabular-nums leading-none">{elapsed}s</div>
              </div>
              <div>
                <div className={`uppercase tracking-wide text-xs ${t.label}`}>AMP Points Earned</div>
                <div className="text-6xl font-semibold tabular-nums leading-none break-words">
                  {charger ? formatBig((charger.rate_points_per_sec || 0n) * BigInt(elapsed)) : "0"}
                </div>
              </div>
              <div>
                <div className={`uppercase tracking-wide text-xs ${t.label}`}>Cost</div>
                <div className="text-6xl font-semibold tabular-nums leading-none flex items-baseline justify-center gap-2 whitespace-nowrap">
                  <span>{charger ? lamportsToSolString((charger.price_per_sec_lamports || 0n) * BigInt(elapsed)) : "0"}</span>
                  <span className="text-base font-normal">SOL</span>
                </div>
              </div>
            </div>
            <div className={`mt-4 text-xs ${t.subText}`}>
              {startTs && <span className="mr-4">Started: {startTs}</span>}
              {endTs && <span>Ended: {endTs}</span>}
              {txSig && (
                <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer" className="ml-4 text-blue-400 underline cursor-pointer">View transaction</a>
              )}
            </div>
          </div>
        </div>

        {/* Full-width Points section with single CTA */}
        <div className={`mt-6 rounded-xl border p-6 ${t.card} ${t.border}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-medium">Points Management</h2>
              <p className={`text-sm mt-1 ${t.subText}`}>List or cancel listed AMP points for this driver.</p>
              <div className="mt-2 text-sm flex items-center gap-2">
                <span className={`uppercase tracking-wide text-xs ${t.label}`}>Your AMP Points</span>
                <span className={`px-2 py-1 rounded-md font-mono ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  {driverInfo ? formatBig(driverInfo.amp_balance) : "0"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setListingOpen(true)} className="rounded-md bg-black text-white px-4 py-2 cursor-pointer">List Points</button>
              <button disabled={!publicKey || !driverPda || busy} onClick={onCancelListing} className="rounded-md border px-4 py-2 disabled:opacity-50 cursor-pointer">Cancel Listing</button>
            </div>
          </div>
        </div>

        {listingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-md rounded-xl bg-neutral-900 text-white p-6 shadow-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">List AMP Points</h3>
                <button onClick={() => setListingOpen(false)} className="text-sm text-neutral-400 hover:text-white cursor-pointer">Close</button>
              </div>
              <p className="text-neutral-400 mt-1">Choose amount and price per point (lamports).</p>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1">
                  <span className="text-sm text-neutral-300">Amount to list (AMP)</span>
                  <input type="number" className="rounded-md px-3 py-2 bg-neutral-800 border border-white/10 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20" value={listingAmount} onChange={e => setListingAmount(parseInt(e.target.value))} />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-neutral-300">Price per point (lamports)</span>
                  <input type="number" className="rounded-md px-3 py-2 bg-neutral-800 border border-white/10 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20" value={listingPrice} onChange={e => setListingPrice(parseInt(e.target.value))} />
                </label>
              </div>
              <div className="mt-4 flex gap-2">
                <button disabled={!publicKey || !driverPda || busy || (driverInfo ? listingAmount > Number(driverInfo.amp_balance) : false)} onClick={async () => { await onCreateListing(); setListingOpen(false); }} className="rounded-md bg-white text-black px-4 py-2 disabled:opacity-50 cursor-pointer">{busy ? "Submitting..." : "Create/Update"}</button>
                <button disabled={!publicKey || !driverPda || busy} onClick={async () => { await onCancelListing(); setListingOpen(false); }} className="rounded-md border border-white/20 px-4 py-2 disabled:opacity-50 cursor-pointer">Cancel Listing</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


