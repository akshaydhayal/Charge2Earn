# Charge2Earn: Blockchain-Powered EV Charging Rewards Platform

---

## 🚀 Overview

**Charge2Earn** is a Solana-based decentralized application that revolutionizes electric vehicle charging by gamifying the experience through blockchain rewards. Drivers earn tradable **AMP points** for every second they charge, while operators register their charging stations on-chain, creating a transparent and incentivized ecosystem for sustainable transportation.

![Landing Page Screenshot - Hero Section]
*Add screenshot: Homepage with hero section, CTA buttons, and feature cards*

The platform bridges the gap between EV infrastructure and Web3, demonstrating how blockchain technology can create real economic incentives for eco-friendly behavior. All transactions are verifiable on-chain, and users maintain true ownership of their rewards.

---

## ✨ Key Features

### 1. On-Chain Charger Registration

Charging operators can register their stations permanently on the Solana blockchain by paying a 0.5 SOL registration fee. This creates immutable, verifiable records of charging infrastructure, ensuring transparency and trust across the network.

![Charger Registration Modal Screenshot]
*Add screenshot: Add Charger Modal with form fields (name, code, location, power, rates, price)*

Each registered charger includes detailed information such as location coordinates, power output, charging rates, and pricing—all stored securely on-chain using Program Derived Addresses (PDAs).

### 2. Real-Time Charging Sessions

Drivers connect their Solana wallet and select from available charging points. When a session begins, the platform tracks charging duration in real-time, updating every second with:

- **Elapsed Time**: Live counter showing session duration
- **AMP Points Earned**: Calculated based on charger's point rate per second
- **Total Cost**: Real-time SOL cost calculation

![Charging Session Page Screenshot]
*Add screenshot: Individual charger detail page with Start/End buttons and live stats panel*

The gamified interface provides instant visual feedback, making the charging experience engaging and rewarding. All session data is recorded on-chain for complete transparency.

### 3. AMP Points Marketplace

Earned AMP points can be instantly traded on the peer-to-peer marketplace. Drivers can list their points at custom prices, while buyers can purchase directly using SOL. The marketplace features:

- **Slider-based Amount Selection**: Easy quantity selection with price calculation
- **Real-Time Price Display**: Instant SOL conversion for any quantity
- **Secure Transactions**: All trades executed on-chain via smart contracts

![Marketplace Page Screenshot]
*Add screenshot: Marketplace page with listing cards showing available points, prices, and Buy Points buttons*

![Buy Points Modal Screenshot]
*Add screenshot: Buy Points Modal with slider, amount input, and total cost calculation*

This creates a secondary economy where drivers can monetize their eco-friendly behavior, further incentivizing sustainable transportation choices.

### 4. Competitive Leaderboard

The platform features a live leaderboard ranking all drivers by their AMP point balance. The leaderboard includes:

- **Top 50 Drivers**: Ranked by total AMP points earned
- **Profile Avatars**: Auto-generated identicons for each driver
- **Real-Time Rankings**: Updated automatically as points are earned

![Leaderboard Page Screenshot]
*Add screenshot: Leaderboard page with ranked drivers, avatars, AMP balances, and top 3 badges*

This gamification element adds a competitive aspect, encouraging more drivers to participate and charge sustainably.

---

## 🛠️ Technical Architecture

### Blockchain Layer

**Native Solana Program**: Built without Anchor framework, using Borsh serialization for fine-grained control over instruction encoding and account layouts.

**Program ID**: `9oMQzz6sMnnSZ9sDeb5pi8FEGR3uDsyuC` (Devnet)

**Account Structure**:
- **Charger Accounts**: Store operator info, location, rates, and pricing
- **Driver Accounts**: Track AMP balances for each driver
- **Session Accounts**: Record charging session history
- **Listing Accounts**: Manage marketplace offers
- **User Accounts**: Enable point trading for non-drivers

All accounts use Program Derived Addresses (PDAs) for secure, deterministic address generation.

### Frontend Application

**Next.js 15** with App Router architecture provides server-side rendering and optimized performance. The application features:

- **Wallet Adapter Integration**: Support for Phantom, Solflare, Coinbase, Brave, and Torus wallets
- **Real-Time Updates**: Live session tracking with second-by-second updates
- **Modern UI/UX**: Dark theme with glassmorphism effects and smooth animations
- **Transaction Notifications**: Toast notifications with Solana Explorer links

![Wallet Connection Screenshot]
*Add screenshot: Wallet adapter showing multiple wallet options (Phantom, Solflare, etc.)*

### Key Transactions

1. **Add Charger**: Operators register stations (0.5 SOL fee)
2. **Start Session**: Begin charging and start earning points
3. **Stop Session**: End charging, calculate rewards, transfer SOL to operator
4. **Create Listing**: List AMP points for sale
5. **Buy Listing**: Purchase points from marketplace
6. **Cancel Listing**: Remove listing from marketplace

All transactions are visible on Solana Explorer with instant confirmation and notifications.

![Transaction Notification Screenshot]
*Add screenshot: Toast notification showing "Charging session started" with Solana Explorer link*

---

## 🔄 How It Works

### For Charging Operators

1. **Register Charger**: Connect wallet and fill registration form
2. **Pay Fee**: Submit 0.5 SOL registration fee
3. **Get Listed**: Charger appears in public directory
4. **Earn Revenue**: Receive SOL payments from drivers using your charger

### For EV Drivers

1. **Connect Wallet**: Link Solana wallet (Phantom, Solflare, etc.)
2. **Browse Chargers**: View all available charging stations
3. **Select & Start**: Choose charger and begin charging session
4. **Earn Points**: Accumulate AMP points in real-time
5. **End Session**: Stop charging and receive points + transaction confirmation
6. **Trade Points**: List on marketplace or purchase from others

### For Point Traders

1. **Browse Marketplace**: View available AMP point listings
2. **Select Listing**: Choose amount and price
3. **Purchase**: Buy points directly with SOL
4. **Use Points**: Points are credited to your account instantly

---

## 💡 Use Cases

- **EV Fleet Operators**: Incentivize drivers with blockchain rewards
- **Charging Networks**: Transparent, on-chain station registration
- **Sustainable Commuters**: Earn rewards for eco-friendly transportation
- **DeFi Enthusiasts**: Trade renewable energy credits as digital assets
- **Urban Planners**: Track EV adoption through on-chain data

---

## 🎯 Impact & Vision

Charge2Earn demonstrates how blockchain technology can create tangible incentives for sustainable behavior. By gamifying EV charging and creating a tradable rewards system, the platform encourages broader adoption of electric vehicles while building a transparent, decentralized infrastructure.

The combination of real-time tracking, peer-to-peer trading, and competitive elements creates a compelling user experience that makes sustainable choices more rewarding—both economically and socially.

![Platform Overview Screenshot]
*Add screenshot: Multi-panel view showing all major pages (Home, Chargers, Marketplace, Leaderboard) in one view*

---

## 🔗 Links & Resources

- **Program ID**: `9oMQzz6sMnnSZ9sDeb5pi8FEGR3uDsyuC`
- **Network**: Solana Devnet
- **Frontend**: Next.js 15 with TypeScript
- **Blockchain**: Native Solana Program (Borsh)

---

*Built with ❤️ on Solana Blockchain*

---

## 📸 Image Placeholders Reference

Use these placeholder descriptions when adding screenshots:

1. **Landing Page**: Hero section with title, subtitle, CTA buttons, and feature cards
2. **Charger Registration**: Add Charger Modal with all form fields
3. **Chargers List**: Grid of available charging stations
4. **Charging Session**: Individual charger page with Start/End buttons and live stats
5. **Marketplace**: Listing cards with Buy Points buttons
6. **Buy Modal**: Slider-based purchase interface with price calculation
7. **Leaderboard**: Ranked drivers with avatars and AMP balances
8. **Wallet Connection**: Wallet adapter modal with multiple options
9. **Transaction Notifications**: Toast notifications with Explorer links
10. **Platform Overview**: Multi-panel view of all pages

