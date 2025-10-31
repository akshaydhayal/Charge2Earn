"use client";

import { useUIStore } from "@/lib/uiStore";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMemo, useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { findChargerPda, ixAddCharger } from "@/lib/program";
import { WalletNotConnectedError } from "@/components/ui/WalletNotConnectedError";

export function AddChargerModal() {
  const open = useUIStore(s => s.addChargerOpen);
  const close = useUIStore(s => s.closeAddCharger);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const bumpChargerVersion = useUIStore(s => s.bumpChargerVersion);
  const pushToast = useUIStore(s => s.pushToast);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [powerKw, setPowerKw] = useState(7.2);
  const [ratePts, setRatePts] = useState(10);
  const [priceLamportsPerSec, setPriceLamportsPerSec] = useState(1000);
  const [busy, setBusy] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);

  const chargerPda = useMemo(() => {
    if (!publicKey || !code) return null;
    return findChargerPda(code, publicKey)[0];
  }, [publicKey, code]);

  if (!open) return null;

  async function onRegister() {
    if (!publicKey || !chargerPda) return;
    try {
      setBusy(true);
      const admin = new PublicKey("3shLPzr2Dd4d8XShBMrcUnUUoRTf1iEmDDaTXLiBLAC3");
      const ix = ixAddCharger({
        payer: publicKey,
        chargerPda,
        admin,
        data: {
          code,
          name,
          city,
          address,
          latitude,
          longitude,
          power_kw: powerKw,
          rate_points_per_sec: ratePts,
          price_per_sec_lamports: priceLamportsPerSec,
        },
      });
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      setTxSig(sig);
      bumpChargerVersion();
      pushToast({ message: "Charger added successfully.", tx: sig });
    } catch (e) {
      console.error(e);
      alert(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="group relative w-full max-w-3xl mx-4">
        <div className="relative bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-xl border border-gray-600/20 p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-xl">
                ⚡
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Register Charger</h2>
                <p className="text-gray-400 mt-0.5 text-sm">Pay 0.5 SOL to register a charger. All fields are on-chain metadata.</p>
              </div>
            </div>
            <button 
              onClick={close} 
              className="w-8 h-8 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center text-white hover:text-gray-300 transition-all duration-300 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Wallet Not Connected Error */}
          {!publicKey && (
            <div className="mb-5">
              <WalletNotConnectedError />
            </div>
          )}

          {/* Form */}
          {publicKey ? (
          <div className="space-y-4.5">
            {/* Registration Fee Notice */}
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                <span className="font-semibold">Registration Fee:</span> Registering a new charger will cost <span className="font-semibold">0.5 SOL</span> as a registration fee, which will be sent to the platform admin.
              </p>
            </div>

            {/* Code and Name */}
            <div className="grid gap-3.5 grid-cols-1 md:grid-cols-2">
              <label className="block">
                <span className="text-xs text-gray-400 mb-1.5 block">Charger Code</span>
                <input 
                  className="w-full rounded-lg px-3.5 py-2.5 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-300" 
                  placeholder="Enter unique code"
                  value={code} 
                  onChange={e => setCode(e.target.value)} 
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-400 mb-1.5 block">Charger Name</span>
                <input 
                  className="w-full rounded-lg px-3.5 py-2.5 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-300" 
                  placeholder="Enter charger name"
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </label>
            </div>

            {/* Address */}
            <label className="block">
              <span className="text-xs text-gray-400 mb-1.5 block">Address</span>
              <input 
                className="w-full rounded-lg px-3.5 py-2.5 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-300" 
                placeholder="Enter full address"
                value={address} 
                onChange={e => setAddress(e.target.value)} 
              />
            </label>

            {/* City, Latitude, Longitude */}
            <div className="grid gap-3.5 grid-cols-1 md:grid-cols-3">
              <label className="block">
                <span className="text-xs text-gray-400 mb-1.5 block">City</span>
                <input 
                  className="w-full rounded-lg px-3.5 py-2.5 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-300" 
                  placeholder="Enter city"
                  value={city} 
                  onChange={e => setCity(e.target.value)} 
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-400 mb-1.5 block">Latitude</span>
                <input 
                  type="number" 
                  step="any"
                  className="w-full rounded-lg px-3.5 py-2.5 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-300" 
                  placeholder="0.0000"
                  value={latitude} 
                  onChange={e => setLatitude(parseFloat(e.target.value))} 
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-400 mb-1.5 block">Longitude</span>
                <input 
                  type="number" 
                  step="any"
                  className="w-full rounded-lg px-3.5 py-2.5 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-300" 
                  placeholder="0.0000"
                  value={longitude} 
                  onChange={e => setLongitude(parseFloat(e.target.value))} 
                />
              </label>
            </div>

            {/* Power, Rate, Price */}
            <div className="grid gap-3.5 grid-cols-1 md:grid-cols-3">
              <label className="block">
                <span className="text-xs text-gray-400 mb-1.5 block">Power (kW)</span>
                <input 
                  type="number" 
                  step="any"
                  className="w-full rounded-lg px-3.5 py-2.5 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-300" 
                  placeholder="7.2"
                  value={powerKw} 
                  onChange={e => setPowerKw(parseFloat(e.target.value))} 
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-400 mb-1.5 block">Points Earn Rate: AMP/sec</span>
                <input 
                  type="number" 
                  className="w-full rounded-lg px-3.5 py-2.5 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-300" 
                  placeholder="10"
                  value={ratePts} 
                  onChange={e => setRatePts(parseInt(e.target.value))} 
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-400 mb-1.5 block">Charger Price: lamports/sec</span>
                <input 
                  type="number" 
                  className="w-full rounded-lg px-3.5 py-2.5 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-300" 
                  placeholder="1000"
                  value={priceLamportsPerSec} 
                  onChange={e => setPriceLamportsPerSec(parseInt(e.target.value))} 
                />
              </label>
            </div>

            {/* PDA Info */}
            {/* {chargerPda && (
              <div className="p-3.5 bg-white/5 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 mb-1.5">Charger PDA</div>
                <div className="text-xs font-mono text-white break-all">{chargerPda.toBase58()}</div>
              </div>
            )} */}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4.5">
              <div className="flex items-center gap-4">
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
              
              <button 
                disabled={!publicKey || !chargerPda || busy} 
                onClick={onRegister} 
                className="group/btn relative px-5 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 border border-gray-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span>{busy ? "Registering..." : "Register Charger"}</span>
                  <span className="group-hover/btn:translate-x-1 transition-transform duration-300">⚡</span>
                </span>
              </button>
            </div>
          </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


