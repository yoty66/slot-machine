# App Flow Planning

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/slot/session` | Get current session (auto-creates if none) |
| POST | `/api/slot/roll` | Perform a roll |
| POST | `/api/slot/cashout` | Cash out and end session |

---

## Flow 1: First Visit / Page Load

```
Browser                          Server
  |                                |
  |--- GET /api/slot/session ----->|
  |                                |-- No session cookie?
  |                                |   -> Create session (10 credits)
  |                                |   -> Set session_id cookie
  |                                |-- Session exists?
  |                                |   -> Look up credits from in-memory store
  |<-- { credits: 10 } ------------|
  |                                |
  |-- Render slot machine UI       |
  |   - 3 empty blocks             |
  |   - Credits: 10                |
  |   - Roll button (enabled)      |
  |   - Cash Out button            |
```

**Client states on load:**
- Loading -> Show loading indicator
- Session received -> Render slot machine with credits
- Credits = 0 -> Show Game Over screen

---

## Flow 2: Roll

```
Browser                          Server
  |                                |
  |-- User clicks Roll             |
  |-- Disable Roll button          |
  |-- Show spinning animation (X)  |
  |                                |
  |--- POST /api/slot/roll ------->|
  |                                |-- Deduct 1 credit
  |                                |-- Generate 3 random symbols (25% each)
  |                                |-- Check win (all 3 match?)
  |                                |-- If win AND credits in cheat range:
  |                                |     40-60: 30% chance -> re-roll once
  |                                |     > 60:  60% chance -> re-roll once
  |                                |     (log re-roll if triggered)
  |                                |-- If win (after possible re-roll):
  |                                |     Add reward to credits
  |                                |-- Clamp credits to min 0
  |                                |-- Save credits to session store
  |                                |
  |<-- { symbols: [S,S,S],  ------|
  |      credits: N,               |
  |      win: bool,                |
  |      reward: N }               |
  |                                |
  |-- Receive response             |
  |-- Continue spinning animation  |
  |-- Reveal block 1 at +1s        |
  |-- Reveal block 2 at +2s        |
  |-- Reveal block 3 at +3s        |
  |-- Show win/loss feedback        |
  |-- Update credits display       |
  |-- Enable Roll button           |
  |                                |
  |-- If credits = 0:              |
  |   -> Show Game Over screen     |
```

**Symbol rewards:**
| Symbol | Letter | Reward |
|--------|--------|--------|
| Cherry | C | 10 |
| Lemon | L | 20 |
| Orange | O | 30 |
| Watermelon | W | 40 |

**Re-roll decision tree:**
```
Generate 3 symbols
  -> Not a win? Return as-is
  -> Win?
     -> credits < 40:  Return as-is (no cheat)
     -> credits 40-60: Roll random [0,1)
        -> < 0.3: Re-roll all 3 symbols once, return new result
        -> >= 0.3: Return original win
     -> credits > 60:  Roll random [0,1)
        -> < 0.6: Re-roll all 3 symbols once, return new result
        -> >= 0.6: Return original win
```

---

## Flow 3: Cash Out

```
Browser                          Server
  |                                |
  |-- User clicks Cash Out         |
  |                                |
  |--- POST /api/slot/cashout ---->|
  |                                |-- Read final credits
  |                                |-- Destroy session from store
  |                                |-- Clear session cookie
  |                                |
  |<-- { credits: N,  ------------|
  |      message: "..." }          |
  |                                |
  |-- Show Cash Out success screen |
  |   - "You cashed out N credits" |
  |   - "Play Again" button        |
```

**Play Again:** Clicking "Play Again" triggers a page reload / fresh `GET /session` call, which auto-creates a new session with 10 credits -> back to Flow 1.

---

## Flow 4: Game Over (0 Credits)

```
After a roll returns credits = 0:
  |
  |-- Show Game Over screen
  |   - "Game Over" message
  |   - Final credits: 0
  |   - "New Game" button
  |
  |-- User clicks "New Game"
  |   -> Destroy current session (POST /cashout or just reload)
  |   -> Back to Flow 1 (auto-creates new session)
```

---

## Flow 5: Returning User (Existing Session)

```
Browser                          Server
  |                                |
  |-- Has session_id cookie        |
  |--- GET /api/slot/session ----->|
  |                                |-- Cookie found
  |                                |-- Session exists in store?
  |                                |   -> Yes: return credits
  |                                |   -> No (server restarted):
  |                                |      create new session (10 credits)
  |<-- { credits: N } ------------|
  |                                |
  |-- Render slot machine          |
  |   - Blocks empty (no last      |
  |     result stored)             |
  |   - Credits: N                 |
```

---

## UI States Summary

| State | What's shown |
|-------|-------------|
| **Loading** | Loading indicator |
| **Playing** | Slot machine (3 blocks, Roll + Cash Out buttons, credits) |
| **Spinning** | Blocks show "X" animation, Roll disabled |
| **Revealing** | Blocks reveal sequentially (1s, 2s, 3s), Roll disabled |
| **Result** | All blocks revealed, win/loss feedback, Roll enabled |
| **Game Over** | Game Over screen, "New Game" button |
| **Cashed Out** | Success screen with final credits, "Play Again" button |

---

## Session Lifecycle

```
[No Cookie] --GET /session--> [Active Session, 10 credits]
     ^                              |
     |                         [Roll / Play]
     |                              |
     |                        credits = 0?
     |                         /         \
     |                       Yes          No
     |                        |            |
     |                   [Game Over]   [Continue]
     |                        |
     |-- New Game ------------|
     |
     |                   [Cash Out]
     |                        |
     |                   [Success Screen]
     |                        |
     |-- Play Again ----------|
```

---

## Error Handling

**API:** All endpoints validate the session cookie and request state. On failure, the server logs the error internally and returns a **fixed generic message** (to reduce attack surface):
- **401** — `{ error: "Unauthorized" }` — Missing or invalid session.
- **400** — `{ error: "Bad request" }` — Invalid action given current state.

No specific error details in the response. Error details are logged server-side only.

**UI:** All API errors (network failures, 401, 400) are surfaced to the user via a **Shadcn Toaster** component (toast notification). The game UI remains on screen — errors do not navigate the user away or break the current view. The toast disappears after a few seconds.
