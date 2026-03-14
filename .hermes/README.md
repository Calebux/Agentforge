# SubBot — AI Subscription Manager

A Telegram bot built on the [Hermes Agent](https://github.com/NousResearch/hermes-agent) framework that tracks, audits, and optimizes your AI and SaaS subscriptions.

Built for the Nous Research Hermes Hackathon.

## What it does

- **Gmail scan** — connects via IMAP to auto-detect subscriptions from billing emails
- **Full audit** — finds overlaps, forgotten services, calculates total spend with multi-currency support (USD, NGN, GBP, EUR, etc.)
- **Renewal alerts** — Telegram warnings 3 days before any subscription charges
- **Negotiate discounts** — drafts retention emails to get 20–50% off before cancelling
- **CSV export** — full report sent directly to Telegram
- **Budget tracking** — set a monthly limit and track against it

## Setup

### 1. Install Hermes Agent

```bash
pip install hermes-agent
hermes setup
```

### 2. Configure

Add to `~/.hermes/.env`:

```env
TELEGRAM_BOT_TOKEN=your_bot_token
OPENAI_API_KEY=your_nous_api_key
OPENAI_BASE_URL=https://inference-api.nousresearch.com/v1
GATEWAY_ALLOW_ALL_USERS=true
```

Add to `~/.hermes/config.yaml` under `agent`:
```yaml
agent:
  system_prompt: <contents of SOUL.md>
```

Set AI peer name (makes the bot identify as SubBot):
```bash
mkdir -p ~/.honcho
echo '{"aiPeer": "SubBot", "enabled": false}' > ~/.honcho/config.json
```

### 3. Copy project files

```bash
cp *.py *.sh *.md ~/.hermes/
```

### 4. Start the gateway

```bash
hermes gateway run
```

Or use the included `gateway-start.sh` with launchd for persistent background operation.

## Demo flow

1. DM the bot on Telegram
2. It asks how you want to add subscriptions (Gmail scan / CSV / manual)
3. Run an audit to see total spend, overlaps, and renewal dates
4. Set a budget, get renewal alerts, export a CSV report

## Files

| File | Description |
|------|-------------|
| `SOUL.md` | Bot persona — defines SubBot's identity and behavior |
| `gmail-scanner.py` | IMAP scanner, multi-account, detects subscriptions from billing emails |
| `subscription-alerts.py` | Renewal alert daemon — runs daily, alerts 3 days before renewal |
| `export.py` | Generates and sends CSV report via Telegram |
| `currency.py` | Live FX rates (open.er-api.com) for multi-currency normalization |
| `gateway-start.sh` | Clean startup wrapper for launchd |

## Multi-currency support

Detects and normalizes NGN, GBP, EUR, CAD, and more to USD for unified spend reporting.

## Multi-user

Each Telegram user gets isolated data under `~/.hermes/user-data/{telegram_user_id}/`.
