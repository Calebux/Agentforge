# No-Code Agent Launcher — CLAUDE.md

## Project Overview

You are helping build **No-Code Agent Launcher**, a hackathon submission for the
**"Build Agents for the Real World on Celo V2"** competition (March 2–18, 2026).

**Prize target:** Track 2 — Best Agent Infrastructure on Celo ($2,000 USD₮ first place)
**Submission deadline:** March 18, 2026
**Registration:** Karma Gap platform (https://gap.karmahq.xyz)

### What This App Does
A visual dashboard that lets anyone launch and manage AI agents on the Celo blockchain
without writing a single line of code. Users:
1. Connect their MetaMask wallet (Celo network)
2. Pick an agent template (payment bot, savings bot, social bot, etc.)
3. Configure their LLM backend (OpenAI, Anthropic, local Ollama)
4. Write a system prompt in plain English
5. Set a spending limit in USDT
6. Click **Deploy** → the platform spins up an OpenClaw agent and registers it on-chain via ERC-8004
7. Monitor agent activity, spending, and reputation from a live dashboard

### Why This Wins
- Directly lowers the barrier to entry for the Celo agent ecosystem
- Uses OpenClaw as the agent runtime (already in the Celo builder toolkit)
- ERC-8004 gives every deployed agent an on-chain identity from day one
- Targets non-technical users — huge untapped market for agent adoption

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Wallet connection | wagmi v2 + RainbowKit |
| Blockchain queries | viem |
| Server state | @tanstack/react-query |
| Agent runtime | OpenClaw (CLI-based, Node.js) |
| LLM backend | OpenAI API (primary), Anthropic optional |
| On-chain identity | ERC-8004 on Celo Alfajores testnet |
| Payments standard | x402 (via Thirdweb) |
| Database | SQLite via better-sqlite3 (local agent registry) |
| Package manager | npm |

---

## Repository Structure

```
no-code-agent-launcher/
├── CLAUDE.md                  ← You are here
├── README.md
├── .env.local                 ← Never commit this
├── .env.example               ← Commit this (no real secrets)
├── next.config.ts
├── tailwind.config.ts
├── package.json
├── tsconfig.json
│
├── app/                       ← Next.js App Router
│   ├── layout.tsx             ← Root layout with providers
│   ├── page.tsx               ← Landing / home page
│   ├── providers.tsx          ← wagmi + RainbowKit + React Query providers
│   │
│   ├── dashboard/
│   │   └── page.tsx           ← Main dashboard (list of deployed agents)
│   │
│   ├── launch/
│   │   └── page.tsx           ← Multi-step agent launcher wizard
│   │
│   ├── agent/
│   │   └── [agentId]/
│   │       └── page.tsx       ← Individual agent monitoring page
│   │
│   └── api/
│       ├── agents/
│       │   ├── route.ts       ← GET all agents, POST deploy new agent
│       │   └── [agentId]/
│       │       └── route.ts   ← GET, PATCH, DELETE single agent
│       ├── deploy/
│       │   └── route.ts       ← Triggers OpenClaw agent deployment
│       ├── logs/
│       │   └── [agentId]/
│       │       └── route.ts   ← Streams agent logs
│       └── health/
│           └── route.ts       ← OpenClaw gateway health check
│
├── components/
│   ├── ui/                    ← Reusable primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── Modal.tsx
│   │   └── Spinner.tsx
│   │
│   ├── layout/
│   │   ├── Navbar.tsx         ← Top nav with wallet connect button
│   │   └── Sidebar.tsx        ← Dashboard sidebar navigation
│   │
│   ├── wallet/
│   │   └── ConnectButton.tsx  ← Custom RainbowKit connect button
│   │
│   ├── templates/
│   │   ├── TemplateCard.tsx   ← Individual template display card
│   │   └── TemplateGallery.tsx ← Grid of all available templates
│   │
│   ├── launcher/
│   │   ├── StepIndicator.tsx  ← Shows current wizard step (1/2/3/4)
│   │   ├── Step1Template.tsx  ← Template selection step
│   │   ├── Step2Configure.tsx ← LLM key + system prompt step
│   │   ├── Step3Limits.tsx    ← Spending limits + guardrails step
│   │   └── Step4Deploy.tsx    ← Deploy confirmation + progress step
│   │
│   └── dashboard/
│       ├── AgentCard.tsx      ← Card showing agent status in dashboard
│       ├── AgentList.tsx      ← List of all user's agents
│       ├── ActivityFeed.tsx   ← Live log feed for an agent
│       └── SpendingChart.tsx  ← USDT spending over time chart
│
├── lib/
│   ├── openclaw.ts            ← OpenClaw CLI wrapper functions
│   ├── erc8004.ts             ← ERC-8004 contract interaction helpers
│   ├── db.ts                  ← SQLite database setup and queries
│   ├── templates.ts           ← Agent template definitions
│   └── celo.ts                ← Celo network config for wagmi
│
└── types/
    ├── agent.ts               ← Agent type definitions
    └── template.ts            ← Template type definitions
```

---

## Environment Variables

Create `.env.local` with these variables. Never commit this file.

```bash
# OpenClaw
OPENCLAW_STATE_DIR=~/.openclaw          # Path to openclaw config dir
OPENCLAW_BIN=node /path/to/openclaw/dist/index.js   # Full path to openclaw binary

# Celo Network
NEXT_PUBLIC_CELO_RPC=https://alfajores-forno.celo-testnet.org
NEXT_PUBLIC_CHAIN_ID=44787              # Alfajores testnet (use 42220 for mainnet)

# ERC-8004 Contract (deploy your own or use existing on Alfajores)
NEXT_PUBLIC_ERC8004_CONTRACT_ADDRESS=0x...

# WalletConnect (get from cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Create `.env.example` with the same keys but empty values — commit this to git.

---

## Agent Templates

Define these templates in `lib/templates.ts`. Each template is a preset configuration:

```typescript
export type AgentTemplate = {
  id: string
  name: string
  description: string
  icon: string                // emoji or icon name
  category: 'payments' | 'savings' | 'social' | 'trading' | 'custom'
  defaultSystemPrompt: string
  defaultSpendingLimit: number  // in USDT
  requiredChannels: string[]    // e.g. ['telegram', 'whatsapp']
  tags: string[]
}
```

**Templates to implement (start with these 5):**

1. **Payment Bot** — Sends and receives USDT payments on command via WhatsApp/Telegram
2. **Savings Agent** — Monitors income, auto-saves a percentage to a Celo wallet
3. **Price Alert Bot** — Watches token prices and notifies when thresholds are hit
4. **Social Bot** — Posts updates and responds to messages on Telegram/Discord
5. **Custom Agent** — Blank canvas with empty system prompt for power users

---

## Core Features to Build (Priority Order)

### 1. Wallet Connection (Day 1)
- Use RainbowKit with Celo Alfajores testnet configured
- Show connected address + balance in Navbar
- Gate all launcher functionality behind wallet connection
- Store connected address as the agent owner

### 2. Template Gallery (Day 1-2)
- Responsive grid of TemplateCards
- Each card shows: icon, name, description, category badge, tags
- Clicking a card starts the launcher wizard with that template pre-selected
- Filter by category (All / Payments / Savings / Social / Trading)

### 3. Multi-Step Launcher Wizard (Day 2-3)
**Step 1 — Choose Template**
- Template gallery embedded in wizard
- Show template details panel when hovered/selected

**Step 2 — Configure**
- LLM provider selector (OpenAI / Anthropic / Ollama)
- API key input (masked, stored only in browser session — never sent to server as plaintext)
- Model selector (gpt-4o, gpt-4o-mini, claude-sonnet-4-6, etc.)
- System prompt textarea (pre-filled from template, fully editable)
- Agent name input

**Step 3 — Set Limits**
- Monthly spending limit (USDT) — slider + manual input
- Max spend per transaction (USDT)
- Allowed action toggles (send payments / browse web / read messages / post messages)
- Guardrails: require approval for transactions above X USDT

**Step 4 — Deploy**
- Summary of all configuration
- "Deploy Agent" button
- Progress states: Registering ERC-8004 identity → Starting OpenClaw daemon → Configuring LLM → Agent live
- Show agent ID and dashboard link on success

### 4. Deploy API Route (Day 3-4)
The `/api/deploy` route does the following in sequence:

```
1. Validate request (wallet address, template, config)
2. Generate a unique agentId
3. Write OpenClaw config file to ~/.openclaw/agents/{agentId}.json
4. Run: openclaw agent start --config {agentId}
5. Register agent on ERC-8004 contract (wallet signs tx on frontend)
6. Save agent record to local SQLite DB
7. Return { agentId, status: 'running', dashboardUrl }
```

### 5. Agent Dashboard (Day 4-5)
- List of all agents owned by connected wallet
- Each agent shows: name, template, status (running/stopped/error), uptime, spend this month
- Click agent → individual monitoring page
- Stop / Restart / Delete agent actions

### 6. Agent Monitoring Page (Day 5-6)
- Real-time activity feed (poll `/api/logs/{agentId}` every 3 seconds)
- Spending chart (daily USDT spend over last 7 days)
- Agent config summary (read-only)
- ERC-8004 reputation score (fetched from contract)
- Agent wallet address + balance

---

## OpenClaw Integration (`lib/openclaw.ts`)

OpenClaw is controlled via CLI. Wrap all CLI calls in async functions:

```typescript
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const OPENCLAW_BIN = process.env.OPENCLAW_BIN!

export async function startAgent(agentId: string, configPath: string) {
  const { stdout, stderr } = await execAsync(
    `${OPENCLAW_BIN} agent --agent ${agentId} --config ${configPath}`
  )
  return { stdout, stderr }
}

export async function getGatewayHealth() {
  const { stdout } = await execAsync(`${OPENCLAW_BIN} health`)
  return JSON.parse(stdout)
}

export async function getAgentLogs(agentId: string, lines = 50) {
  const { stdout } = await execAsync(
    `${OPENCLAW_BIN} logs --agent ${agentId} --lines ${lines}`
  )
  return stdout
}

export async function stopAgent(agentId: string) {
  await execAsync(`${OPENCLAW_BIN} agents stop ${agentId}`)
}
```

---

## ERC-8004 Integration (`lib/erc8004.ts`)

ERC-8004 is the agent wallet standard on Celo. Each deployed agent gets:
- An on-chain identity (address)
- A reputation score
- A capability registry

```typescript
import { createPublicClient, createWalletClient, http } from 'viem'
import { celoAlfajores } from 'viem/chains'

// Minimal ABI for ERC-8004 registration
export const ERC8004_ABI = [
  {
    name: 'registerAgent',
    type: 'function',
    inputs: [
      { name: 'agentId', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'metadata', type: 'string' },  // JSON string
    ],
    outputs: [{ name: 'agentAddress', type: 'address' }],
  },
  {
    name: 'getReputation',
    type: 'function',
    inputs: [{ name: 'agentAddress', type: 'address' }],
    outputs: [{ name: 'score', type: 'uint256' }],
  },
] as const

export async function registerAgentOnChain(
  agentId: string,
  ownerAddress: string,
  metadata: object
) {
  // This is called from the frontend after wallet signs
  // Returns the agent's on-chain address
}
```

---

## Database Schema (`lib/db.ts`)

Use SQLite for local agent registry:

```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,              -- agentId (uuid)
  owner_address TEXT NOT NULL,      -- Celo wallet address
  name TEXT NOT NULL,
  template_id TEXT NOT NULL,
  llm_provider TEXT NOT NULL,       -- 'openai' | 'anthropic' | 'ollama'
  llm_model TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  spending_limit_monthly REAL,      -- USDT
  spending_limit_per_tx REAL,       -- USDT
  onchain_address TEXT,             -- ERC-8004 registered address
  status TEXT DEFAULT 'pending',    -- 'pending'|'running'|'stopped'|'error'
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE agent_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  event_type TEXT NOT NULL,         -- 'message'|'payment'|'error'|'start'|'stop'
  payload TEXT,                     -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);
```

---

## UI Design Guidelines

- **Color palette:** Use Celo brand colors — primary green `#35D07F`, dark `#1E002B`, gold `#FBCC5C`
- **Style:** Clean, modern, minimal. Think Vercel dashboard meets crypto wallet
- **Font:** Inter (already in Next.js by default)
- **Dark mode:** Default to dark theme (common in crypto apps)
- **Mobile-first:** Must look good on mobile (Celo is mobile-first)
- **Loading states:** Every button that triggers an async action must show a spinner
- **Error handling:** Show clear, human-readable error messages — not raw JS errors
- **Empty states:** Design empty states for dashboard (no agents yet) and activity feed

---

## Development Workflow

### On This PC (UI development — no OpenClaw needed)
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# The OpenClaw integration will fail gracefully — mock it in development
# Set NEXT_PUBLIC_MOCK_OPENCLAW=true in .env.local to use mock data
```

### On the OpenClaw PC (integration testing)
```bash
# Pull latest code (from GitHub or transfer zip)
git pull  # or unzip the folder

# Install dependencies
npm install

# Set up .env.local with real OPENCLAW_BIN path
cp .env.example .env.local
# Edit .env.local with the correct OPENCLAW_BIN path

# Run dev server
npm run dev

# Test the full deploy flow with real OpenClaw
```

### Transferring Between PCs
**Option A (recommended): GitHub**
```bash
# On this PC
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourusername/no-code-agent-launcher.git
git push -u origin main

# On OpenClaw PC
git clone https://github.com/yourusername/no-code-agent-launcher.git
```

**Option B: Zip file**
```bash
# On this PC — zip the project (excluding node_modules)
zip -r no-code-agent-launcher.zip . -x "node_modules/*" -x ".next/*"
# Transfer the zip via USB, AirDrop, Google Drive, etc.

# On OpenClaw PC
unzip no-code-agent-launcher.zip
npm install
```

---

## Mock Mode (for development without OpenClaw)

Add this check in `lib/openclaw.ts`:

```typescript
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_OPENCLAW === 'true'

export async function startAgent(agentId: string, configPath: string) {
  if (MOCK_MODE) {
    // Simulate a 2-second deploy
    await new Promise(resolve => setTimeout(resolve, 2000))
    return { stdout: `Agent ${agentId} started (mock)`, stderr: '' }
  }
  // Real implementation here
}
```

This lets you build and test the entire UI flow on this PC without needing OpenClaw installed.

---

## Hackathon Submission Checklist

- [ ] Register project on Karma Gap: https://gap.karmahq.xyz
- [ ] Get your ERC-8004 agentId
- [ ] Complete SelfClaw verification
- [ ] Post on X tagging @Celo + @CeloDevs + @CeloPublicGoods
- [ ] Record a short demo video (2-3 mins) showing the full flow
- [ ] Deploy to Vercel (for the frontend) — `vercel --prod`
- [ ] Ensure at least one agent is live on Agentscan for Track 3

---

## Key Commands Reference

```bash
# Development
npm run dev              # Start dev server on localhost:3000
npm run build            # Production build
npm run lint             # ESLint check

# OpenClaw (on OpenClaw PC)
openclaw health          # Check gateway is running
openclaw models --help   # List/configure LLM models
openclaw agents list     # List all running agents
openclaw doctor          # Health check + fixes

# Git
git add .
git commit -m "your message"
git push origin main
```

---

## Important Notes for Claude

- **Always use the App Router** (`app/` directory), not the Pages Router
- **Never store API keys server-side in plaintext** — encrypt or use session storage
- **All blockchain reads** use viem's `publicClient`, writes use `walletClient` from wagmi
- **OpenClaw CLI calls** must only happen in API routes (server-side), never in client components
- **Keep components small** — if a component exceeds ~150 lines, split it
- **TypeScript strict mode is on** — no `any` types without a comment explaining why
- **Tailwind only** — no custom CSS files unless absolutely necessary
- **This is a hackathon** — ship working features over perfect code, but keep it demo-ready
- **Test the full deploy flow** on the OpenClaw PC before submission day
