Charge2Earn Frontend

A Next.js (App Router) dapp for the Charge2Earn Solana program.

Setup

1. Copy env:

```
cp .env.example .env.local
```

Add `NEXT_PUBLIC_RPC_ENDPOINT` if you want a custom RPC; defaults to devnet.

2. Install deps and run:

```
npm i
npm run dev
```

Program

- Program ID: `9kH9wQbeFXKr1FQ9jcQv51F5wn2XP9D2MVx7CFa72mfr` (devnet)
- Non-Anchor native program using Borsh.

Pages

- `/` – landing + nav
- `/operator` – register charger (pays 0.5 SOL to admin)
- `/chargers` – select charging points and start/stop sessions, pay lamports per sec, earn AMP
- `/marketplace` – create/cancel listing, buy AMP
- `/leaderboard` – lightweight on-chain scan for balances

Notes

- Wallet adapters included (Phantom, Solflare, Coinbase, Brave, Torus).
- Transactions are built to match the TS tests and program instruction order.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
