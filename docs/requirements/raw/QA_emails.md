# Questions:


1. Session Scope and Persistence
The brief states "when a user opens the app, a session is created on the server." Could you clarify the intended scope?
- Cross-machine (full authentication): user can log in from any device and continue their session
- Browser level: session persists across tabs but only in the same browser 
- Tab level: each browser tab gets its own independent session

2. Symbol Distribution
The brief mentions 4 possible symbols (Cherry, Lemon, Orange, Watermelon). Should I assume a uniform distribution (25% probability for each symbol per block)?

3. Cash Out Flow and End Screen
The brief mentions "a cash-out endpoint that moves credits from the game session to the user's account and closes the session" and hints at "a twist."
- Should I display a success/confirmation screen after cash out?
- Should there be a "Start New Session" button after cashing out?
- Could you clarify what the "twist" with the cash out button refers to?

4. Zero/Negative Credits Handling
- Can a user's credit balance go negative, or the minimum is 0?
- When a user reaches 0 credits (and cannot roll), how should the app behave?
  - Automatically end the session?
  - Show a "Game Over" screen with the option to start a new session?
  - Simply disable the Roll button and wait for cash out?

5. Server-Side Persistence
To what level should the session data persist?
- Survive server restarts: session persists through server restart (e.g. file system) 
- Multi-instance/serverless compatible: session accessible across multiple server instances (e.g. external database )

# Answers 

 

1. Session scope and persistence

Assume a browser level session: the session should persist across tabs in the same browser, but does not need full cross-device authentication. A simple session model is totally fine here.

 

2. Symbol distribution

Yes you can assume a uniform distribution (25% per symbol). No need to overthink weighting or edge cases unless you explicitly want to call something out.

 

3. Cash out flow and the “twist”

After cashing out, you should display a clear success/end state.

A “Start New Session” action makes sense, but how you present it is up to you.

The "twist" refers to the reroll functionality.

 

4. Zero / negative credits

Credits should not go negative, the minimum is 0.

 

5. Server side persistence

You don’t need to support server restarts or multi-instance setups.

In memory persistence for the lifetime of the server process is completely sufficient for this exercise.

 
