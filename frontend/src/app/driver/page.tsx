"use client";

import { useEffect, useMemo, useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { ChargerAccount, DriverAccount, fetchChargers, fetchDriver, findChargerPda, findDriverPda, findListingPda, findSessionPda, ixCancelListing, ixCreateListing, ixStartSession, ixStopSession } from "@/lib/program";

export default function DriverPage() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [chargers, setChargers] = useState<Array<{ pubkey: PublicKey; data: ChargerAccount }>>([]);
  const [selected, setSelected] = useState<number>(-1);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [endTs, setEndTs] = useState<number | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [listingAmount, setListingAmount] = useState(0);
  const [listingPrice, setListingPrice] = useState(0);
  const [driverInfo, setDriverInfo] = useState<DriverAccount | null>(null);

  const driverPda = useMemo(() => (publicKey ? findDriverPda(publicKey)[0] : null), [publicKey]);
  const chargerPda = useMemo(() => {
    if (!publicKey || selected < 0) return null;
    const chargerOwner = new PublicKey(chargers[selected].data.authority);
    // charger PDA seed uses code + owner (payer) from registration; registration payer is the authority
    return findChargerPda(chargers[selected].data.code, chargerOwner)[0];
  }, [publicKey, selected, chargers]);
  const sessionPda = useMemo(() => {
    if (!driverPda || !chargerPda || !startTs) return null;
    return findSessionPda(chargerPda, driverPda, startTs)[0];
  }, [driverPda, chargerPda, startTs]);

  useEffect(() => {
    (async () => {
      const list = await fetchChargers(connection);
      setChargers(list);
    })();
  }, [connection]);

  useEffect(() => {
    (async () => {
      if (!driverPda) return;
      const data = await fetchDriver(connection, driverPda);
      setDriverInfo(data);
    })();
  }, [connection, driverPda, txSig]);

  async function onStart() {
    if (!publicKey || !driverPda || !chargerPda || selected < 0) return;
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
    if (!publicKey || !driverPda || !chargerPda || !sessionPda || !startTs || selected < 0) return;
    try {
      setBusy(true);
      const now = Math.floor(Date.now() / 1000);
      setEndTs(now);
      const ownerPk = new PublicKey(chargers[selected].data.authority);
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

  async function onCreateListing() {
    if (!publicKey || !driverPda) return;
    try {
      setBusy(true);
      const [listingPda] = findListingPda(publicKey);
      const ix = ixCreateListing({ seller: publicKey, driverPda, listingPda, amountPoints: listingAmount, pricePerPointLamports: listingPrice });
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

  async function onCancelListing() {
    if (!publicKey || !driverPda) return;
    try {
      setBusy(true);
      const [listingPda] = findListingPda(publicKey);
      const tx = new Transaction().add(ixCancelListing({ seller: publicKey, driverPda, listingPda }));
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
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Driver – Start/Stop Session</h1>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-medium">Available Chargers</h2>
            <div className="mt-3 grid gap-3">
              {chargers.length === 0 && <p className="text-sm text-gray-500">No chargers found.</p>}
              {chargers.map((c, i) => (
                <button key={c.pubkey.toBase58()} onClick={() => setSelected(i)} className={`text-left rounded-lg border p-4 hover:bg-gray-50 ${i === selected ? "ring-2 ring-black" : ""}`}>
                  <div className="font-medium">{c.data.name} · {c.data.city}</div>
                  <div className="text-sm text-gray-600">{c.data.address}</div>
                  <div className="mt-1 text-xs text-gray-500">Code: {c.data.code} · kW: {c.data.power_kw} · AMP/sec: {c.data.rate_points_per_sec.toString()} · Lamports/sec: {c.data.price_per_sec_lamports.toString()}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-medium">Session Controls</h2>
            <p className="text-sm text-gray-600 mt-1">Select a charger, then start/stop your session.</p>

          <div className="flex gap-3">
            <button disabled={!publicKey || selected < 0 || busy} onClick={onStart} className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50">
              {busy ? "Starting..." : "Start Session"}
            </button>
            <button disabled={!publicKey || !sessionPda || selected < 0 || busy} onClick={onStop} className="rounded-md border px-4 py-2 disabled:opacity-50">
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
          <div>
            <h2 className="text-lg font-medium">List AMP Points</h2>
            <p className="text-sm text-gray-600 mt-1">Create or update your marketplace listing.</p>
            <div className="mt-3 text-sm">Your AMP balance: <span className="font-mono">{driverInfo ? driverInfo.amp_balance.toString() : "0"}</span></div>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-1">
                <span className="text-sm">Amount to list (AMP)</span>
                <input type="number" className="border rounded-md px-3 py-2" value={listingAmount} onChange={e => setListingAmount(parseInt(e.target.value))} />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Price per point (lamports)</span>
                <input type="number" className="border rounded-md px-3 py-2" value={listingPrice} onChange={e => setListingPrice(parseInt(e.target.value))} />
              </label>
              <div className="flex gap-2">
                <button disabled={!publicKey || !driverPda || busy || (driverInfo ? listingAmount > Number(driverInfo.amp_balance) : false)} onClick={onCreateListing} className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50">
                  {busy ? "Submitting..." : "Create/Update Listing"}
                </button>
                <button disabled={!publicKey || !driverPda || busy} onClick={onCancelListing} className="rounded-md border px-4 py-2 disabled:opacity-50">
                  Cancel My Listing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



