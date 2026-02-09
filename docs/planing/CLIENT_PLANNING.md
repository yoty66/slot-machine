# Client High-Level Design

## Overview

A single-page slot machine UI built as a Next.js `"use client"` feature. All game screens (playing, game over, cashed out) render conditionally within one page — no routing. Server state is managed entirely through React Query + Axios. No global state store needed; React Query's cache is the single source of truth for credits, and local component state handles UI-only concerns (spinning phase, revealed slots).

---

## Architecture

One feature module: `features/slot-machine/`, following the existing convention (`dao/`, `pages/`, `testing/`). The page component owns the game state machine and delegates rendering to child components.

**Data flow:** Axios (DAO layer) → React Query hooks → Page component → UI components.

- **DAO layer** — Thin axios wrappers per endpoint. Import types from `@repo/network`. Each function returns an `AxiosResponse<T>`.
- **React Query hooks** — One `useQuery` for session, two `useMutation` hooks for roll and cashout. Hooks handle cache invalidation and optimistic state transitions.
- **Page component** — Reads hook states, derives the current screen, passes props down.
- **UI components** — Presentational. Receive data and callbacks as props. No direct API calls.

---

## Game State Machine

The page component derives the current screen from a combination of React Query state and local state:

| Screen                 | Condition                                              |
| ---------------------- | ------------------------------------------------------ |
| **Loading**            | Session query is loading                               |
| **Playing**            | Session loaded, credits > 0, not spinning              |
| **Spinning/Revealing** | Roll mutation in flight or reveal sequence in progress |
| **Game Over**          | Credits = 0 (after roll completes)                     |
| **Cashed Out**         | Cashout mutation succeeded                             |

Local state tracks:

- `rollResult` — Latest roll response (symbols, isWin, reward). Drives the reel display and win/loss feedback.
- `revealPhase` — Which blocks have been revealed (0, 1, 2, 3). Drives the sequential reveal timer.

Credits come from React Query cache (updated after each mutation response).

---

## Components

### SlotMachinePage (page component)

Orchestrates the game. Calls the three hooks, derives the active screen, handles transitions:

- On mount → session query fires automatically (React Query).
- Roll button click → fires roll mutation → sets spinning state → on success, starts reveal timer.
- Cashout button click → fires cashout mutation → on success, shows cashed out screen.
- "Play Again" / "New Game" → invalidates session query (forces new `GET /session`, which auto-creates a fresh session on the server) → resets local state.

### SlotReel (presentational)

Renders the 3 blocks in a row. Each block shows one of:

- Empty (initial state, no previous result)
- Spinning `X` with animation (during spin/reveal phase) — animation style TBD at implementation time
- The result letter (`C`, `L`, `O`, `W`) once revealed

The reveal is sequential: block 1 reveals at +1s after response, block 2 at +2s, block 3 at +3s. Driven by the `revealPhase` value from the parent.

### GameControls (presentational)

Roll and Cash Out buttons. Roll is disabled during spinning/revealing. Cash Out is always available while playing (credits > 0).

### CreditDisplay (presentational)

Shows current credit count. Reads from props.

### GameOverScreen / CashedOutScreen (presentational)

End-state overlays. Show final message + action button ("New Game" or "Play Again").

### Toast (error feedback)

Shadcn Toaster for API errors. Mounted in the layout or page. Errors from mutations/queries trigger a toast — the game UI stays intact underneath.

---

## Data Layer

### DAO (`features/slot-machine/dao/`)

Three functions, one per endpoint. Each imports `getAxiosInstance` and the response type from `@repo/network`:

| Function      | Method | Path                | Response Type              |
| ------------- | ------ | ------------------- | -------------------------- |
| `getSession`  | GET    | `/api/slot/session` | `getSession_ResponseBody`  |
| `postRoll`    | POST   | `/api/slot/roll`    | `postRoll_ResponseBody`    |
| `postCashout` | POST   | `/api/slot/cashout` | `postCashout_ResponseBody` |

Cookies are handled automatically (`withCredentials: true` is already set on the axios instance).

### React Query Hooks (`features/slot-machine/dao/`)

**`useSession`** — `useQuery` for `GET /session`. Fetches on mount. Provides `credits` to the UI. Query key: `["session"]`.

**`useRoll`** — `useMutation` for `POST /roll`. On success: updates the session query cache with the new `credits` from the response (via `queryClient.setQueryData`). Returns the full roll result for the reel animation.

**`useCashout`** — `useMutation` for `POST /cashout`. On success: clears session cache. The component uses the mutation's returned data to show the cashed-out screen.

**Error handling:** All three hooks surface errors via React Query's built-in `error` state. The page component catches these and triggers a toast notification. No navigation or state breakage on error.

---

## Reveal Timer Logic

After the roll mutation succeeds:

1. Store the result in local state. All 3 blocks show spinning `X`.
2. Start a sequence: `setTimeout` at 1s → reveal block 1, `setTimeout` at 2s → reveal block 2, `setTimeout` at 3s → reveal block 3.
3. After block 3 reveals → update credits display, show win/loss feedback, re-enable Roll button.

This is local state (`revealPhase: 0 | 1 | 2 | 3`), not server state. The response arrives before the animation starts — the client holds the result and reveals it progressively.

---

## File Structure

```
features/slot-machine/
  dao/
    slot.dao.ts              -- axios wrappers (getSession, postRoll, postCashout)
    slot.queries.ts          -- React Query hooks (useSession, useRoll, useCashout)
  components/
    SlotReel.tsx             -- 3-block reel display + spinning animation
    GameControls.tsx         -- Roll + Cash Out buttons
    CreditDisplay.tsx        -- Credit counter
    GameOverScreen.tsx       -- Game over overlay
    CashedOutScreen.tsx      -- Cash out success overlay
  pages/
    SlotMachinePage.tsx      -- Main page component (state machine + composition)
  testing/
    SlotMachinePage.test.tsx -- Component tests (rendering per state, interactions)
    slot.queries.test.ts     -- Hook tests (mocked axios, cache behavior)
```

Update `app/page.tsx` to render `SlotMachinePage` instead of `ExamplePage`.

---

## Error Handling

- **Network/server errors** → Caught by React Query → displayed via Shadcn Toast. Game UI stays visible and functional.
- **401 (session gone)** → The axios interceptor already catches this. The toast shows a generic error. User can click "New Game" or refresh to get a fresh session.
- **400 (0 credits trying to roll)** → Shouldn't happen because the UI disables Roll at 0 credits, but if it does, toast notification handles it gracefully.

The only exception is during initial session loading: if the session fetch fails, a dedicated error page is displayed instead of a toast notification.

---

## Testing Strategy

### Component Tests (`SlotMachinePage.test.tsx`)

- **Loading state:** renders loading indicator while session query is pending.
- **Playing state:** renders reel, buttons, credits after session loads.
- **Spinning state:** Roll button click triggers mutation, blocks show spinning X, Roll disabled.
- **Reveal sequence:** After mock roll response, blocks reveal sequentially.
- **Win feedback:** When `isWin: true`, shows win indication after reveal.
- **Game Over:** When credits reach 0, shows Game Over screen with "New Game" button.
- **Cashed Out:** After cashout, shows success screen with final credits and "Play Again".
- **Error toast:** API error triggers toast, game UI stays intact.
- **"New Game" / "Play Again":** Clicking resets state and triggers fresh session fetch.

### Hook Tests (`slot.queries.test.ts`)

- **useSession:** Calls `GET /session`, returns credits, caches result.
- **useRoll:** Calls `POST /roll`, updates session cache with new credits on success.
- **useCashout:** Calls `POST /cashout`, clears session cache on success.
- **Error propagation:** API errors surface through the hook's error state.

All tests mock the axios instance at the DAO layer — no real network calls.
