# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scapes Studio is a Web3 monorepo that indexes Ethereum NFT contracts (ERC721) and provides a web interface for browsing token ownership, transaction history, and marketplace data. It tracks three collections: PunkScapes, Scapes, and TwentySevenYearScapes.

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Indexer**: Ponder (blockchain indexer) + Hono (API server) + Drizzle ORM + PostgreSQL
- **Website**: Nuxt 4 (Vue 3) with @ponder/client for data fetching
- **Web3**: Viem for Ethereum interactions
- **Deployment**: Docker + Kamal

## Styling

All styling must use CSS variables from the layer packages (`@1001-digital/layers.base`, `@1001-digital/layers.evm` in `~/dev/layers`). No custom hardcoded colors, spacing, or sizing values.

## Commands

### Root Level
```bash
pnpm dev           # Run indexer with hot reload
pnpm start         # Production: start indexer
pnpm typecheck     # Type-check all packages
```

### Indexer (`cd indexer`)
```bash
pnpm dev           # Ponder dev mode
pnpm typecheck     # TypeScript check
pnpm lint          # ESLint
pnpm codegen       # Generate types from schema

# Drizzle (offchain tables)
pnpm drizzle-kit generate   # Generate migration
pnpm drizzle-kit migrate    # Apply migrations
pnpm drizzle-kit push       # Push schema directly (dev)
pnpm drizzle-kit studio     # Browse data

# CLI for external data
pnpm cli import:sales --all   # Import historical sales
pnpm cli import:listings      # Import current listings

# Deployment
pnpm kamal:setup    # Initial setup
pnpm kamal:deploy   # Deploy
```

### Website (`cd website`)
```bash
pnpm dev           # Nuxt dev server (port 3311)
pnpm build         # Production build
pnpm typecheck     # Type checking
```

### Docker
```bash
docker compose --profile dev up -d    # Start PostgreSQL only
docker compose --profile prod up -d --build   # Full stack
```

## Architecture

```
/
├── indexer/       # Ponder blockchain indexer + Hono REST API
├── website/       # Nuxt 4 frontend
├── abis/          # Contract ABIs (ERC721, Marketplace)
└── api/           # Placeholder package
```

### Indexer Key Files
- `ponder.config.ts` - Contract addresses and chain config
- `ponder.schema.ts` - Onchain table definitions (Ponder auto-syncs these)
- `src/offchain.ts` - Offchain tables (managed via Drizzle migrations)
- `src/index.ts` - Event handlers (Transfer, Offer, Sale)
- `src/api/` - Hono routes (profiles, sales, stats, history)

### Data Model
**Onchain tables** (auto-synced from blockchain): account, scape, transfer_event, offer, sale, twentySevenYearScape, twentySevenYearTransferEvent

**Offchain tables** (written by CLI/services): seaport_sale, seaport_listing, sync_state, ens_profile

### Multi-Schema
Ponder creates indexed tables in `ponder` schema. Views in configurable schema (e.g., `scapes`) allow stable queries during deployments:
```bash
pnpm ponder start --views-schema=scapes
```

## Environment Variables

**Indexer** (`.env.local`):
```
PONDER_RPC_URL_1=https://...
PONDER_RPC_URL_1_WS=wss://...
DATABASE_URL=postgresql://...
PONDER_VIEWS_SCHEMA=scapes
```

**Website**:
```
NUXT_PUBLIC_API_URL=https://indexer.scapes.xyz
```

## API Endpoints

- `GET/POST /graphql` - GraphQL API
- `GET /sql/*` - SQL over HTTP
- `GET /profiles/:address` - ENS profile
- `GET /seaport/sales/:slug` - Sales by collection
- `GET /seaport/stats/volume/:slug` - Volume stats
- `GET /scapes/:tokenId/history` - Transfer history with sales
