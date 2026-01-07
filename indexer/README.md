# Example ERC721 token API

This example shows how to create a GraphQL API for an ERC721 token using Ponder. It uses the Smol Brains NFT contract on Arbitrum ([Link](https://arbiscan.io/address/0x6325439389E0797Ab35752B4F43a14C004f22A9c)).

## Running with Docker

### Environment Variables

Configure your RPC endpoints in `.env.local`:

```env
PONDER_RPC_URL_1=https://your-rpc-endpoint.com
PONDER_RPC_URL_1_WS=wss://your-ws-endpoint.com
DATABASE_URL=postgresql://ponder:ponder@localhost:5433/ponder
```

This file is automatically loaded by both Ponder (for local development) and Docker Compose (for production).

### Development

In development mode, only the PostgreSQL database runs in Docker. The indexer runs locally for hot-reloading and debugging.

```bash
# Start the database
docker compose --profile dev up -d

# Run the indexer locally
pnpm dev
```

The database is exposed on port `5433` to avoid conflicts with local PostgreSQL installations.

### Production

In production mode, both the database and indexer run in Docker. Environment variables are automatically loaded from `.env.local`.

```bash
# Build and start all services
docker compose --profile prod up -d --build

# View logs
docker compose --profile prod logs -f indexer
```

The GraphQL API will be available at `http://localhost:42069`.

### Stopping Services

```bash
# Stop dev services
docker compose --profile dev down

# Stop prod services
docker compose --profile prod down

# Stop and remove volumes (deletes all data)
docker compose --profile prod down -v
```

## Sample queries

### Get all tokens currently owned by an account

```graphql
{
  account(id: "0x2B8E4729672613D69e5006a97dD56A455389FB2b") {
    id
    tokens {
      id
    }
  }
}
```

### Get the current owner and all transfer events for a token

```graphql
{
  token(id: "7777") {
    owner {
      id
    }
    transferEvents {
      from
      to
      timestamp
    }
  }
}
```
