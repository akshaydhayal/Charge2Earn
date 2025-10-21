"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Nav } from "@/components/ui/Nav";
import { PublicKey, Transaction } from "@solana/web3.js";
import { findChargerPda, ixAddCharger } from "@/lib/program";
import { useConnection } from "@solana/wallet-adapter-react";

export default function OperatorPage() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
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
  const [txSig, setTxSig] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const chargerPda = useMemo(() => {
    if (!publicKey || !code) return null;
    return findChargerPda(code, publicKey)[0];
  }, [publicKey, code]);

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
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Register Charger</h1>
        <p className="text-gray-600 mt-2">Pay 0.5 SOL to register a charger. All fields are on-chain metadata.</p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm">Admin Public Key (receives reg fee)</span>
            <input className="border rounded-md px-3 py-2" placeholder="Admin pubkey" value={adminStr} onChange={e => setAdminStr(e.target.value)} />
          </label>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm">Code</span>
              <input className="border rounded-md px-3 py-2" value={code} onChange={e => setCode(e.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm">Name</span>
              <input className="border rounded-md px-3 py-2" value={name} onChange={e => setName(e.target.value)} />
            </label>
          </div>
          <label className="grid gap-2">
            <span className="text-sm">Address</span>
            <input className="border rounded-md px-3 py-2" value={address} onChange={e => setAddress(e.target.value)} />
          </label>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm">City</span>
              <input className="border rounded-md px-3 py-2" value={city} onChange={e => setCity(e.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm">Latitude</span>
              <input type="number" className="border rounded-md px-3 py-2" value={latitude} onChange={e => setLatitude(parseFloat(e.target.value))} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm">Longitude</span>
              <input type="number" className="border rounded-md px-3 py-2" value={longitude} onChange={e => setLongitude(parseFloat(e.target.value))} />
            </label>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm">Power (kW)</span>
              <input type="number" className="border rounded-md px-3 py-2" value={powerKw} onChange={e => setPowerKw(parseFloat(e.target.value))} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm">Rate: AMP/sec</span>
              <input type="number" className="border rounded-md px-3 py-2" value={ratePts} onChange={e => setRatePts(parseInt(e.target.value))} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm">Price: lamports/sec</span>
              <input type="number" className="border rounded-md px-3 py-2" value={priceLamportsPerSec} onChange={e => setPriceLamportsPerSec(parseInt(e.target.value))} />
            </label>
          </div>

          <button disabled={!publicKey || !chargerPda || !adminStr || busy} onClick={onRegister} className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50">
            {busy ? "Registering..." : "Register Charger"}
          </button>

          {chargerPda && (
            <p className="text-xs text-gray-500">Charger PDA: {chargerPda.toBase58()}</p>
          )}
          {txSig && (
            <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
              View transaction
            </a>
          )}
        </div>
      </div>
    </div>
  );
}



