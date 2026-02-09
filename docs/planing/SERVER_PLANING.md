# Server High-Level Design

## Overview

The server exposes three REST endpoints under `/api/slot/` that drive a slot machine game. Session state is held in-memory for the lifetime of the process. The core game logic is decoupled from HTTP handling through a class-based architecture with dependency injection.

---

## Architecture

Two modules, both mounted under `/api/slot`:

- **session** — session lifecycle (create, lookup, destroy) and the `GET /session` endpoint.
- **slot** — game logic and the `POST /roll`, `POST /cashout` endpoints.

The session module owns the in-memory store and a guard middleware. The slot module depends on the session guard but owns all game mechanics independently.

Shared request/response types live in `@repo/network` so the client and server stay in sync.

---

## Components

### SessionManager (singleton)

An in-memory `Map<id, Session>` with basic CRUD:

- Create a session with 10 starting credits and a UUID.
- Look up a session by ID.
- Update credits (clamped to min 0).
- Destroy a session (remove from map).

No persistence beyond process lifetime — by design.

### Session Guard (middleware)

Applied to `/roll` and `/cashout`. Reads `session_id` from cookies, resolves it against SessionManager. Returns 401 if missing or invalid. On success, attaches the session to the request context for downstream controllers.

`GET /session` has no guard — it auto-creates when no session exists.

### SlotMachine (singleton, DI)

Orchestrates a single roll. Receives three collaborators via constructor injection:

| Collaborator         | Responsibility                                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SymbolGenerator**  | Produces a reel of 3 symbols. Uniform random (25% each) across a configurable symbol list.                                                                                                        |
| **RewardCalculator** | Takes 3 symbols, checks if all match, returns `{ isWin, reward }` based on a configurable reward table.                                                                                           |
| **CheatPolicy**      | Given current credits, decides whether to re-roll a winning result. Bracket-based: 40-60 credits → 30% chance, >60 → 60% chance. Accepts an injectable random function for deterministic testing. |

**Roll flow:**

1. Generate reel.
2. Calculate result.
3. If win → consult CheatPolicy → if re-roll triggered, generate a new reel and recalculate (single re-roll, not recursive).
4. Return `{ symbols, isWin, reward }`.

SlotMachine does **not** own session state. Controllers read credits, call `roll()`, and write back.

**Why DI:** Each collaborator is behind an interface. This satisfies Open/Closed (new symbol sets, reward tables, or cheat brackets require config changes — not class modifications) and makes unit testing trivial with mocks/stubs.

---

## API Contracts

### `GET /api/slot/session`

No guard. Reads cookie → returns existing session or creates a new one (sets cookie).

**Response:** `{ credits: number }`

### `POST /api/slot/roll`

Guard: sessionGuard. Checks `credits >= 1`, deducts 1, runs SlotMachine.roll(), adds any reward, persists updated credits.

**Response:** `{ symbols: [string, string, string], credits: number, isWin: boolean, reward: number }`

### `POST /api/slot/cashout`

Guard: sessionGuard. Reads final credits, destroys session, clears cookie.

**Response:** `{ credits: number, message: string }`

---

## Error Handling

Fixed generic responses — no internal details leak to the client:

- **401** `{ error: "Unauthorized" }` — missing/invalid session.
- **400** `{ error: "Bad request" }` — invalid action for current state (e.g. rolling with 0 credits).

Details logged server-side only.

---

## Testing Strategy

- **Unit tests:** SessionManager CRUD, each SlotMachine collaborator in isolation, SlotMachine with mocked deps (verify re-roll logic, reward calculation, edge cases).
- **Integration tests:** Hit the three endpoints via `app.request()` — full request lifecycle including cookies, guards, and state mutations.
- Injectable `randomFn` in CheatPolicy enables deterministic assertions on re-roll behavior.
