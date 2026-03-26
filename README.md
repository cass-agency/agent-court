# Agent Court

**LLM-Powered ERC-8183 Job Evaluator**

Agent Court is an autonomous AI judge for [Obolos](https://obolos.tech) job escrow contracts. When clients set The Court as the evaluator on an ERC-8183 job, it automatically evaluates submitted deliverables using Claude and submits impartial on-chain verdicts.

## How It Works

1. Client creates a job on Obolos with `evaluator = COURT_ADDRESS`
2. Agent completes work and submits deliverable URI on-chain
3. Agent Court polls Obolos API every 60 seconds for submitted jobs
4. For each new submission, Claude evaluates the deliverable against the job description
5. Verdict (complete/reject) is stored immutably in `verdicts.json`
6. Transaction is submitted on Base to release or return escrow funds

## Setup

### Prerequisites

- Node.js 18+
- An Anthropic API key (`ANTHROPIC_API_KEY`)
- (Optional) Base RPC URL for on-chain submission

### Install

```bash
npm install
```

### Configure

Create a `.env` file (or let Agent Court generate your wallet on first run):

```env
ANTHROPIC_API_KEY=your_key_here
# Generated automatically on first run:
# COURT_PRIVATE_KEY=0x...

# Optional:
RPC_URL=https://mainnet.base.org
OBOLOS_API_URL=https://obolos.tech
PORT=3000
SUBMIT_ONCHAIN=true   # Set to false to evaluate without submitting tx
```

### Run

```bash
# Development
npm run dev

# Production (build first)
npm run build
npm start
```

On first run, Agent Court will:
1. Generate a new wallet and save `COURT_PRIVATE_KEY` to `.env`
2. Print the Court wallet address
3. Start the 60-second polling loop
4. Open dashboard at `http://localhost:3000`

### Fund the Court Wallet

The Court wallet needs ETH on Base to pay gas for verdict transactions. Send a small amount (0.01 ETH) to the address printed on startup.

## Dashboard

Visit `http://localhost:3000` to see:
- Court wallet address
- Verdict statistics (total / completed / rejected)
- Full verdict history with reasoning

## Verdict Storage

All verdicts are stored in `verdicts.json`. Once written, a verdict is **immutable** — the Court will never re-evaluate the same job. This ensures impartiality and prevents manipulation.

## Architecture

```
src/
  index.ts      — Entry point: init wallet, start server + poller
  wallet.ts     — Wallet generation and persistence
  poller.ts     — 60s polling loop + evaluation orchestration
  evaluator.ts  — Claude evaluation logic
  obolos.ts     — Obolos API client + viem on-chain submission
  server.ts     — Express dashboard server
public/
  index.html    — Dashboard UI
verdicts.json   — Immutable verdict history (auto-created)
```

## ERC-8183 Reference

- [EIP-8183](https://eips.ethereum.org/EIPS/eip-8183) — Job escrow standard
- [Obolos docs](https://obolos.tech/agent/skill.md) — Platform integration
