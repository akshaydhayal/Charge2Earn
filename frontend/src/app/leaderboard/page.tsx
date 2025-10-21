"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { useConnection } from "@solana/wallet-adapter-react";
import { PROGRAM_PUBKEY } from "@/lib/program";
import { PublicKey } from "@solana/web3.js";

// Simple leaderboard for driver PDAs only

type Row = { type: "driver"; pubkey: string; amp: bigint };

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
        const accounts = await connection.getProgramAccounts(program);
        const candidatePubkeys: PublicKey[] = accounts.map(a => a.pubkey);
        const fetched = await Promise.all(
          candidatePubkeys.map(async pk => {
            const info = await connection.getAccountInfo(pk);
            if (!info?.data) return null;
            // account_type (byte 0) must be 2 (driver)
            const accountType = new DataView(info.data.buffer, info.data.byteOffset, 1).getUint8(0);
            if (accountType !== 2) return null;
            // layout: [account_type:1][is_initialized:1][owner:32][amp_balance:8]...
            if (info.data.length < 1 + 1 + 32 + 8) return null;
            const amp = new DataView(info.data.buffer, info.data.byteOffset + 1 + 1 + 32, 8).getBigUint64(0, true);
            return { type: "driver" as const, pubkey: pk.toBase58(), amp } satisfies Row;
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
        <p className="text-gray-600 mt-2">Top AMP balances across drivers (filtered by account_type=2).</p>

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



