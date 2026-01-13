# AGENTS.md

## Repository summary
- Scapes Studio Web3 monorepo (indexer + Nuxt frontend).
- Tracks PunkScapes, Scapes, and TwentySevenYearScapes collections.
- Package manager: pnpm workspaces. Node engine: >= 18.14.

## Tech stack
- Indexer: Ponder + Hono + Drizzle ORM + PostgreSQL.
- Website: Nuxt 4 (Vue 3) with @ponder/client.
- Web3: viem.
- Deployment: Docker + Kamal.

## Workspace layout
- `indexer/` Ponder event handlers, API, CLI, migrations.
- `website/` Nuxt 4 app.
- `abis/` contract ABIs.
- `api/` placeholder package.

## Key files
- `indexer/ponder.config.ts` — chain/contract config.
- `indexer/ponder.schema.ts` — onchain schema.
- `indexer/src/offchain.ts` — offchain tables.
- `indexer/src/index.ts` — event handlers.
- `indexer/src/api/` — Hono routes.
- `website/app/pages/` — Nuxt routes.
- `website/app/components/` — Vue components.

## Build / lint / typecheck / test commands
### Root
- `pnpm dev` — run indexer in dev (hot reload).
- `pnpm start` — run indexer in prod mode.
- `pnpm typecheck` — run TypeScript checks in all packages.

### Indexer (`indexer/`)
- `pnpm dev` — Ponder dev mode.
- `pnpm start` — Ponder production mode.
- `pnpm lint` — ESLint (ponder config) for all files.
- `pnpm typecheck` — `tsc` (strict, noUncheckedIndexedAccess).
- `pnpm codegen` — Ponder codegen.
- `pnpm serve` — Ponder API server.
- `pnpm cli import:sales --all` — import historical sales.
- `pnpm cli import:listings` — import current listings.
- `pnpm drizzle-kit generate` — generate migration from `src/offchain.ts`.
- `pnpm drizzle-kit migrate` — run migrations.
- `pnpm drizzle-kit push` — dev-only schema push (no migrations).
- `pnpm drizzle-kit studio` — inspect DB in browser.
- `pnpm kamal:setup` — initial deploy setup.
- `pnpm kamal:deploy` — deploy.

### Website (`website/`)
- `pnpm dev` — Nuxt dev server (port 3311).
- `pnpm build` — production build.
- `pnpm preview` — preview production build.
- `pnpm typecheck` — `nuxt typecheck`.
- `pnpm generate` — static generation.

### Docker (root)
- `docker compose --profile dev up -d` — start PostgreSQL only.
- `docker compose --profile prod up -d --build` — run full stack.

## Single-test guidance
- No unit/integration test runner is configured in this repo.
- Use `pnpm typecheck` or `pnpm lint` for verification.
- If you add tests, add a script documenting how to run one.

## Cursor/Copilot rules
- No `.cursor/rules`, `.cursorrules`, or `.github/copilot-instructions.md` found.

## Local development notes
- Dev DB runs on port `5433`.
- GraphQL API: `http://localhost:42069`.
- SQL-over-HTTP: `http://localhost:42069/sql`.
- `.env.local` is auto-loaded by Ponder and Docker Compose.
- Stable views: `pnpm ponder start --views-schema=scapes`.

## Data model
- Onchain tables: account, scape, transfer_event, offer, sale, twentySevenYearScape, twentySevenYearTransferEvent.
- Offchain tables: seaport_sale, seaport_listing, sync_state, ens_profile.

## API endpoints
- `GET/POST /graphql` — GraphQL API.
- `GET /sql/*` — SQL over HTTP.
- `GET /profiles/:address` — ENS profile.
- `GET /seaport/sales/:slug` — sales by collection.
- `GET /seaport/stats/volume/:slug` — volume stats.
- `GET /scapes/:tokenId/history` — transfer history with sales.

## Environment configuration
- Indexer uses `.env.local` (PONDER_RPC_URL_1, DATABASE_URL, `PONDER_VIEWS_SCHEMA`).
- Website uses `NUXT_PUBLIC_API_URL`.
- Never commit secrets or `.env` files.

## Code style (general)
- Follow local file conventions and keep changes minimal.
- Prefer `const` over `let`; use `let` only when reassigning.
- Use `async/await` instead of raw Promises.
- Prefer early returns and guard clauses for clarity.
- Avoid one-letter variable names (except short scopes like indices).

## TypeScript conventions
- Use `import type` or `import { type Foo }` for type-only imports.
- Keep types explicit when crossing package or API boundaries.
- Prefer `null` over `undefined` for database fields.
- Use literal address types where relevant: `` `0x${string}` ``.
- Keep bigint handling explicit; convert to `Number()` only at boundaries.
- Ponder event handlers should be small and delegate to helpers.

## API/data conventions
- Normalize addresses with checksum or lowercase consistently.
- Keep offchain sync state in Drizzle tables, not in-memory.
- Prefer SQL-over-HTTP for website data access (`/sql`).
- Keep API response shapes stable; add fields instead of renaming.

## Vue/Nuxt conventions
- Use `<script setup lang="ts">` in SFCs.
- Use Nuxt auto-imports (`useRoute`, `useRuntimeConfig`, etc.).
- Keep composables in `app/composables/` and name them `useX`.
- Prefer computed values and composables over inline template logic.
- Keep templates readable; avoid nested ternaries.

## Imports
- Group imports: external packages first, then workspace/local modules.
- Keep import lists sorted and minimal.
- In Nuxt SFCs, avoid unnecessary imports that are auto-injected.

## Formatting
- Indent with 2 spaces.
- Match the file’s existing quote style.
- Follow existing semicolon usage in the file.
- Keep lines reasonably short; break long template strings when needed.

## Naming
- Use `camelCase` for variables/functions.
- Use `PascalCase` for classes, types, and Vue components.
- Use `kebab-case` or `BEM` style for CSS class names (`block__element`).
- Use descriptive names for API handlers and services (`importSales`, `openseaService`).

## Error handling
- Wrap network calls in `try/catch` and log meaningful context.
- Throw errors with actionable messages (include status codes, ids).
- Avoid swallowing errors; let callers decide how to recover.

## CSS and styling
- Use CSS variables from `@1001-digital/layers.base` and `@1001-digital/layers.evm`.
- Do not introduce new hardcoded colors, spacing, or sizing values.
- Keep styles scoped in components unless shared.

## Suggested validation flow
- Indexer changes: `pnpm lint` and `pnpm typecheck` in `indexer/`.
- Website changes: `pnpm typecheck` (and `pnpm build` for build-only edits).
- Shared changes: root `pnpm typecheck`.

## Documentation
- Prefer concise updates in existing docs rather than new files.
- Avoid adding new README files unless explicitly requested.
