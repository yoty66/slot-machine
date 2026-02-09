# Slot Machine — Full-Stack Assignment

A full-stack slot machine game built as a monorepo with an API (Hono), a web app (Next.js), and shared packages. TypeScript throughout, with unit tests, optional nginx for local dev, and a Puppeteer sanity check. The game implements a "house always wins" mechanic with progressive cheating based on player credit levels.

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

## API — Design & Decisions

### Architecture

The server exposes three REST endpoints under `/api/slot/` that drive a slot machine game. Session state is held in-memory for the lifetime of the process. The core game logic is decoupled from HTTP handling through a class-based architecture with dependency injection.

**Two modules**, both mounted under `/api/slot`:

- **session** — Session lifecycle (create, lookup, destroy) and the `GET /session` endpoint.
- **slot** — Game logic and the `POST /roll`, `POST /cashout` endpoints.

The session module owns the in-memory store and a guard middleware. The slot module depends on the session guard but owns all game mechanics independently.

**Key Components:**

- **SessionManager** (singleton) — In-memory `Map<id, Session>` with CRUD. Creates sessions with 10 starting credits and UUID. No persistence beyond process lifetime.
- **Session Guard** (middleware) — Applied to `/roll` and `/cashout`. Reads `session_id` cookie, resolves against SessionManager. Returns 401 if missing/invalid. `GET /session` has no guard — auto-creates when no session exists.
- **SlotMachine** (singleton, DI) — Orchestrates a single roll. Receives three collaborators via constructor injection:
  - **SymbolGenerator** — Produces 3 symbols, uniform random (25% each).
  - **RewardCalculator** — Checks if all 3 match, returns `{ isWin, reward }` based on reward table.
  - **CheatPolicy** — Decides whether to re-roll a winning result. Bracket-based: 40-60 credits → 30% chance, >60 → 60% chance.

**Why Dependency Injection:** Each collaborator is behind an interface. This satisfies Open/Closed Principle (new symbol sets, reward tables, or cheat brackets require config changes — not class modifications), Single Responsibility Principle, and makes unit testing trivial with mocks/stubs.

### Endpoints & Flow

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/slot/session` | Get current session (auto-creates if none) |
| POST | `/api/slot/roll` | Perform a roll |
| POST | `/api/slot/cashout` | Cash out and end session |

**Roll Flow:** User clicks Roll → `POST /roll` (session guard validates) → Deduct 1 credit → Generate 3 symbols (25% each) → Check win → If win and credits in cheat range (40-60: 30% chance, >60: 60% chance), re-roll once → If win, add reward → Clamp to min 0 → Save → Return `{ symbols, credits, isWin, reward }`

### Key Decisions

**Generic Error Responses** — Fixed generic messages: `{ error: "Bad request" }` for 400, `{ error: "Unauthorized" }` for 401. No specific details leaked to client.

**Rationale:** Reduces attack surface by not leaking internal state, validation logic, or implementation details to the client. Specific error details are logged server-side only. This is a good pattern when we expect the API to only be consumed via the web app.

**Single Re-Roll (No Recursion)** — When the server decides to re-roll a winning round (30% or 60% chance based on credit range), it performs a **single re-roll only**. If the re-rolled result is also a win, the win stands — no recursive re-rolling.

**Rationale:** If we want a higher chance to deny wins, we should increase the re-roll probability directly rather than creating a recursive re-roll loop. A recursive approach just complicates the probability math while achieving the same effect — controlling it via a single probability value is cleaner and more transparent.

**Cookie Security** — Session ID is generated with `crypto.randomUUID()` so IDs are unpredictable and not guessable in practice; cookie is set with `httpOnly` and `sameSite: "Lax"`. Local/dev nginx has no SSL, so `secure` is not set there; **in production we will add `secure: true`** (HTTPS only).

## Web App — Design & Decisions

### Architecture

A single-page slot machine UI built as a Next.js `"use client"` feature. All game screens render conditionally within one page — no routing. Server state managed via React Query + Axios. React Query's cache is the single source of truth for credits; local component state handles UI-only concerns (spinning phase, revealed slots).

**One feature module:** `features/slot-machine/`. Data flow: Axios (DAO) → React Query hooks → Page component → UI components. DAO layer provides thin axios wrappers. React Query hooks handle cache invalidation. Page component derives current screen. UI components are presentational.

### Game State Machine

The page component derives the current screen from a combination of React Query state and local state:

| Screen | Condition |
|--------|-----------|
| **Loading** | Session query is loading |
| **Error** | Initial session fetch failed |
| **Playing** | Session loaded, credits > 0, not spinning |
| **Spinning/Revealing** | Roll mutation in flight or reveal sequence in progress |
| **Game Over** | Credits = 0 (after roll completes) |
| **Cashed Out** | Cashout mutation succeeded |

**Local state:** `rollResult` (latest roll response) and `revealPhase` (0-3, which blocks revealed). Credits from React Query cache.

### Data Layer

**DAO** (`features/slot-machine/dao/slot.dao.ts`) — Three axios wrappers: `getSession`, `postRoll`, `postCashout`. Types imported from `@repo/network`. Cookies handled automatically.

**React Query Hooks** (`features/slot-machine/dao/slot.queries.ts`):
- **`useSession`** — `useQuery` for session, fetches on mount, provides credits.
- **`useRoll`** — `useMutation` for roll, updates session cache on success, returns roll result.
- **`useCashout`** — `useMutation` for cashout, clears session cache on success.

### Reveal Timer Logic

After roll mutation succeeds: store result in local state, all blocks show spinning `X`. Sequential reveal via `setTimeout` at 1.3s, 2.3s, 3.3s. After block 3 reveals, update credits, show feedback, re-enable Roll button. This is local state (`revealPhase: 0 | 1 | 2 | 3`), not server state — client holds result and reveals progressively.

### Key Decisions

**No SSR** — The web application will **not use Server-Side Rendering (SSR)** in Next.js, despite the potential benefit of preventing initial loading states (e.g., fetching session data on the server).

**Rationale:** SSR introduces security vulnerabilities and attack surface. Recent examples include React2Shell and other server-side rendering exploits.

**Single Page Application (SPA)** — No routing, all screens render conditionally within one page. Eliminates need for complex global state management and simplifies architecture.

**Container/Presentational Pattern** — All state and logic in `SlotMachinePage`, presentation components are display-only. Improves testability and maintainability.

**Symbol Display Timing** — Delays are **1.3s, 2.3s, and 3.3s** (includes 0.3s fade animation) for smooth visual experience.

**Error Handling via Toast** — All API errors surfaced via Shadcn Toaster. Game UI stays intact. Exception: initial session loading failures show ErrorScreen with retry button instead of toast.

## Testing

- **Unit tests:** API and web use **Vitest**. API tests live under `src/modules/<module>/tests/`; web tests under `features/<feature>/testing/`. Run all from root: `pnpm run test`. Run per app: `pnpm run test` inside `apps/api` or `apps/web`.
- **Coverage:** `pnpm run coverage` runs `test:coverage` for api and web; reports under each app’s `coverage/` directory.
- **Build runs unit tests:** The Turbo **build** pipeline runs **unit tests before build**. The `build` task depends on the `test` task (`turbo.json`), so `pnpm run build` runs tests for api and web first, then builds.

**Testing Philosophy — Black-Box Over Implementation Coupling:**

Unit tests must not assume or depend on internal implementation details. For example, rather than injecting a `randomFn` into `CheatPolicy` (which couples tests to the knowledge that the class uses a random function internally), we test the **statistical behavior** by running many trials and asserting the re-roll rate matches the expected probability within a tolerance.

**Rationale:** If the implementation changes (e.g., switching from `Math.random` to `crypto.getRandomValues()`), the tests should still pass as long as the behavior is correct. Tests that mock or inject internals break on refactors even when behavior is unchanged — that's a sign they're testing the wrong thing.

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
| `pnpm run build:no-cache` | Build without Turbo cache (`--force`) |
| `pnpm run dev` | Start web and api in dev |
| `pnpm run test` | Run unit tests in all packages that define them |
| `pnpm run coverage` | Run tests with coverage |
| `pnpm run sanity` | Run Puppeteer sanity check (apps must be running) |
| `pnpm run lint` | Lint |
| `pnpm run check-types` | Type-check |
| `pnpm run format` | Format with Prettier |
| `pnpm run nginx:start` | Start local nginx (see nginx/README.md) |
| `pnpm run nginx:stop` | Stop nginx |

