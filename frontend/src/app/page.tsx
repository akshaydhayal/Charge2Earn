import Link from "next/link";
import { Nav } from "@/components/ui/Nav";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Charge2Earn – On-Chain EV Charging Rewards</h1>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Earn AMP points automatically while charging. Support the network by buying or staking points. Real-time sessions, marketplace, and eco-leaderboards – all on Solana Devnet.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/driver" className="rounded-md bg-black text-white px-4 py-2">Start Charging</Link>
            <Link href="/marketplace" className="rounded-md border px-4 py-2">Buy AMP Points</Link>
            <Link href="/operator" className="rounded-md border px-4 py-2">Register Charger</Link>
          </div>
        </div>
        <div className="rounded-xl border p-6 bg-white shadow-sm">
          <h3 className="text-lg font-medium">How it works</h3>
          <ol className="mt-3 list-decimal pl-5 space-y-2 text-gray-700">
            <li>Operators register chargers (0.5 SOL fee).</li>
            <li>Drivers start/stop sessions and pay per-second SOL.</li>
            <li>Drivers earn AMP points based on session duration.</li>
            <li>Users buy AMP in the marketplace to support drivers.</li>
          </ol>
        </div>
      </section>
    </div>
  );
}
