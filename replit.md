# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/rudy` (`@workspace/rudy`)

Rudy — sassy red panda AI companion chat app at `/`. Dark themed, powered by xAI Grok API.

### `artifacts/manager` (`@workspace/manager`)

Artist Manager Autopilot at `/manager/`. Multi-agent AI suite for music artist career management.

**Pages:**
- Dashboard — overview stats, daily industry tip, AI team grid
- AI Agents (6) — Manager, Assistant, PR, Social Media, Playlister, Advertiser
- Tasks — priority-based task management
- Engagement Engine — Twitter/X search + AI reply generation + autopilot
- Ad Campaigns — AI-generated ad drafts across Meta/TikTok/Google/YouTube/Spotify optimized for high reach, low CPM/CPC
- Knowledge Base — 8 chapters of artist management research (fundamentals, streaming, playlists, social, PR, advertising, revenue, team building)
- Settings — Artist profile, platform connections (Meta, TikTok, Google, Spotify, Apple Music, Audiomack, Boomplay, Twitter/X, Shopify, tracking pixels)

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers
  - `/api/chat` — Rudy xAI chat
  - `/api/agents` — 6 AI agent conversations (manager, assistant, pr, social, playlister, advertiser)
  - `/api/tasks` — Task CRUD
  - `/api/engagement` — Twitter engagement engine + autopilot
  - `/api/ad-drafts` — AI-generated ad campaign drafts
  - `/api/settings` — Key/value app settings store
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

**Important:** All AI features require xAI API credits at https://console.x.ai

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### Ad Drafts & Spotify Growth Playbooks

Two new features added to the Artist Manager Autopilot:

- **Ad Drafts** (`/ad-drafts`): AI-generated ad campaign drafts across Meta, YouTube, TikTok, Spotify Marquee/Showcase, and Google Ads. Each draft includes platform, hook copy, CTA, targeting, budget suggestion, and objective. Drafts can be approved, archived, or deleted. Auto-generates on first visit.
- **Spotify Growth Playbooks** (`/growth-playbooks`): Structured step-by-step playbooks for growing Spotify followers, categorized as pre-save campaigns, algorithm optimization, curator outreach, and follower engagement. Expandable cards show numbered steps.

Database tables: `ad_drafts`, `growth_playbooks` (schema in `lib/db/src/schema/ad-drafts.ts` and `growth-playbooks.ts`).
API routes: `/api/ad-drafts` and `/api/growth-playbooks` (in `artifacts/api-server/src/routes/`).
Frontend pages: `artifacts/manager/src/pages/AdDrafts.tsx` and `GrowthPlaybooks.tsx`.

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
