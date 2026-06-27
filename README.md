# SeedChain: Decentralized Startup Investment Syndicate

SeedChain is a production-grade, decentralized crowdfunding and startup investment platform built on the Stellar network using Soroban smart contracts. It enables startup founders to raise capital from global investor syndicates securely on-chain, using **milestone-based escrows**. Pledged funds are locked and only released incrementally after investor approval through decentralized governance voting.

---

## 📌 Table of Contents

* [1. Product Overview & Problem Statement](#-1-product-overview--problem-statement)
  * [The Problem](#the-problem)
  * [The SeedChain Solution](#the-seedchain-solution)
* [2. Technical Stack](#-2-technical-stack)
* [3. Directory Structure](#-3-directory-structure)
* [4. Technical Architecture & Component Flow](#-4-technical-architecture--component-flow)
  * [Inter-Contract Communication Flow](#inter-contract-communication-flow)
* [5. Smart Contract Design](#-5-smart-contract-design)
  * [Data Storage & TTL Preservation](#data-storage--ttl-preservation)
  * [Access Control](#access-control)
* [6. Local Development & Testing](#-6-local-development--testing)
  * [Prerequisites](#prerequisites)
  * [Compilation & Testing](#compilation--testing)
  * [Frontend Development](#frontend-development)
* [7. Stellar Testnet Deployment Guide](#-7-stellar-testnet-deployment-guide)
  * [Step 1: Configure Deployer Identity](#step-1-configure-deployer-identity)
  * [Step 2: Compile WASM Bytecodes](#step-2-compile-wasm-bytecodes)
  * [Step 3: Install Bytecodes to Testnet](#step-3-install-bytecodes-to-testnet)
  * [Step 4: Deploy the Syndicate Registry](#step-4-deploy-the-syndicate-registry)
  * [Step 5: Initialize the Syndicate Registry](#step-5-initialize-the-syndicate-registry)
  * [Step 6: Configure Frontend](#step-6-configure-frontend)
* [8. Syndicate Configuration Log & Verification](#-8-syndicate-configuration-log--verification)
  * [On-Chain Contract Verification Links](#on-chain-contract-verification-links)
* [9. Security Considerations](#-9-security-considerations)
* [10. Transaction Screenshots](#-10-transaction-screenshots)

---

## 🔍 1. Product Overview & Problem Statement

### The Problem
Traditional startup crowdfunding platforms (and standard Web3 launchpads) suffer from a lack of accountability and trust:
1. **Front-Loaded Risk:** Founders receive 100% of raised capital immediately. If they default, mismanage funds, or abandon the project, investors lose everything.
2. **No Investor Recourse:** Investors have no governance control over how funds are spent after the raise finishes.
3. **High Fee Overhead:** Intermediaries charge massive listing and escrow fees to manage startup syndicates.

### The SeedChain Solution
SeedChain introduces **Milestone Crowd Escrows** via Soroban smart contracts:
* **Factory Architecture:** A central registry deploys isolated escrow contracts for each startup project.
* **Milestone-Gated Releases:** Funds are disbursed in waves (e.g., 30% on MVP, 40% on alpha launch, 30% on public release).
* **Syndicate Governance:** Founders request milestone payouts, and investors vote with weights proportional to their pledge size. Payouts require >50% approval.
* **On-Chain Refund Trigger:** If a founder defaults or fails to deliver, investors can vote to trigger a proportional refund of the remaining escrow.

---

## 🛠️ 2. Technical Stack

* **Smart Contracts:** Rust, Soroban SDK (v21.7.7)
* **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
* **State Management:** Zustand (wallet session persistence, transaction log logs)
* **Data Querying:** React Query (RPC state synchronization)
* **Wallet Connection:** StellarWalletsKit SDK (Freighter / Albedo)
* **Charts & Data Visuals:** Recharts

---

## 📂 3. Directory Structure

The project has been organized with a feature-based architecture separating smart contracts, deployment tools, and the Next.js frontend app:

```
SeedChain/
├── .cargo/
│   └── config.toml               # Cargo target linker overrides
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions CI/CD pipeline
├── contracts/
│   ├── campaign/
│   │   ├── src/
│   │   │   ├── lib.rs            # ProjectCampaign contract source
│   │   │   └── test.rs           # Campaign contract unit tests
│   │   └── Cargo.toml            # Campaign contract configuration
│   └── syndicate/
│       ├── src/
│       │   ├── lib.rs            # SyndicateRegistry contract source
│       │   └── test.rs           # Syndicate registry unit tests
│       └── Cargo.toml            # Syndicate contract configuration
├── frontend/
│   ├── src/
│   │   ├── __tests__/
│   │   │   └── frontend.test.tsx # Vitest frontend test suite
│   │   ├── app/
│   │   │   ├── activity/
│   │   │   │   └── page.tsx      # Real-time event activity feed
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx      # Recharts dashboard analytics
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx      # Campaign dashboard and investment panel
│   │   │   ├── settings/
│   │   │   │   └── page.tsx      # RPC and network configurations
│   │   │   ├── transactions/
│   │   │   │   └── page.tsx      # Transaction center and developer log console
│   │   │   ├── globals.css       # Tailwind CSS v4 styling configurations
│   │   │   ├── layout.tsx        # Next.js root layout loading google fonts
│   │   │   └── page.tsx          # Marketing landing page
│   │   ├── components/
│   │   │   └── Navbar.tsx        # StellarWalletsKit navigation and wallet connect
│   │   ├── services/
│   │   │   └── stellar.ts        # Soroban RPC client and transaction helper
│   │   ├── state/
│   │   │   ├── transactions.ts   # Zustand transaction center store
│   │   │   └── wallet.ts         # Zustand wallet and network store
│   │   └── contracts-metadata.json # Default mockup contract configurations
│   ├── package.json              # Next.js configurations
│   ├── vitest.config.ts          # Vitest configurations
│   └── vitest.setup.ts           # Vitest setup file loading jest-dom
├── scripts/
│   ├── deploy.ps1                # PowerShell Stellar testnet deployment automation
│   └── deploy.sh                 # Bash shell testnet deployment automation
├── .env.example                  # Environment configuration example
├── Cargo.toml                    # Root workspace Cargo configuration
└── README.md                     # Production README and user guide
```

---

## 📐 4. Technical Architecture & Component Flow

```mermaid
graph TD
    User[Founder/Investor] <--> Frontend[Next.js App / TS / Tailwind]
    Frontend <--> StellarWalletsKit[Stellar Wallets Kit SDK]
    StellarWalletsKit <--> RPC[Stellar RPC Network]
    
    subgraph Soroban Smart Contracts
        Registry[SyndicateRegistry Contract] -- Factory Deploys --> Campaign[ProjectCampaign Contract]
        Campaign -- Pledges & Payouts --> SAC[Stellar Asset Contract - Token]
    end
    
    RPC <--> Registry
    RPC <--> Campaign
```

### Inter-Contract Communication Flow

The platform relies on contract-to-contract calls. The `SyndicateRegistry` installs the `ProjectCampaign` WASM and dynamically instantiates campaigns deterministically based on salt, then initializes them:

```mermaid
sequenceDiagram
    autonumber
    actor Founder
    actor Investor
    participant Registry as SyndicateRegistry
    participant Campaign as ProjectCampaign
    participant SAC as Stellar Asset Contract

    Founder->>Registry: create_campaign(wasm_hash, salt, goal, deadline, milestones, token)
    Note over Registry: Deployer uses current contract + salt
    Registry->>Campaign: init(founder, goal, deadline, milestones, token)
    Registry-->>Founder: Return Campaign Address

    Investor->>Campaign: pledge(amount)
    Campaign->>SAC: transfer(investor, campaign_address, amount)
    Note over Campaign: Record pledge in persistent storage

    Note over Campaign: Campaign Met (goal hit by deadline)
    Founder->>Campaign: request_milestone_payout(milestone_id)
    Investor->>Campaign: vote_on_milestone(milestone_id, approve=true)
    Note over Campaign: Voting ends & >50% weight approves
    Founder->>Campaign: claim_milestone_payout(milestone_id)
    Campaign->>SAC: transfer(campaign_address, founder, payout_amount)
```

---

## 🔒 5. Smart Contract Design

The contracts are built in Rust using the official **Soroban Rust SDK**:

### Data Storage & TTL Preservation
To protect against State Archival fees on Stellar, we use a hybrid storage design:
1. **Instance Storage:** Small configuration items (admin address, WASM hash, campaign lists, platform fees) are stored in the contract instance. We call `env.storage().instance().extend_ttl(1000, 10000)` inside frequently accessed functions to ensure the contract instance does not expire.
2. **Persistent Storage:** Medium-term variables (investor pledges, milestone voting states) are stored in persistent storage. Each write/read invokes `env.storage().persistent().extend_ttl(key, 1000, 10000)` to preserve user state.

### Access Control
We enforce strict role-based authorization:
* `require_auth()` is called on user addresses (founders, investors) to verify signatures.
* Only the `Admin` of the `SyndicateRegistry` can set fees, register WASM, or execute contract upgrades.
* Only the `Founder` of a `ProjectCampaign` can request milestone disbursements.

---

## 💻 6. Local Development & Testing

### Prerequisites
* Node.js (v20+ recommended)
* Rust and Cargo (v1.81+)
* Target: `rustup target add wasm32-unknown-unknown`
* Target: `rustup target add wasm32v1-none`

### Compilation & Testing

1. **Clean Workspace:**
   ```bash
   cargo clean
   ```
2. **Build Smart Contracts:**
   ```bash
   cargo build --target wasm32-unknown-unknown --release
   ```
3. **Run Smart Contract Unit Tests:**
   ```bash
   cargo test
   ```

### Frontend Development

1. **Navigate to Frontend:**
   ```bash
   cd frontend
   ```
2. **Install Dependencies:**
   ```bash
   npm install --ignore-scripts --legacy-peer-deps
   ```
3. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the client dashboard.
4. **Run Frontend Tests:**
   ```bash
   npm run test
   ```

---

## 🚀 7. Stellar Testnet Deployment Guide

Follow these exact steps to compile and deploy the SeedChain syndicate to the **Stellar Testnet**:

### Step 1: Configure Deployer Identity
Generate a deployment identity inside the Stellar CLI and request test tokens from the friendbot:
```bash
# Generate key pair
stellar keys generate deployer --network testnet --fund

# Get public key address
stellar keys address deployer
```

### Step 2: Compile WASM Bytecodes
```bash
stellar contract build
```

### Step 3: Install Bytecodes to Testnet
Upload both WASM packages to the network. Take note of the resulting WASM hashes:
```bash
# Upload Campaign contract
stellar contract install --wasm ./target/wasm32v1-none/release/seedchain_campaign.wasm --source deployer --network testnet

# Upload Syndicate Registry contract
stellar contract install --wasm ./target/wasm32v1-none/release/seedchain_syndicate.wasm --source deployer --network testnet
```

### Step 4: Deploy the Syndicate Registry
Deploy the registry instance. Replace `<REGISTRY_WASM_HASH>` with the hash returned in the previous step:
```bash
stellar contract deploy --wasm-hash <REGISTRY_WASM_HASH> --source deployer --network testnet --salt "0000000000000000000000000000000000000000000000000000000000000001"
```
This returns the active **Registry Contract Address** (e.g., `CDRegistryAddress...`).

### Step 5: Initialize the Syndicate Registry
Initialize the registry by setting the administrator and setting the campaign WASM template hash:
```bash
# Initialize registry admin
stellar contract invoke --id <REGISTRY_CONTRACT_ADDRESS> --source deployer --network testnet -- init --admin <DEPLOYER_ADDRESS>

# Configure campaign WASM hash
stellar contract invoke --id <REGISTRY_CONTRACT_ADDRESS> --source deployer --network testnet -- set_campaign_wasm --wasm_hash <CAMPAIGN_WASM_HASH>
```

### Step 6: Configure Frontend
Create `frontend/src/contracts-metadata.json` and paste your deployed contract details:
```json
{
  "network": "testnet",
  "rpcUrl": "https://soroban-testnet.stellar.org",
  "registryAddress": "CDRegistryAddress...",
  "campaignWasmHash": "CAMPAIGN_WASM_HASH...",
  "deployerAddress": "GDeployerAddress...",
  "timestamp": "2026-06-27 12:00:00"
}
```

---

## 📋 8. Syndicate Configuration Log & Verification

Update this log after your testnet deployment:

| Contract Component | Stellar Testnet Address / Hash |
| --- | --- |
| **SyndicateRegistry Contract** | `CBNRSQKD43UXRUQWEZHC46HITIAVZPKIO6U4TH6TCFLSOKCGHUXABLVU` |
| **ProjectCampaign WASM Hash** | `6da2c33188a6ce9fa687b31f7b7e2a3b401624205abfd788eec29eeda20f13cf` |
| **USDC Testnet Token** | `Native / Test stablecoin compatibility` |
| **Platform Administrator** | `GBEDWS2NFV5DO4Z44VRT4BCEJIFCURWPQFCQFFJRNLDB7GIOX2Y7RSBX` |

### On-Chain Contract Verification Links
All registry setup steps were executed on-chain via the `charlie` key pair. You can verify these operations on the Stellar Explorer:
* **Contract Upload (SyndicateRegistry WASM):** [Tx 914bbb8e...](https://stellar.expert/explorer/testnet/tx/914bbb8e022f7524ece5283e3324a21cb4fa6d97d7dbb65f28f21c26f0e33038)
* **Contract Deployment (SyndicateRegistry Instance):** [Tx 7ef33b0c...](https://stellar.expert/explorer/testnet/tx/7ef33b0c7ecee99481f010ac76e6e6f1da196d964d14527c5e5040486d71538b)
* **Contract Call (Initialize Registry):** [Tx eaf01c6f...](https://stellar.expert/explorer/testnet/tx/eaf01c6f09b64a60d82f5ffa23e8b2aacb13234f7c42c07ea978254b4c739c7b)
* **Contract Call (Configure Campaign WASM Hash):** [Tx a1e5d5d8...](https://stellar.expert/explorer/testnet/tx/a1e5d5d8cc6ffb22fac77ae2f71f61575c13f0a1493aed174dafb3a61f97d103)

---

## 🛡️ 9. Security Considerations

1. **Reentrancy Protection:** All token transfers (`transfer()`) are placed at the end of execution blocks after internal state updates (pledges cleared, milestones marked paid) to prevent reentrancy exploits.
2. **Access Safeguards:** Sensitive operations (`claim_milestone_payout`, `request_milestone_payout`, `upgrade`) explicitly require administrative or target founder authorization.
3. **State Rent Prevention:** `extend_ttl` is integrated across all read/write paths in persistent and instance storage to prevent state expiration.

---

## 📸 10. Transaction Screenshots

Below are screenshots demonstrating successful XLM transactions on the Stellar Testnet:

<table width="100%">
  <tr>
    <td width="50%" align="center" valign="top">
      <h4>Transaction 1</h4>
      <img src="https://github.com/user-attachments/assets/56ba8e28-4ef4-49f2-8392-1c8f6833d668" alt="Stellar Testnet Transaction 1" style="max-width: 100%; border-radius: 6px; border: 1px solid #e1e4e8;" />
    </td>
    <td width="50%" align="center" valign="top">
      <h4>Transaction 2</h4>
      <img src="https://github.com/user-attachments/assets/d2974ba9-e44d-4571-af97-1a1be7ba7793" alt="Stellar Testnet Transaction 2" style="max-width: 100%; border-radius: 6px; border: 1px solid #e1e4e8;" />
    </td>
  </tr>
</table>
