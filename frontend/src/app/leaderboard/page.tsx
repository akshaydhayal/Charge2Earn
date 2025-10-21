"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { useConnection } from "@solana/wallet-adapter-react";
import { PROGRAM_PUBKEY } from "@/lib/program";
import { PublicKey } from "@solana/web3.js";

// Simple leaderboard by scanning user PDAs of type `user` and `driver` prefix
// This is a demo scanner; in a real app you'd index off-chain

type Row = { type: "driver" | "user"; pubkey: string; amp: bigint };

export default function LeaderboardPage() {
  const { connection } = useConnection();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const program = PROGRAM_PUBKEY;
        const driverSeed = Buffer.from("driver");
        const userSeed = Buffer.from("user");
        const accounts = await connection.getProgramAccounts(program, { dataSlice: { offset: 0, length: 0 } });
        const candidatePubkeys: PublicKey[] = accounts.map(a => a.pubkey);
        const fetched = await Promise.all(
          candidatePubkeys.map(async pk => {
            const info = await connection.getAccountInfo(pk);
            if (!info?.data) return null;
            // very rough heuristic: parse last 8 bytes as amp if size matches expected minimal structures
            if (info.data.length === 8) {
              const dv = new DataView(info.data.buffer, info.data.byteOffset, info.data.byteLength);
              const amp = dv.getBigUint64(0, true);
              return { type: "user" as const, pubkey: pk.toBase58(), amp } satisfies Row;
            }
            if (info.data.length >= 1 + 32 + 8) {
              // driver account
              const amp = new DataView(info.data.buffer, info.data.byteOffset + 1 + 32, 8).getBigUint64(0, true);
              return { type: "driver" as const, pubkey: pk.toBase58(), amp } satisfies Row;
            }
            return null;
          })
        );
        const filtered = (fetched.filter(Boolean) as Row[]).sort((a, b) => Number(b.amp - a.amp)).slice(0, 50);
        if (!cancelled) setRows(filtered);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection]);

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Leaderboard</h1>
        <p className="text-gray-600 mt-2">Top AMP balances across drivers and users (best-effort scan).</p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Type</th>
                <th className="py-2">Account</th>
                <th className="py-2">AMP</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="py-3" colSpan={3}>Loading...</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td className="py-3" colSpan={3}>No data found</td></tr>
              )}
              {rows.map(r => (
                <tr key={r.pubkey} className="border-b last:border-0">
                  <td className="py-2 capitalize">{r.type}</td>
                  <td className="py-2 font-mono">{r.pubkey}</td>
                  <td className="py-2">{r.amp.toString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



