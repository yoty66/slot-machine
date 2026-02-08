# Turborepo + Hono + Next.js starter

Monorepo starter with an API (Hono), a web app (Next.js), and shared packages. TypeScript throughout, with unit tests, optional nginx for local dev, and a Puppeteer sanity check.

## What's inside

### Apps

- **api** – [Hono](https://hono.dev/) backend (Node). Entry in `run-time/run-local.ts`. Modules under `src/modules/`, shared capabilities under `src/capabilities/`.
- **web** – [Next.js](https://nextjs.org/) app (App Router). Features under `features/`, shared capabilities under `capabilities/`.

### Packages

- **@repo/network** – Shared API contracts (types/schemas) used by api and web.
- **@repo/typescript-config** – Shared tsconfig presets (`base.json`, `nextjs.json`, `node.json`).
- **@repo/eslint-config** – Shared ESLint configs.
- **@repo/sanity-check** – Standalone Puppeteer sanity script; assumes web and API (and optionally nginx) are already running.

Workspace is defined in `pnpm-workspace.yaml` (`apps/*`, `packages/*`).

## File structure and modularity

### API (`apps/api/`)

- **Modular layout:** `src/modules/<module>/` with `routes/`, `dao/`, `guards/`, `utils/`, and `testing/` (route tests). Top-level `src/routes/` mounts module routes; `src/capabilities/` holds cross-cutting concerns (cors, logger, error-handling).
- **Pattern:** One domain per module; routes use controllers/services; contracts live in `@repo/network`.

### Web (`apps/web/`)

- **Feature-based layout:** `features/<feature>/` with `pages/`, `dao/`, `testing/`. `app/` for Next routes and layout; `capabilities/` for data-fetching, etc.; `components/` for shared UI.
- **Pattern:** Features own their pages, API calls (dao), and tests; shared types from `@repo/network`.

### Contracts

`@repo/network` defines request/response types (and optionally Zod schemas) per endpoint so api and web stay in sync. Example: `packages/network/src/modules/example/`.

## Testing

- **Unit tests:** API and web use **Vitest**. API tests live under `src/modules/<module>/testing/`; web tests under `features/<feature>/testing/`. Run all from root: `pnpm run test`. Run per app: `pnpm run test` inside `apps/api` or `apps/web`.
- **Coverage:** `pnpm run coverage` runs `test:coverage` for api and web; reports under each app’s `coverage/` directory.
- **Build runs unit tests:** The Turbo **build** pipeline runs **unit tests before build**. The `build` task depends on the `test` task (`turbo.json`), so `pnpm run build` runs tests for api and web first, then builds.

## Running locally

**Prerequisites:** Node (22.x), pnpm.

**Install:**

```bash
pnpm install
```

**Dev (no nginx):**

```bash
pnpm run dev
```

Starts web on port 3000 and api on port 3001. Open web at `http://localhost:3000`, API at `http://localhost:3001/api/...`.

**Dev with nginx (e.g. for auth / same-origin cookies):**

Use when you need a single hostname or cookie behavior that matches production (e.g. auth cookies).

1. **Hosts:** Add to `/etc/hosts`:
   ```
   127.0.0.1 api.local-dev.com app.local-dev.com
   ```
2. **Ports:** Ensure 80, 3000, 3001 are free. nginx listens on 80 and proxies to 3000 (web) and 3001 (api).
3. **Start nginx:** `pnpm run nginx:start` (config: `nginx/ngnix_local.conf`).
4. **Start apps:** `pnpm run dev` in another terminal.
5. **Open:** Web at `http://app.local-dev.com`, API at `http://api.local-dev.com/api/...`.

See [nginx/README.md](nginx/README.md) for details (config path, logs, stop with `pnpm run nginx:stop`).

## Sanity check

A standalone Puppeteer script in `@repo/sanity-check` assumes web and API (and, if applicable, nginx) are already running. It opens the app, checks that the example flow loads data and that the refresh button works.

**When to use:** After starting dev (and optionally nginx), run it to confirm the full stack and routing work.

**Run from root:**

```bash
pnpm run sanity
```

Without nginx use the default URL; with nginx set `SANITY_APP_URL=http://app.local-dev.com`. See [packages/sanity-check/README.md](packages/sanity-check/README.md) for env and options.

## Scripts

From repo root:

| Command | Description |
|---------|-------------|
| `pnpm run build` | Build all (runs unit tests first) |
| `pnpm run dev` | Start web and api in dev |
| `pnpm run test` | Run unit tests in all packages that define them |
| `pnpm run coverage` | Run tests with coverage |
| `pnpm run sanity` | Run Puppeteer sanity check (apps must be running) |
| `pnpm run lint` | Lint |
| `pnpm run check-types` | Type-check |
| `pnpm run format` | Format with Prettier |
| `pnpm run nginx:start` | Start local nginx (see nginx/README.md) |
| `pnpm run nginx:stop` | Stop nginx |
| `pnpm run build:no-cache` | Build without Turbo cache (`--force`) |
