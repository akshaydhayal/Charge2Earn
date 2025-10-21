"use client";

import { useMemo, useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { findDriverPda, findListingPda, findUserPda, ixBuyFromListing, ixCancelListing, ixCreateListing } from "@/lib/program";

export default function MarketplacePage() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // Create listing (driver)
  const [listAmount, setListAmount] = useState(0);
  const [listPrice, setListPrice] = useState(0);
  // Buy listing (user)
  const [seller, setSeller] = useState("");
  const [buyAmount, setBuyAmount] = useState(0);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const driverPda = useMemo(() => (publicKey ? findDriverPda(publicKey)[0] : null), [publicKey]);
  const myListingPda = useMemo(() => (publicKey ? findListingPda(publicKey)[0] : null), [publicKey]);

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
    if (!publicKey) return;
    try {
      setBusy(true);
      const sellerPk = new PublicKey(seller);
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
      <div className="mx-auto max-w-5xl px-4 py-10 grid gap-10 md:grid-cols-2">
        <div className="rounded-xl border p-6">
          <h2 className="text-xl font-semibold">Create / Update Listing</h2>
          <p className="text-gray-600 text-sm mt-1">Reserve AMP points for sale.</p>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1">
              <span className="text-sm">Amount AMP</span>
              <input type="number" className="border rounded-md px-3 py-2" value={listAmount} onChange={e => setListAmount(parseInt(e.target.value))} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Price per point (lamports)</span>
              <input type="number" className="border rounded-md px-3 py-2" value={listPrice} onChange={e => setListPrice(parseInt(e.target.value))} />
            </label>
            <div className="flex gap-2">
              <button disabled={!publicKey || !driverPda || busy} onClick={onCreateListing} className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50">{busy ? "Submitting..." : "Create/Update"}</button>
              <button disabled={!publicKey || !driverPda || busy} onClick={onCancel} className="rounded-md border px-4 py-2 disabled:opacity-50">Cancel Listing</button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="text-xl font-semibold">Buy Listing</h2>
          <p className="text-gray-600 text-sm mt-1">Buy AMP points from a seller.</p>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1">
              <span className="text-sm">Seller Pubkey</span>
              <input className="border rounded-md px-3 py-2" value={seller} onChange={e => setSeller(e.target.value)} placeholder="Seller public key" />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Amount to buy (AMP)</span>
              <input type="number" className="border rounded-md px-3 py-2" value={buyAmount} onChange={e => setBuyAmount(parseInt(e.target.value))} />
            </label>
            <button disabled={!publicKey || !seller || buyAmount <= 0 || busy} onClick={onBuy} className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50">{busy ? "Buying..." : "Buy"}</button>
          </div>
        </div>

        {txSig && (
          <div className="md:col-span-2">
            <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
              View last transaction
            </a>
          </div>
        )}
      </div>
    </div>
  );
}



