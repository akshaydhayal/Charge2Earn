"use client";

import { useUIStore } from "@/lib/uiStore";

export function Toaster() {
  const toasts = useUIStore(s => s.toasts);
  const remove = useUIStore(s => s.removeToast);
  return (
    <div className="fixed top-6 right-6 z-[100] space-y-4 w-[420px]">
      {toasts.map(t => (
        <div key={t.id} className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 text-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                ✅
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-semibold text-white mb-2">{t.message}</div>
                {t.tx && (
                  <a 
                    href={`https://explorer.solana.com/tx/${t.tx}?cluster=devnet`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    View Transaction ↗️
                  </a>
                )}
              </div>
              <button 
                onClick={() => remove(t.id)} 
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white hover:text-gray-300 transition-all duration-300 cursor-pointer flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


