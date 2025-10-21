export const PROGRAM_ID = "9kH9wQbeFXKr1FQ9jcQv51F5wn2XP9D2MVx7CFa72mfr";

export const CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet";

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT ||
  (CLUSTER === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com");



