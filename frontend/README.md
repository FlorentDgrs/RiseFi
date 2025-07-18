# RiseFi Frontend

Modern React/Next.js frontend for the RiseFi DeFi yield vault platform, featuring real-time APY display and seamless wallet integration.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run checks (TypeScript + Lint + Build)
npm run check
```

## 🎨 Features

- **Real-time APY Display** — Live yield rates from Morpho API
- **Wallet Integration** — RainbowKit with MetaMask support
- **Transaction Management** — Toast notifications and loading states
- **Admin Dashboard** — Contract management for vault owner
- **Responsive Design** — Mobile-first with Tailwind CSS
- **Type Safety** — Full TypeScript support

## 📊 Real-time APY Display

The `VaultApyDisplay` component shows real-time yield rates from the Morpho vault by querying the public GraphQL API.

### How it works

- **No API key required** — Morpho API is public
- Queries GraphQL endpoint: `https://api.morpho.org/graphql`
- Fetches vault list, filters by target address, displays `netApy` (or `apy` if unavailable)
- Rate refreshes automatically every 60 seconds

### Example GraphQL Query

```graphql
query {
  vaults(first: 100) {
    items {
      address
      state {
        netApy
        apy
        rewards {
          supplyApr
        }
      }
    }
  }
}
```

### Integration Example

```tsx
import VaultApyDisplay from "@/components/VaultApyDisplay";

export default function Home() {
  return (
    <main>
      <VaultApyDisplay />
    </main>
  );
}
```

### Changing the Target Vault

Modify the `VAULT_ADDRESS` constant in `components/VaultApyDisplay.tsx`:

```ts
const VAULT_ADDRESS = "0x...".toLowerCase();
```

### Available Fields

- `netApy` — Net annualized yield (recommended)
- `apy` — Gross annualized yield
- `rewards.supplyApr` — Rewards APR (if applicable)

## 🏗️ Architecture

```
frontend/
├── app/
│   ├── dashboard/             # Main dashboard page
│   └── admin/                 # Admin dashboard
├── components/
│   ├── shared/                # Reusable components
│   │   ├── ActionCard.tsx     # Deposit/Withdraw interface
│   │   ├── VaultApyDisplay.tsx # Real-time APY display
│   │   └── AdminDashboard.tsx # Admin controls
│   └── ui/                    # UI components
├── utils/
│   └── contracts.ts           # Contract utilities
└── types/                     # TypeScript definitions
```

## 🔧 Configuration

- **Network**: Base network (Chain ID: 8453)
- **Wallet**: RainbowKit with MetaMask support
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks with Wagmi
- **Build Tool**: Next.js 14 with App Router

## 📱 Pages

- **Dashboard** (`/dashboard`) — Main user interface for deposits/withdrawals
- **Admin** (`/admin`) — Contract management for vault owner
- **Home** (`/`) — Landing page with project information

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

## 📦 Dependencies

- **Next.js 14** — React framework
- **Tailwind CSS** — Utility-first CSS
- **Wagmi** — React hooks for Ethereum
- **RainbowKit** — Wallet connection library
- **TypeScript** — Type safety
