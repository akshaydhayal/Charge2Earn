"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { ChargerAccount, fetchChargers } from "@/lib/program";
import { useUIStore } from "@/lib/uiStore";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";

export default function ChargersPage() {
  const { connection } = useConnection();

  const [chargers, setChargers] = useState<Array<{ pubkey: PublicKey; data: ChargerAccount }>>([]);
  const chargerVersion = useUIStore(s => s.chargerVersion);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await fetchChargers(connection);
        setChargers(list);
      } finally {
        setLoading(false);
      }
    })();
  }, [connection, chargerVersion]);

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Chargers – Select a Charging Point</h1>
        <div className="mt-6 grid gap-4">
          {loading && (
            <div className="py-6 flex items-center justify-center gap-3 text-sm text-gray-400"><Spinner /><span>Fetching chargers…</span></div>
          )}
          {!loading && chargers.length === 0 && <p className="text-sm text-gray-500">No chargers found.</p>}
          {chargers.map((c) => {
            const owner = new PublicKey(c.data.authority);
            return (
              <div key={c.pubkey.toBase58()} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.data.name} · {c.data.city}</div>
                    <div className="text-sm text-gray-600">{c.data.address}</div>
                    <div className="mt-1 text-xs text-gray-500">Code: {c.data.code} · kW: {c.data.power_kw} · AMP/sec: {c.data.rate_points_per_sec.toString()} · Lamports/sec: {c.data.price_per_sec_lamports.toString()}</div>
                  </div>
                  <Link href={`/charger/${owner.toBase58()}/${encodeURIComponent(c.data.code)}`} className="rounded-md bg-black text-white px-4 py-2">Select Charger</Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



