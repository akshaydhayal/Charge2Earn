"use client";

import { useEffect, useMemo, useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { ListingAccount, fetchListings, findDriverPda, findListingPda, findUserPda, ixBuyFromListing, ixCancelListing, ixCreateListing } from "@/lib/program";

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

  const driverPda = useMemo(() => (publicKey ? findDriverPda(publicKey)[0] : null), [publicKey]);
  const myListingPda = useMemo(() => (publicKey ? findListingPda(publicKey)[0] : null), [publicKey]);

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
    const list = await fetchListings(connection);
    setListings(list);
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
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-xl border p-6">
          <h2 className="text-xl font-semibold">Marketplace Listings</h2>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-gray-600 text-sm">Select a listing and buy AMP points.</p>
            <button onClick={loadListings} className="text-sm rounded-md border px-3 py-1">Refresh</button>
          </div>
          <div className="mt-4 grid gap-3">
            {listings.length === 0 && (
              <p className="text-sm text-gray-500">
                No active listings. Create one on the Driver page after earning AMP, then return here and Refresh.
              </p>
            )}
            {listings.map((l, i) => (
              <div key={l.pubkey.toBase58()} className={`rounded-lg border p-4 ${i === selected ? "ring-2 ring-black" : ""}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Seller</div>
                    <div className="font-mono text-xs">{new PublicKey(l.data.seller).toBase58()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Available: {formatBig(l.data.amount_total)} AMP</div>
                    <div className="text-sm">Price: {formatBig(l.data.price_per_point_lamports)} lamports (~{lamportsToSolString(l.data.price_per_point_lamports)} SOL)</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <input type="number" min={1} placeholder="Amount to buy" className="border rounded-md px-3 py-2 w-40" value={i === selected ? buyAmount : 0} onChange={e => { setSelected(i); setBuyAmount(parseInt(e.target.value)); }} />
                  <button onClick={() => { setSelected(i); }} className="rounded-md border px-3 py-2">Select</button>
                  <button disabled={!publicKey || selected !== i || buyAmount <= 0 || busy} onClick={onBuy} className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50">{busy ? "Buying..." : "Buy"}</button>
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
      </div>
    </div>
  );
}



