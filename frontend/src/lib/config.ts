export const PROGRAM_ID = "E4pyU4z4hM7XPGVPgJdx8tbfnMWmLzXH8ahtvvuXmiBW";

export const CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet";

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
  (CLUSTER === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com");



