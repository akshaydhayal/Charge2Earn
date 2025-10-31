"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { ListingAccount, DriverAccount, fetchListings, fetchDriver, findDriverPda, findListingPda, findUserPda, ixBuyFromListing, ixCreateListing, ixCancelListing } from "@/lib/program";
import { useUIStore } from "@/lib/uiStore";
import { Spinner } from "@/components/ui/Spinner";
import { WalletNotConnectedError } from "@/components/ui/WalletNotConnectedError";
import { AccountBalances } from "@/components/ui/AccountBalances";

export default function MarketplacePage() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // Buy listing (user)
  const [buyAmount, setBuyAmount] = useState(0);
  const [listings, setListings] = useState<Array<{ pubkey: PublicKey; data: ListingAccount }>>([]);
  const [selected, setSelected] = useState<number>(-1);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  
  // Points Management (list/cancel)
  const [driverInfo, setDriverInfo] = useState<DriverAccount | null>(null);
  const [listingAmount, setListingAmount] = useState(0);
  const [listingPrice, setListingPrice] = useState(0);
  const [listingOpen, setListingOpen] = useState(false);

  const pushToast = useUIStore(s => s.pushToast);
  const bumpAccountBalanceVersion = useUIStore(s => s.bumpAccountBalanceVersion);
  
  const driverPda = publicKey ? findDriverPda(publicKey)[0] : null;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, txSig]);

  // Fetch driver info
  useEffect(() => {
    (async () => {
      if (!driverPda) return;
      const data = await fetchDriver(connection, driverPda);
      setDriverInfo(data);
    })();
  }, [connection, driverPda, txSig]);

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
      await connection.confirmTransaction(sig, "finalized");
      setTxSig(sig);
      bumpAccountBalanceVersion(); // Refresh account balances
      pushToast({ message: "Purchased AMP points.", tx: sig });
      setBuyOpen(false);
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
      setListingOpen(false);
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

  function formatBig(n: bigint) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0e1630] to-[#0b1220]">
      <Nav />
      <AccountBalances />
      <div className="mx-auto max-w-7xl px-4 py-1">
        {/* Wallet Not Connected Error */}
        {!publicKey ? (
          <WalletNotConnectedError />
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-4">
          {/* <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2.5">
            Points Marketplace
          </h1> */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <p className="text-lg font-semibold text-gray-300">
              Buy and sell AMP points from other drivers to support the ecosystem
            </p>
            <button 
              onClick={loadListings} 
              className="group relative px-4 py-2 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 border border-gray-600/30 cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span>Refresh Listings</span>
                <span className="group-hover:rotate-180 transition-transform duration-300">🔄</span>
              </span>
            </button>
          </div>
        </div>

        {/* Compact Points Management */}
        <div className="mb-6">
          <div className="relative bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-amber-500/10 backdrop-blur-xl rounded-xl border border-purple-500/30 p-4 shadow-lg shadow-purple-500/10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Your AMP Balance</div>
                  <div className="text-lg font-bold text-white">
                    {driverInfo ? formatBig(driverInfo.amp_balance) : "0"}
                  </div>
                </div>
              </div>
              
              {driverInfo && driverInfo.amp_balance > BigInt(0) && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setListingOpen(true)} 
                    className="group/btn relative px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 transform hover:scale-105 border border-purple-500/30 shadow-md shadow-purple-500/20 cursor-pointer"
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      <span>List Points</span>
                      <span className="text-xs">💰</span>
                    </span>
                  </button>
                  
                  <button 
                    disabled={!publicKey || !driverPda || busy} 
                    onClick={onCancelListing} 
                    className="group/btn relative px-4 py-2 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 border border-gray-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      <span>Cancel your Listing</span>
                      <span className="text-xs">❌</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3.5 bg-white/5 backdrop-blur-xl rounded-xl px-6 py-5 border border-gray-600/20">
              <Spinner />
              <span className="text-white text-base">Fetching listings…</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && listings.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">
              💱
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Listings Available</h3>
            <p className="text-gray-400">Create one on the Chargers page after earning AMP, then return here and refresh</p>
          </div>
        )}

        {/* Listings Grid */}
        {!loading && listings.length > 0 && (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((l, i) => {
              const seller = new PublicKey(l.data.seller);
              return (
                <div key={l.pubkey.toBase58()} className="group relative max-w-sm w-full mx-auto">
                  {/* Card */}
                  <div className="relative bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-md border border-gray-600/20 hover:border-gray-500/40 transition-all duration-300 transform group-hover:scale-[1.01] overflow-hidden">
                    {/* Header */}
                    <div className="p-3 border-b border-gray-600/20">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-8 h-8 bg-gray-700 rounded-md flex items-center justify-center text-sm">
                          💰
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">AMP Points</h3>
                          <p className="text-gray-300 text-xs leading-none">Seller: {seller.toBase58().slice(0, 8)}…</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="p-3 space-y-2.5">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-1.5 bg-gray-700/30 rounded-md">
                          <span className="text-gray-300 text-xs">Points Available</span>
                          <span className="text-sm font-semibold text-gray-200">{formatBig(l.data.amount_total)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-1.5 bg-gray-700/30 rounded-md">
                          <span className="text-gray-300 text-xs">Lamports per AMP Point</span>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-200 leading-none">{formatBig(l.data.price_per_point_lamports)}</div>
                            <div className="text-[11px] text-gray-400 leading-none">lamports</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="p-3 pt-0">
                      <button
                        disabled={!publicKey || busy}
                        onClick={() => { setSelected(i); setBuyAmount(1); setBuyOpen(true); }}
                        className="w-full group/btn relative inline-flex items-center justify-center px-3.5 py-2 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-600 transition-all duration-300 transform hover:scale-[1.01] border border-gray-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <span>Buy Points</span>
                          <span className="group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

            {txSig && (
              <div>
                <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                  View last transaction
                </a>
              </div>
            )}
          </>
        )}
        {/* List Points Modal */}
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
                      onChange={e => setListingAmount(parseInt(e.target.value) || 0)} 
                      placeholder="Enter amount"
                    />
                  </label>
                  
                  <label className="block">
                    <span className="text-sm text-gray-400 mb-2 block">Price per point (lamports)</span>
                    <input 
                      type="number" 
                      className="w-full rounded-lg px-3.5 py-2.5 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500/40 focus:border-gray-500/40 transition-all duration-300" 
                      value={listingPrice} 
                      onChange={e => setListingPrice(parseInt(e.target.value) || 0)} 
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
        {buyOpen && selected >= 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="group relative w-full max-w-lg mx-4">
              <div className="relative bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-xl border border-gray-600/20 p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-xl">
                      💰
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Buy AMP Points</h3>
                      <p className="text-gray-400 text-xs">Purchase points from this seller</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setBuyOpen(false)} 
                    className="w-8 h-8 rounded-full bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center text-white hover:text-gray-300 transition-all duration-300 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Seller Info */}
                <div className="mb-5 p-3.5 bg-gray-700/30 rounded-lg border border-gray-600/20">
                  <div className="text-xs text-gray-400 mb-1.5">Seller Information</div>
                  <div className="text-xs font-mono text-white break-all mb-2.5">
                    {new PublicKey(listings[selected].data.seller).toBase58()}
                  </div>
                  <div className="grid grid-cols-2 gap-3.5 text-sm">
                    <div>
                      <div className="text-gray-400 text-xs">Points Available</div>
                      <div className="text-gray-200 font-bold text-base">{formatBig(listings[selected].data.amount_total)} AMP</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Lamports per AMP Point</div>
                      <div className="text-gray-200 font-bold text-base">{formatBig(listings[selected].data.price_per_point_lamports)} lamports</div>
                    </div>
                  </div>
                  {/* <div className="mt-2.5 text-sm">
                    <div className="text-gray-400 text-xs">SOL per Point</div>
                    <div className="text-gray-200 font-bold text-base">≈ {lamportsToSolString(listings[selected].data.price_per_point_lamports)} SOL</div>
                  </div> */}
                </div>

                {/* Amount Selection */}
                <div className="mb-5">
                  <label className="text-xs text-gray-400 mb-2.5 block">Amount to Buy</label>
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-3.5">
                      <input 
                        type="range" 
                        min={1} 
                        max={Number(listings[selected].data.amount_total)} 
                        value={buyAmount} 
                        onChange={(e) => setBuyAmount(parseInt(e.target.value))} 
                        className="flex-1 h-2 bg-white/10 rounded-md appearance-none cursor-pointer slider"
                      />
                      <input 
                        type="number" 
                        min={1} 
                        max={Number(listings[selected].data.amount_total)} 
                        className="w-24 rounded-lg px-2.5 py-1.5 bg-white/10 border border-white/20 text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-300" 
                        value={buyAmount} 
                        onChange={(e) => setBuyAmount(parseInt(e.target.value) || 0)} 
                      />
                    </div>
                    
                    {/* Price Calculation */}
                    <div className="p-3.5 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300 text-sm">Total Cost</span>
                        <span className="text-xl font-bold text-gray-200">
                          {buyAmount > 0 ? lamportsToSolString(BigInt(listings[selected].data.price_per_point_lamports) * BigInt(buyAmount)) : "0"} SOL
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {buyAmount} points × {lamportsToSolString(listings[selected].data.price_per_point_lamports)} SOL
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  disabled={!publicKey || buyAmount <= 0 || busy} 
                  onClick={onBuy} 
                  className="w-full group/btn relative px-5 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 border border-gray-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span>{busy ? "Buying..." : "Confirm Buy"}</span>
                    <span className="group-hover/btn:translate-x-1 transition-transform duration-300">💳</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



