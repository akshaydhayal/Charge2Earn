"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { findDriverPda, findUserPda, fetchDriver, fetchUser, DriverAccount, UserAccount } from "@/lib/program";
import { useUIStore } from "@/lib/uiStore";

export function AccountBalances() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const accountBalanceVersion = useUIStore(s => s.accountBalanceVersion);
  
  const [driverInfo, setDriverInfo] = useState<DriverAccount | null>(null);
  const [userInfo, setUserInfo] = useState<UserAccount | null>(null);

  const driverPda = useMemo(() => (publicKey ? findDriverPda(publicKey)[0] : null), [publicKey]);
  const userPda = useMemo(() => (publicKey ? findUserPda(publicKey)[0] : null), [publicKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!publicKey) {
        setDriverInfo(null);
        setUserInfo(null);
        return;
      }

      try {
        const [driverData, userData] = await Promise.all([
          driverPda ? fetchDriver(connection, driverPda) : Promise.resolve(null),
          userPda ? fetchUser(connection, userPda) : Promise.resolve(null),
        ]);
        
        if (!cancelled) {
          setDriverInfo(driverData);
          setUserInfo(userData);
        }
      } catch (error) {
        console.error("Error fetching account balances:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connection, driverPda, userPda, publicKey, accountBalanceVersion]);

  if (!publicKey) return null;

  const hasDriver = driverInfo !== null;
  const hasUser = userInfo !== null;

  if (!hasDriver && !hasUser) return null;

  function formatBig(n: bigint) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 mb-3 mt-2">
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-md border border-gray-700/30 px-3 py-1.5">
        <div className="flex items-center justify-center gap-4 flex-wrap text-[11px]">
          {hasDriver && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Driver Account:</span>
              <span className="text-white font-semibold">{formatBig(driverInfo!.amp_balance)} AMP</span>
              <span className="text-gray-500 text-[9px] font-mono">
                ({driverPda?.toBase58().slice(0, 4)}...{driverPda?.toBase58().slice(-4)})
              </span>
            </div>
          )}
          
          {hasUser && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">User Account:</span>
              <span className="text-white font-semibold">{formatBig(userInfo!.amp_balance)} AMP</span>
              <span className="text-gray-500 text-[9px] font-mono">
                ({userPda?.toBase58().slice(0, 4)}...{userPda?.toBase58().slice(-4)})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


