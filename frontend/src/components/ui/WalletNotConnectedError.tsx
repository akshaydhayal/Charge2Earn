"use client";

export function WalletNotConnectedError() {
  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="relative bg-gradient-to-br from-red-500/10 via-orange-500/5 to-yellow-500/10 backdrop-blur-xl rounded-xl border border-red-500/30 p-6 shadow-lg shadow-red-500/10">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-red-500/20">
            ⚠️
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">Wallet Not Connected</h3>
            <p className="text-gray-300 text-sm mb-4">
              Please connect your Solana wallet to use this feature. Click the wallet button in the navigation bar to connect.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>💡</span>
              <span>Supported wallets: Phantom, Solflare, Coinbase, and more</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

