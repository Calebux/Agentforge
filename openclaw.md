# AgentForge — OpenClaw Integration Guide

The OpenClaw integration is already fully wired up in the codebase.
All you need to do is point the app at a real OpenClaw binary and turn off mock mode.

---

## What's already built

| File | Purpose |
|---|---|
| `lib/openclaw.ts` | Wraps all CLI calls (`startAgent`, `stopAgent`, `getAgentLogs`, `writeAgentConfig`) |
| `app/api/deploy/route.ts` | Writes OpenClaw config file, starts agent, saves to DB |
| `app/api/logs/[agentId]/route.ts` | Streams live logs from OpenClaw |
| `app/api/health/route.ts` | Checks OpenClaw gateway health |

When `NEXT_PUBLIC_MOCK_OPENCLAW=true` (current dev default), all of these return fake data so you can build and test the UI without OpenClaw installed. Flip it to `false` and they call the real CLI.

---

## Integration Steps (OpenClaw PC)

### Step 1 — Transfer the project

**Option A: GitHub (recommended)**
```bash
# On this PC
git push origin main

# On OpenClaw PC
git clone https://github.com/yourusername/no-code-agent-launcher.git
cd no-code-agent-launcher
npm install
```

**Option B: Zip file**
```bash
# On this PC
zip -r no-code-agent-launcher.zip . -x "node_modules/*" -x ".next/*"
# Transfer via USB / AirDrop / Google Drive

# On OpenClaw PC
unzip no-code-agent-launcher.zip
npm install
```

---

### Step 2 — Set up `.env.local` on the OpenClaw PC

Copy `.env.example` and fill in the real values:

```bash
cp .env.example .env.local
```

```bash
# OpenClaw — point to the real binary
OPENCLAW_BIN=node /path/to/openclaw/dist/index.js
OPENCLAW_STATE_DIR=~/.openclaw

# Turn off mock mode — this is the key switch
NEXT_PUBLIC_MOCK_OPENCLAW=false

# Celo mainnet
NEXT_PUBLIC_CELO_RPC=https://forno.celo.org
NEXT_PUBLIC_CHAIN_ID=42220

# ERC-8004 contract address (deploy or use existing on Alfajores)
NEXT_PUBLIC_ERC8004_CONTRACT_ADDRESS=0x...

# WalletConnect project ID (get free at https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### Step 3 — Verify OpenClaw is running

```bash
openclaw health
openclaw agents list
```

If `health` returns an error, run `openclaw doctor` to diagnose.

---

### Step 4 — Start the app

```bash
npm run dev
```

Open http://localhost:3000, connect your wallet, and deploy an agent.
The deploy flow will now write a real OpenClaw config to `~/.openclaw/agents/{agentId}.json`
and start the agent process via the CLI.

---

## How the deploy flow works (real mode)

```
User clicks "Deploy Agent"
  → POST /api/deploy
    → Validates request
    → Generates agentId (UUID)
    → Writes ~/.openclaw/agents/{agentId}.json
    → Runs: openclaw agent --agent {agentId} --config {configPath}
    → Marks agent as "running" in local SQLite DB
    → Returns { agentId, dashboardUrl }
  → Frontend polls /api/logs/{agentId} every 3s for live activity
```

---

## Getting Your Agent on Agentscan

[Agentscan](https://agentscan.io) indexes OpenClaw agents running on Celo. Once your agent is live on the OpenClaw PC, it should appear automatically if the OpenClaw gateway is publicly reachable.

To ensure visibility:
1. Make sure `openclaw health` returns `ok` on the OpenClaw PC
2. Your agent should show up at **https://agentscan.io** after a few minutes
3. The app already shows an "Agentscan" link on each agent's monitoring page and on the deploy success screen

If your agent doesn't appear automatically, check the OpenClaw docs or Discord for manual registration steps.

---

## Timing

Do the integration test **a few days before the March 18 deadline** — not on deadline day.

Recommended order:
1. Finish UI on this PC (you're close)
2. Push to GitHub
3. Pull on OpenClaw PC, set `.env.local`, run `openclaw health`
4. Do one full deploy test: connect wallet → pick template → deploy → check dashboard
5. Fix any CLI flag mismatches (openclaw command syntax may differ slightly)
6. Record demo video on the OpenClaw PC so the agent is actually running
