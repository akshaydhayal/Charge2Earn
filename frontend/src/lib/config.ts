export const PROGRAM_ID = "9oMQzz6sMnnSZ9sDeb5pi8gNyV568qfo4FEGR3uDsyuC";

export const CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet";

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
  (CLUSTER === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com");



