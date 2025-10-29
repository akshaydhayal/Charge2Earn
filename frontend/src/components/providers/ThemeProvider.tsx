"use client";

import { ReactNode } from "react";

// Aurora theme applied site-wide
export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeClasses = "bg-gradient-to-b from-emerald-950 via-slate-950 to-indigo-950 text-white";
  return <div className={themeClasses}>{children}</div>;
}


