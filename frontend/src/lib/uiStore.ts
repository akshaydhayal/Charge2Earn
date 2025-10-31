import { create } from "zustand";

type UIState = {
  addChargerOpen: boolean;
  openAddCharger: () => void;
  closeAddCharger: () => void;
  chargerVersion: number;
  bumpChargerVersion: () => void;
  accountBalanceVersion: number;
  bumpAccountBalanceVersion: () => void;
  toasts: { id: string; message: string; tx?: string }[];
  pushToast: (t: { message: string; tx?: string }) => void;
  removeToast: (id: string) => void;
};

export const useUIStore = create<UIState>((set) => ({
  addChargerOpen: false,
  openAddCharger: () => set({ addChargerOpen: true }),
  closeAddCharger: () => set({ addChargerOpen: false }),
  chargerVersion: 0,
  bumpChargerVersion: () => set((s) => ({ chargerVersion: s.chargerVersion + 1 })),
  accountBalanceVersion: 0,
  bumpAccountBalanceVersion: () => set((s) => ({ accountBalanceVersion: s.accountBalanceVersion + 1 })),
  toasts: [],
  pushToast: (t) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, ...t }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, 7000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));


