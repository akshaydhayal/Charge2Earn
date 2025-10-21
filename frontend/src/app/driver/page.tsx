"use client";

import { useMemo, useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { findChargerPda, findDriverPda, findSessionPda, ixStartSession, ixStopSession } from "@/lib/program";

export default function DriverPage() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [code, setCode] = useState("");
  const [startTs, setStartTs] = useState<number | null>(null);
  const [endTs, setEndTs] = useState<number | null>(null);
  const [chargerOwner, setChargerOwner] = useState("");
  const [txSig, setTxSig] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const driverPda = useMemo(() => (publicKey ? findDriverPda(publicKey)[0] : null), [publicKey]);
  const chargerPda = useMemo(() => (!publicKey || !code ? null : findChargerPda(code, publicKey)[0]), [publicKey, code]);
  const sessionPda = useMemo(() => {
    if (!driverPda || !chargerPda || !startTs) return null;
    return findSessionPda(chargerPda, driverPda, startTs)[0];
  }, [driverPda, chargerPda, startTs]);

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
    } catch (e) {
      console.error(e);
      alert(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onStop() {
    if (!publicKey || !driverPda || !chargerPda || !sessionPda || !startTs) return;
    try {
      setBusy(true);
      const now = Math.floor(Date.now() / 1000);
      setEndTs(now);
      const ownerPk = new PublicKey(chargerOwner);
      const ix = ixStopSession({ user: publicKey, sessionPda, driverPda, chargerPda, chargerOwner: ownerPk, endTs: now });
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
        <h1 className="text-2xl font-semibold">Driver – Start/Stop Session</h1>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm">Charger Code</span>
            <input className="border rounded-md px-3 py-2" value={code} onChange={e => setCode(e.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm">Charger Owner Pubkey (receives SOL)</span>
            <input className="border rounded-md px-3 py-2" value={chargerOwner} onChange={e => setChargerOwner(e.target.value)} />
          </label>

          <div className="flex gap-3">
            <button disabled={!publicKey || !code || busy} onClick={onStart} className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50">
              {busy ? "Starting..." : "Start Session"}
            </button>
            <button disabled={!publicKey || !sessionPda || !chargerOwner || busy} onClick={onStop} className="rounded-md border px-4 py-2 disabled:opacity-50">
              {busy ? "Stopping..." : "Stop Session"}
            </button>
          </div>

          {driverPda && <p className="text-xs text-gray-500">Driver PDA: {driverPda.toBase58()}</p>}
          {chargerPda && <p className="text-xs text-gray-500">Charger PDA: {chargerPda.toBase58()}</p>}
          {sessionPda && <p className="text-xs text-gray-500">Session PDA: {sessionPda.toBase58()}</p>}
          {startTs && <p className="text-xs text-gray-500">Start: {startTs}</p>}
          {endTs && <p className="text-xs text-gray-500">End: {endTs}</p>}
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



