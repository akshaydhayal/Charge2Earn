"use client";

import { useEffect, useMemo, useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { ListingAccount, fetchListings, findDriverPda, findListingPda, findUserPda, ixBuyFromListing, ixCancelListing, ixCreateListing } from "@/lib/program";
import { useUIStore } from "@/lib/uiStore";
import { Spinner } from "@/components/ui/Spinner";

export default function MarketplacePage() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // Create listing (driver)
  const [listAmount, setListAmount] = useState(0);
  const [listPrice, setListPrice] = useState(0);
  // Buy listing (user)
  const [buyAmount, setBuyAmount] = useState(0);
  const [listings, setListings] = useState<Array<{ pubkey: PublicKey; data: ListingAccount }>>([]);
  const [selected, setSelected] = useState<number>(-1);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);

  const driverPda = useMemo(() => (publicKey ? findDriverPda(publicKey)[0] : null), [publicKey]);
  const myListingPda = useMemo(() => (publicKey ? findListingPda(publicKey)[0] : null), [publicKey]);
  const pushToast = useUIStore(s => s.pushToast);

  function formatBig(n: bigint) {
    return n
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function lamportsToSolString(lamports: bigint) {
    const sol = Number(lamports) / 1_000_000_000;
    if (!isFinite(sol)) return "";
    return sol.toFixed(sol >= 1 ? 2 : 6);
  }

  async function loadListings() {
    setLoading(true);
    try {
      const list = await fetchListings(connection);
      setListings(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadListings();
  }, [connection, txSig]);

  async function onCreateListing() {
    if (!publicKey || !driverPda || !myListingPda) return;
    try {
      setBusy(true);
      const ix = ixCreateListing({ seller: publicKey, driverPda, listingPda: myListingPda, amountPoints: listAmount, pricePerPointLamports: listPrice });
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      setTxSig(sig);
      pushToast({ message: "Listing created/updated.", tx: sig });
    } catch (e) {
      console.error(e);
      alert(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onBuy() {
    if (!publicKey || selected < 0) return;
    try {
      setBusy(true);
      const sellerPk = new PublicKey(listings[selected].data.seller);
      const [listingPda] = findListingPda(sellerPk);
      const [userPda] = findUserPda(publicKey);
      const ix = ixBuyFromListing({ buyer: publicKey, userPda, listingPda, sellerPubkey: sellerPk, buyPoints: buyAmount });
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      setTxSig(sig);
      pushToast({ message: "Purchased AMP points.", tx: sig });
      setBuyOpen(false);
    } catch (e) {
      console.error(e);
      alert(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onCancel() {
    if (!publicKey || !driverPda || !myListingPda) return;
    try {
      setBusy(true);
      const ix = ixCancelListing({ seller: publicKey, driverPda, listingPda: myListingPda });
      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
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
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-xl p-6">
          <h2 className="text-xl font-semibold">Points Marketplace</h2>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-gray-600 text-sm">Select a listing and buy AMP points.</p>
            <button onClick={loadListings} className="text-sm rounded-md border px-3 py-1">Refresh</button>
          </div>
          <div className="mt-4 grid gap-3">
            {loading && (
              <div className="py-6 flex items-center justify-center gap-3 text-sm text-gray-400"><Spinner /><span>Fetching listings…</span></div>
            )}
            {!loading && listings.length === 0 && (
              <p className="text-sm text-gray-500">
                No active listings. Create one on the Charge Vehicle page after earning AMP, then return here and Refresh.
              </p>
            )}
            {listings.map((l, i) => (
              <div key={l.pubkey.toBase58()} className={`rounded-lg border p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Seller</div>
                    <div className="font-mono text-xs">{new PublicKey(l.data.seller).toBase58()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Points Available: {formatBig(l.data.amount_total)} AMP</div>
                    <div className="text-sm">Price: {formatBig(l.data.price_per_point_lamports)} lamports/AMP</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <button onClick={() => { setSelected(i); setBuyAmount(1); setBuyOpen(true); }} className="rounded-md bg-black text-white px-4 py-2">Buy Points</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {txSig && (
          <div>
            <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
              View last transaction
            </a>
          </div>
        )}
        {buyOpen && selected >= 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-md rounded-xl bg-neutral-900 text-white p-6 shadow-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Buy AMP Points</h3>
                <button onClick={() => setBuyOpen(false)} className="text-sm text-neutral-400 hover:text-white cursor-pointer">Close</button>
              </div>
              <div className="mt-3 text-sm text-neutral-300">
                <div>Seller: <span className="font-mono text-xs">{new PublicKey(listings[selected].data.seller).toBase58()}</span></div>
                <div className="mt-1">Available: {formatBig(listings[selected].data.amount_total)} AMP</div>
                <div className="mt-1">Price per point: {formatBig(listings[selected].data.price_per_point_lamports)} lamports/AMP (~{lamportsToSolString(listings[selected].data.price_per_point_lamports)} SOL)</div>
              </div>
              <div className="mt-4">
                <label className="text-xs uppercase tracking-wide text-neutral-400">Amount to buy</label>
                <div className="mt-2 flex items-center gap-3">
                  <input type="range" min={1} max={Number(listings[selected].data.amount_total)} value={buyAmount} onChange={(e) => setBuyAmount(parseInt(e.target.value))} className="w-full" />
                  <input type="number" min={1} max={Number(listings[selected].data.amount_total)} className="w-24 rounded-md bg-neutral-800 border border-white/10 px-2 py-1" value={buyAmount} onChange={(e)=> setBuyAmount(parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button disabled={!publicKey || buyAmount <= 0 || busy} onClick={onBuy} className="rounded-md bg-white text-black px-4 py-2 disabled:opacity-50 cursor-pointer">{busy ? "Buying..." : "Confirm Buy"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



