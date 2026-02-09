# Assumptions

## Re-Roll Mechanic

- When the server decides to re-roll a winning round (30% or 60% chance based on credit range), it performs a **single re-roll only**.
- If the re-rolled result is also a win, the win stands — no recursive re-rolling.
- Rationale: If we want a higher chance to deny wins, we should increase the re-roll probability directly rather than creating a recursive re-roll loop. A recursive approach just complicates the probability math while achieving the same effect — controlling it via a single probability value is cleaner and more transparent.





# Decisions

## Server - API Error Responses

- API error responses return a **fixed generic message** in the body — `{ error: "Bad request" }` for 400 or `{ error: "Unauthorized" }` for 401. No specific error descriptions or details.
- Rationale: Reduces attack surface by not leaking internal state, validation logic, or implementation details to the client. Follows the existing error-handling pattern in the codebase. Specific error details are logged server-side only. This is a good pattern when we expect the api to only be consumed via the web app 



## General - Cookie value
- Session ID is generated with `crypto.randomUUID()` so IDs are unpredictable and not guessable in practice; cookie is set with `httpOnly` and `sameSite: "Lax"`. Local/dev nginx has no SSL, so `secure` is not set there; **in production we will add `secure: true`** (HTTPS only).

## Server - slot machine logic structure
- The slot machine logic is broke into single tasks/domains that each is: 
  - Declaring an interface
  - Implementing this logic with a single class 
  - export a singleton 
- The tasks are: 
  - SymbolGenerator 
  - RewardCalculator 
  - CheatPolicy
  - SlotMachine - who recieves all three is a dependency (dependency injection) 
Rationale:
- This allows us to test each domain easily 
- This is also allowing us to have the Open and closed principle for the same type of SlotMachine ( 3 symbols etc) and  Single Responsibility Principle

## General - Unit testing — black-box over implementation coupling
- Unit tests must not assume or depend on internal implementation details. For example, rather than injecting a `randomFn` into `CheatPolicy` (which couples tests to the knowledge that the class uses a random function internally), we test the **statistical behavior** by running many trials and asserting the re-roll rate matches the expected probability within a tolerance.
- Rationale: If the implementation changes (e.g., switching from `Math.random` to `crypto.getRandomValues()`), the tests should still pass as long as the behavior is correct. Tests that mock or inject internals break on refactors even when behavior is unchanged — that's a sign they're testing the wrong thing.

## WebApp — no SSR
- The web application will **not use Server-Side Rendering (SSR)** in Next.js, despite the potential benefit of preventing initial loading states (e.g., fetching session data on the server).
- Rationale: SSR introduces security vulnerabilities and attack surface. Recent examples include React2Shell and other server-side rendering exploits.

## WebApp - Single Page Application (SPA)
- The application will be implemented as a **single page application** without traditional multi-page navigation.
- Rationale: This approach eliminates the need for complex global state management solutions and avoids complications related to page navigation, state persistence, and route-based data synchronization. A single-page architecture simplifies the application structure and reduces architectural complexity while maintaining all required functionality. 

## WebApp - Symbol display timing
- Symbol display delays are **1.3s, 2.3s, and 3.3s** (includes 0.3s fade animation).
- Rationale: Provides better visual experience with smooth fade transitions.

## WebApp - Component architecture
- All state and logic is encapsulated in the `SlotMachinePage` component, keeping presentation components display-only.
- Rationale: Enables Container/Presentational pattern separation, improving testability and maintainability.


