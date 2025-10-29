"use client";

import { useUIStore } from "@/lib/uiStore";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMemo, useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { findChargerPda, ixAddCharger } from "@/lib/program";

export function AddChargerModal() {
  const open = useUIStore(s => s.addChargerOpen);
  const close = useUIStore(s => s.closeAddCharger);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const bumpChargerVersion = useUIStore(s => s.bumpChargerVersion);
  const pushToast = useUIStore(s => s.pushToast);

  const [adminStr, setAdminStr] = useState("");
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
      const admin = new PublicKey(adminStr);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-2xl rounded-xl bg-neutral-900 text-white p-6 shadow-2xl border border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Register Charger</h2>
          <button onClick={close} className="text-sm text-neutral-400 hover:text-white">Close</button>
        </div>
        <p className="text-neutral-400 mt-1">Pay 0.5 SOL to register a charger. All fields are on-chain metadata.</p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm text-neutral-300">Admin Public Key (receives reg fee)</span>
            <input className="rounded-md px-3 py-2 bg-neutral-800 border border-white/10 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20" placeholder="Admin pubkey" value={adminStr} onChange={e => setAdminStr(e.target.value)} />
          </label>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm text-neutral-300">Code</span>
              <input className="rounded-md px-3 py-2 bg-neutral-800 border border-white/10 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20" value={code} onChange={e => setCode(e.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-neutral-300">Name</span>
              <input className="rounded-md px-3 py-2 bg-neutral-800 border border-white/10 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20" value={name} onChange={e => setName(e.target.value)} />
            </label>
          </div>
          <label className="grid gap-2">
            <span className="text-sm text-neutral-300">Address</span>
            <input className="rounded-md px-3 py-2 bg-neutral-800 border border-white/10 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20" value={address} onChange={e => setAddress(e.target.value)} />
          </label>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm text-neutral-300">City</span>
              <input className="rounded-md px-3 py-2 bg-neutral-800 border border-white/10 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20" value={city} onChange={e => setCity(e.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-neutral-300">Latitude</span>
              <input type="number" className="rounded-md px-3 py-2 bg-neutral-800 border border-white/10 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20" value={latitude} onChange={e => setLatitude(parseFloat(e.target.value))} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-neutral-300">Longitude</span>
              <input type="number" className="rounded-md px-3 py-2 bg-neutral-800 border border-white/10 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20" value={longitude} onChange={e => setLongitude(parseFloat(e.target.value))} />
            </label>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm text-neutral-300">Power (kW)</span>
              <input type="number" className="rounded-md px-3 py-2 bg-neutral-800 border border-white/10 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20" value={powerKw} onChange={e => setPowerKw(parseFloat(e.target.value))} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-neutral-300">Rate: AMP/sec</span>
              <input type="number" className="rounded-md px-3 py-2 bg-neutral-800 border border-white/10 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20" value={ratePts} onChange={e => setRatePts(parseInt(e.target.value))} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-neutral-300">Price: lamports/sec</span>
              <input type="number" className="rounded-md px-3 py-2 bg-neutral-800 border border-white/10 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20" value={priceLamportsPerSec} onChange={e => setPriceLamportsPerSec(parseInt(e.target.value))} />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button disabled={!publicKey || !chargerPda || !adminStr || busy} onClick={onRegister} className="rounded-md bg-white text-black px-4 py-2 disabled:opacity-50">
              {busy ? "Registering..." : "Register Charger"}
            </button>
            {chargerPda && (
              <p className="text-xs text-neutral-400">Charger PDA: {chargerPda.toBase58()}</p>
            )}
            {txSig && (
              <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer" className="text-sm text-blue-400 underline">
                View transaction
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


