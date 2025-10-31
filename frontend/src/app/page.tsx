"use client";
import Link from "next/link";
import { Nav } from "@/components/ui/Nav";
import { useUIStore } from "@/lib/uiStore";

export default function Home() {
  const openAddCharger = useUIStore(s => s.openAddCharger);
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0e1630] to-[#0b1220]">
      <Nav />
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Subtle background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800/10 via-slate-800/10 to-gray-800/10"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-gray-700/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-slate-700/5 rounded-full blur-3xl"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 py-14 grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-gray-800/50 border border-gray-600/30 text-gray-300 text-xs font-medium">
                ⚡ Powered by Solana Blockchain
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight">
                Charge2Earn
              </h1>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-400">
                On-Chain EV Charging Rewards
              </h2>
            </div>
            
            <p className="text-lg text-gray-400 leading-relaxed max-w-2xl">
              Earn <span className="text-gray-200 font-semibold">AMP points</span> automatically while charging your EV. 
              Support the network by trading points in our marketplace. Real-time sessions, 
              eco-leaderboards, and sustainable rewards – all on Solana.
            </p>
            
            <div className="flex flex-wrap gap-3.5">
              <Link 
                href="/chargers" 
                className="group relative px-5 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 border border-gray-600/30 cursor-pointer"
              >
                <span className="relative z-10">Find Chargers</span>
              </Link>
              
              <Link 
                href="/marketplace" 
                className="group px-5 py-3 bg-white/5 backdrop-blur-sm text-white font-semibold rounded-lg border border-gray-600/30 hover:bg-white/10 hover:border-gray-500/50 transition-all duration-300 transform hover:scale-105 cursor-pointer"
              >
                Points Marketplace
              </Link>
              
              <button 
                onClick={openAddCharger} 
                className="group px-5 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 border border-gray-500/30 cursor-pointer"
              >
                Register Charger
              </button>
            </div>
          </div>
          
          {/* Feature Cards */}
          <div className="space-y-6">
            <div className="grid gap-6">
              <div className="group relative p-4 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-lg border border-gray-600/20 hover:border-gray-500/40 transition-all duration-300 transform hover:scale-105">
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-gray-700 rounded-md flex items-center justify-center mb-3">
                    <span className="text-lg">⚡</span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Real-time Charging</h3>
                  <p className="text-gray-400 text-sm">Start sessions, earn points, and track your eco-impact in real-time with live updates.</p>
                </div>
              </div>
              
              <div className="group relative p-4 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-lg border border-gray-600/20 hover:border-gray-500/40 transition-all duration-300 transform hover:scale-105">
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-gray-700 rounded-md flex items-center justify-center mb-3">
                    <span className="text-lg">💰</span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Earn While Charging</h3>
                  <p className="text-gray-400 text-sm">Get rewarded with AMP points for every second you charge, promoting sustainable transportation.</p>
                </div>
              </div>
              
              <div className="group relative p-4 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-lg border border-gray-600/20 hover:border-gray-500/40 transition-all duration-300 transform hover:scale-105">
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-gray-700 rounded-md flex items-center justify-center mb-3">
                    <span className="text-lg">🏆</span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Eco Leaderboard</h3>
                  <p className="text-gray-400 text-sm">Compete with other drivers and see who&apos;s making the biggest environmental impact.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* How it works section */}
      <section className="relative py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-400">Simple steps to start earning while charging</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Register Charger",
                description: "Operators register charging stations with a 0.5 SOL fee",
                icon: "🏪"
              },
              {
                step: "02", 
                title: "Start Session",
                description: "Drivers connect and start charging sessions",
                icon: "🔌"
              },
              {
                step: "03",
                title: "Earn Points", 
                description: "Earn AMP points based on charging duration",
                icon: "⚡"
              },
              {
                step: "04",
                title: "Trade Points",
                description: "Buy and sell AMP points in the marketplace",
                icon: "💱"
              }
            ].map((item, index) => (
              <div key={index} className="group relative">
                <div className="relative p-8 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-2xl border border-gray-600/20 hover:border-gray-500/40 transition-all duration-300 transform hover:scale-105">
                  <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center mb-6 text-3xl">
                    {item.icon}
                  </div>
                  <div className="text-2xl font-bold text-gray-300 mb-2">{item.step}</div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
