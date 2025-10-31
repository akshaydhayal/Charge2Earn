# Charge2Earn: Blockchain-Powered EV Charging Rewards Platform
Live Project Link: [https://charge2-earn.vercel.app/](https://charge2-earn.vercel.app/)

<div align="center">

**Gamifying Sustainable Transportation Through Blockchain Rewards**

[![Solana](https://img.shields.io/badge/Solana-140089?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Demo](#-demo) • [Features](#-features) • [Installation](#-installation) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**Charge2Earn** is a Solana-based decentralized application that revolutionizes electric vehicle charging by gamifying the experience through blockchain rewards. Drivers earn tradable **AMP points** for every second they charge, while operators register their charging stations on-chain, creating a transparent and incentivized ecosystem for sustainable transportation.

### Key Highlights

- ⚡ **Real-Time Rewards**: Earn AMP points every second during charging
- 🔐 **On-Chain Verification**: All transactions recorded on Solana blockchain
- 💎 **True Ownership**: Users own their rewards with full control
- 🏪 **Peer-to-Peer Marketplace**: Trade AMP points instantly
- 🏆 **Competitive Leaderboards**: Gamified eco-friendly behavior
- 🌱 **Sustainability Focus**: Incentivizing green transportation

---

## 🎥 Demo Video
[https://www.loom.com/share/81ecb063ef90476fa2e2abc916047976](https://www.loom.com/share/81ecb063ef90476fa2e2abc916047976)

---

## 📸 Website Demo

### Chargers List
![Chargers Page](https://github.com/akshaydhayal/Charge2Earn/blob/main/frontend/assets/chargers.png)
*Browse all available charging stations with real-time availability*

### Specific Charger Page
![Specific Charger Page](https://github.com/akshaydhayal/Charge2Earn/blob/main/frontend/assets/chargepage.png)
*Specific Charger page with Charging Station info section, charging feature for driver's vehcile with real-time charging stats: elapsed time, AMP points earned, and cost*

### Marketplace
![Marketplace](https://github.com/akshaydhayal/Charge2Earn/blob/main/frontend/assets/marketplace.png)
*Peer-to-peer marketplace for buying and selling AMP points*

### Leaderboard
![Leaderboard](https://github.com/akshaydhayal/Charge2Earn/blob/main/frontend/assets/leaderboard.png)
*Top eco-drivers ranked by their AMP point balances*

### Register Charging Station Modal
![Account Balances](https://github.com/akshaydhayal/Charge2Earn/blob/main/frontend/assets/register_charger.png)

### Buy Listed Points from Marketplace
![Account Balances](https://github.com/akshaydhayal/Charge2Earn/blob/main/frontend/assets/buy%20points.png)

### List Driver's AMP Points
![Account Balances](https://github.com/akshaydhayal/Charge2Earn/blob/main/frontend/assets/list%20points.png)

---

## ✨ Features

### 🔌 On-Chain Charger Registration
- Operators register charging stations permanently on Solana blockchain
- 0.5 SOL registration fee for platform sustainability
- Immutable, verifiable records with detailed information:
  - Location coordinates (latitude, longitude)
  - Power output (kW)
  - Charging rates (AMP points per second)
  - Pricing (lamports per second)

### ⚡ Real-Time Charging Sessions
- **Live Updates**: Counter updates every second during charging
- **AMP Points Calculation**: Real-time point accumulation based on charger rate
- **Cost Tracking**: Transparent SOL cost calculation
- **Session Management**: Start/stop sessions with instant on-chain recording
- **Gamified Interface**: Engaging visual feedback with modern UI

### 💰 AMP Points Marketplace
- **List Points**: Drivers can list their AMP points at custom prices
- **Buy Points**: Instant purchases using SOL with secure transactions
- **Slider Interface**: Easy amount selection with price calculation
- **Real-Time Prices**: Instant SOL conversion for any quantity
- **Points Management**: Cancel listings and manage your points

### 🏆 Competitive Leaderboard
- **Top 50 Drivers**: Ranked by total AMP point balances
- **Profile Avatars**: Auto-generated identicons for each driver
- **Real-Time Rankings**: Automatically updated as points are earned
- **User Highlighting**: Your ranking highlighted when wallet is connected
- **Visual Badges**: Top 3 drivers with special indicators

### 👤 Account Management
- **Driver Account**: AMP balance from charging sessions
- **User Account**: AMP balance from marketplace purchases
- **Auto-Refresh**: Balances update automatically after transactions
- **Compact Display**: Clean, minimal UI at the top of all pages

---

## 🛠️ Technology Stack

### Blockchain Layer
- **Platform**: Solana
- **Program Type**: Native Solana Program (No Anchor Framework)
- **Serialization**: Borsh
- **Network**: Solana Devnet (Mainnet ready)
- **Program ID**: `9oMQzz6sMnnSZ9sDeb5pi8gNyV568qfo4FEGR3uDsyuC`

### Smart Contract
- **Language**: Rust
- **Framework**: Native Solana Program
- **Key Features**:
  - Program Derived Addresses (PDAs)
  - Cross-program invocations
  - Account state management
  - Instruction serialization with Borsh

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Wallet Integration**: Solana Wallet Adapter
  - Supports: Phantom, Solflare, Coinbase Wallet, Brave, Torus
- **UI Components**: Custom components with dark theme
- **Deployment**: Vercel-ready

---

## 📁 Project Structure

```
charge2Earn/
├── contract/                 # Solana smart contract (Rust)
│   ├── src/
│   │   └── lib.rs           # Main program logic
│   ├── Cargo.toml           # Rust dependencies
│   └── target/              # Compiled artifacts
│
├── frontend/                # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js app router pages
│   │   │   ├── page.tsx      # Home page
│   │   │   ├── chargers/     # Chargers listing page
│   │   │   ├── charger/      # Individual charger pages
│   │   │   ├── marketplace/  # Marketplace page
│   │   │   └── leaderboard/ # Leaderboard page
│   │   ├── components/       # React components
│   │   │   ├── ui/          # UI components (Nav, Spinner, etc.)
│   │   │   ├── modals/      # Modal components
│   │   │   └── providers/   # Context providers
│   │   └── lib/            # Utilities and program interactions
│   │       ├── program.ts   # Solana program interactions
│   │       ├── uiStore.ts   # Zustand state management
│   │       └── config.ts    # Configuration
│   ├── public/             # Static assets
│   ├── package.json        # Node.js dependencies
│   └── README.md           # Frontend-specific README
│
├── tests/                  # Contract tests (TypeScript)
└── README.md              # This file
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **Rust** (latest stable version)
- **Solana CLI** (v1.18 or higher)
- **npm** or **yarn**

### Contract Setup

1. **Navigate to contract directory**:
   ```bash
   cd contract
   ```

2. **Build the contract**:
   ```bash
   cargo build-bpf
   ```

3. **Deploy to Solana Devnet** (optional):
   ```bash
   solana program deploy target/deploy/contract.so --program-id <PROGRAM_ID>
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
   NEXT_PUBLIC_SOLANA_CLUSTER=devnet
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   ```
   http://localhost:3000
   ```

### Production Build

```bash
cd frontend
npm run build
npm start
```

---

## 📚 Documentation

### Contract Architecture

The Charge2Earn program implements the following account types:

1. **ChargerAccount** (Account Type: 1)
   - Stores charger information (location, rates, pricing)
   - Owned by the charging operator
   - Created via `add_charger` instruction

2. **DriverAccount** (Account Type: 2)
   - Tracks driver's AMP point balance
   - Created on first charging session
   - Updated when sessions end

3. **SessionAccount** (Account Type: 3)
   - Records charging session details
   - Tracks start/end timestamps
   - Links charger and driver

4. **ListingAccount** (Account Type: 4)
   - Marketplace listing for AMP points
   - Contains seller, amount, and price
   - Created/updated via marketplace instructions

5. **UserAccount** (Account Type: 5)
   - User's AMP point balance (from purchases)
   - Separate from driver account
   - Used for marketplace transactions

### Program Instructions

1. **add_charger** (Instruction 0)
   - Register a new charging station
   - Fee: 0.5 SOL to admin
   - Creates ChargerAccount PDA

2. **start_session** (Instruction 1)
   - Begin a charging session
   - Creates SessionAccount and DriverAccount if needed
   - Records start timestamp

3. **stop_session** (Instruction 2)
   - End a charging session
   - Calculates and distributes AMP points
   - Updates driver balance

4. **create_listing** (Instruction 3)
   - List AMP points on marketplace
   - Transfers points from driver to listing
   - Sets price in lamports per point

5. **buy_from_listing** (Instruction 4)
   - Purchase points from marketplace
   - Transfers SOL to seller
   - Transfers points to buyer's user account

6. **cancel_listing** (Instruction 5)
   - Cancel an active listing
   - Returns points to driver account

### Frontend Architecture

- **Pages**: Next.js App Router with client components
- **State Management**: Zustand for global UI state
- **Wallet Integration**: Solana Wallet Adapter React
- **Styling**: Tailwind CSS with custom dark theme
- **Real-time Updates**: React hooks with interval updates

### Key Components

- `AccountBalances`: Displays driver and user AMP balances
- `Nav`: Navigation bar with wallet connection
- `AddChargerModal`: Modal for registering new chargers
- `Spinner`: Loading indicator component
- `Toaster`: Global notification system
- `WalletNotConnectedError`: Error component for wallet state

---

## 🔧 Usage

### For Charging Operators

1. **Connect Wallet**: Click "Connect Wallet" in the navigation
2. **Register Charger**: Click "Add Charger" button
3. **Fill Details**: Enter charger information (name, code, location, rates)
4. **Pay Fee**: Confirm 0.5 SOL registration transaction
5. **Verify**: Your charger appears in the chargers list

### For Drivers

1. **Connect Wallet**: Connect your Solana wallet
2. **Browse Chargers**: Navigate to "Chargers" page
3. **Select Charger**: Click "Charge Vehicle" on any charger
4. **Start Session**: Click "Start Charging" button
5. **Monitor Progress**: Watch real-time stats (time, AMP points, cost)
6. **End Session**: Click "End Charging" when done
7. **Earn Points**: AMP points automatically added to your driver account

### Marketplace Usage

1. **List Points**:
   - Go to Marketplace page
   - Click "List Points" (if you have AMP points)
   - Enter amount and price per point
   - Confirm transaction

2. **Buy Points**:
   - Browse available listings
   - Click "Buy Points" on any listing
   - Select amount using slider
   - Confirm purchase transaction

3. **Cancel Listing**:
   - Go to Marketplace page
   - Click "Cancel your Listing"
   - Points returned to your driver account

### Viewing Leaderboard

1. Navigate to "Driver's Leaderboard"
2. View top 50 drivers ranked by AMP balance
3. Your ranking highlighted if wallet is connected

---

## 🧪 Testing

### Contract Tests

```bash
cd tests
npm test
```

## 🔐 Security Considerations

- All transactions are on-chain and verifiable
- Users maintain full control of their wallets
- Smart contract uses PDAs for secure account derivation
- No central authority or admin control over user funds
- Registration fees go to designated admin account

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🗺️ Roadmap

- [ ] Advanced analytics dashboard
- [ ] Token staking features
- [ ] Mainnet deployment
- [ ] Governance mechanism
- [ ] IoT integration for real charging stations

---

<div align="center">

**Made with ⚡ by the Charge2Earn Team**

[Back to Top](#charge2earn-blockchain-powered-ev-charging-rewards-platform)

</div>

