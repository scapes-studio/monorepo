# Scapes Studio

Monorepo for the [Scapes](https://scapes.xyz) ecosystem — an onchain indexer and website tracking [PunkScapes](https://punkscapes.com), Scapes, and TwentySevenYearScapes NFT collections.

## Architecture

- **`indexer/`** — [Ponder](https://ponder.sh) indexer with Hono API, Drizzle ORM, and PostgreSQL.
- **`website/`** — [Nuxt 4](https://nuxt.com) (Vue 3) frontend.
- **`abis/`** — Shared contract ABIs.

## Prerequisites

- Node.js >= 18.14
- [pnpm](https://pnpm.io)
- Docker (for the dev database)

## Setup

```sh
pnpm install
```

### Environment variables

Copy the example env files and fill in your values:

```sh
# Indexer — needs at minimum an Ethereum RPC URL and database connection
cp indexer/.env.local.example indexer/.env.local

# Website
cp website/.env.example website/.env
```

Required indexer variables:
- `PONDER_RPC_URL_1` — Ethereum RPC endpoint
- `DATABASE_URL` — PostgreSQL connection string (default: `postgresql://ponder:ponder@localhost:5433/ponder`)

### Database

Start a local PostgreSQL instance:

```sh
docker compose -f indexer/docker-compose.yml up -d
```

## Development

```sh
# Run the indexer (hot reload)
pnpm dev

# Run the website (port 3311)
pnpm --filter @scapes-studio/website dev
```

### API endpoints

- `GET/POST /graphql` — GraphQL API
- `GET /sql/*` — SQL over HTTP
- `GET /profiles/:address` — ENS profile
- `GET /seaport/sales/:slug` — Sales by collection
- `GET /seaport/stats/volume/:slug` — Volume stats
- `GET /scapes/:tokenId/history` — Transfer history with sales

## Verification

```sh
# Typecheck all packages
pnpm typecheck

# Lint the indexer
pnpm --filter @scapes-studio/indexer lint
```

## Deployment

Both packages deploy via [Kamal](https://kamal-deploy.org). Deployment config lives in `indexer/config/deploy.yml` and `website/config/deploy.yml`, and reads infrastructure details from environment variables.

```sh
# Indexer
pnpm --filter @scapes-studio/indexer kamal:deploy

# Website
pnpm --filter @scapes-studio/website kamal:deploy
```

## License

[MIT](LICENSE)
