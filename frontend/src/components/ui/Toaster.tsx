"use client";

import { useUIStore } from "@/lib/uiStore";

export function Toaster() {
  const toasts = useUIStore(s => s.toasts);
  const remove = useUIStore(s => s.removeToast);
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-3 w-[420px]">
      {toasts.map(t => (
        <div key={t.id} className="relative rounded-xl border border-white/10 bg-neutral-900 text-white p-4 shadow-2xl">
          <div className="text-base font-medium">{t.message}</div>
          {t.tx && (
            <a href={`https://explorer.solana.com/tx/${t.tx}?cluster=devnet`} target="_blank" rel="noreferrer" className="text-sm text-blue-400 underline">View transaction</a>
          )}
          <button onClick={() => remove(t.id)} className="absolute top-2 right-3 text-sm text-neutral-400 hover:text-white">✕</button>
        </div>
      ))}
    </div>
  );
}


