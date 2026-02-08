# Assumptions

## Re-Roll Mechanic

- When the server decides to re-roll a winning round (30% or 60% chance based on credit range), it performs a **single re-roll only**.
- If the re-rolled result is also a win, the win stands — no recursive re-rolling.
- Rationale: If we want a higher chance to deny wins, we should increase the re-roll probability directly rather than creating a recursive re-roll loop. A recursive approach just complicates the probability math while achieving the same effect — controlling it via a single probability value is cleaner and more transparent.
