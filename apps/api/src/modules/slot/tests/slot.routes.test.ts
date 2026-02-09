import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import sessionRoutes from "../../session/routes/index";
import slotRoutes from "../routes/index";
import { sessionManager } from "../../session/lib/SessionManager.class";
import { SESSION_COOKIE_NAME } from "../../session/lib/session.constants";

const app = new Hono()
  .basePath("/api")
  .route("/slot/session", sessionRoutes)
  .route("/slot", slotRoutes);

const createSessionWithCredits = (credits: number) => {
  const session = sessionManager.createSession();
  if (credits !== 10) {
    sessionManager.updateCredits(session.id, credits);
  }
  return session;
};

const cookie = (id: string) => `${SESSION_COOKIE_NAME}=${id}`;

type RollResponseBody = {
  symbols: unknown[];
  credits: number;
  isWin: boolean;
  reward: number;
};

describe("POST /api/slot/roll", () => {
  beforeEach(() => {
    sessionManager.resetInstance();
  });

  it("no cookie -> 401", async () => {
    const res = await app.request("/api/slot/roll", { method: "POST" });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("invalid session cookie -> 401", async () => {
    const res = await app.request("/api/slot/roll", {
      method: "POST",
      headers: { cookie: cookie("nonexistent") },
    });
    expect(res.status).toBe(401);
  });

  it("valid session with credits >= 1 -> 200, credits deducted", async () => {
    const session = createSessionWithCredits(10);
    const res = await app.request("/api/slot/roll", {
      method: "POST",
      headers: { cookie: cookie(session.id) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as RollResponseBody;
    expect(body).toHaveProperty("symbols");
    expect(body.symbols).toHaveLength(3);
    expect(body).toHaveProperty("credits");
    expect(body).toHaveProperty("isWin");
    expect(body).toHaveProperty("reward");
    expect(typeof body.credits).toBe("number");
    expect(typeof body.isWin).toBe("boolean");
    expect(typeof body.reward).toBe("number");
  });

  it("valid session with 0 credits -> 400", async () => {
    const session = createSessionWithCredits(0);
    const res = await app.request("/api/slot/roll", {
      method: "POST",
      headers: { cookie: cookie(session.id) },
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Bad request" });
  });

  it("rolling to 0 credits destroys session and clears cookie", async () => {
    // Retry until we get a loss (93.75% chance per attempt)
    for (let attempt = 0; attempt < 20; attempt++) {
      sessionManager.resetInstance();
      const session = createSessionWithCredits(1);
      const res = await app.request("/api/slot/roll", {
        method: "POST",
        headers: { cookie: cookie(session.id) },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { isWin: boolean; credits: number };
      if (body.isWin) continue;

      expect(body.credits).toBe(0);
      expect(sessionManager.getSession(session.id)).toBeUndefined();
      const setCookieHeader = res.headers.get("set-cookie");
      expect(setCookieHeader).toContain(SESSION_COOKIE_NAME);
      return;
    }
    throw new Error("Failed to get a loss after 20 attempts");
  });

  it("credits decrease by 1 after a loss", async () => {
    // Retry until we get a loss (75% chance per attempt)
    for (let attempt = 0; attempt < 20; attempt++) {
      sessionManager.resetInstance();
      const session = createSessionWithCredits(5);
      const res = await app.request("/api/slot/roll", {
        method: "POST",
        headers: { cookie: cookie(session.id) },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as RollResponseBody;
      if (body.isWin) continue;

      expect(body.credits).toBe(4);
      expect(body.reward).toBe(0);
      return;
    }
    throw new Error("Failed to get a loss after 20 attempts");
  });

  it("credits are calculated correctly after a win", async () => {
    // Retry until we get a win (25% chance per attempt)
    for (let attempt = 0; attempt < 20; attempt++) {
      sessionManager.resetInstance();
      const session = createSessionWithCredits(5);
      const res = await app.request("/api/slot/roll", {
        method: "POST",
        headers: { cookie: cookie(session.id) },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as RollResponseBody;
      if (!body.isWin) continue;

      expect(body.credits).toBe(5 + body.reward);
      expect(body.reward).toBeGreaterThan(0);
      return;
    }
    throw new Error("Failed to get a win after 20 attempts");
  });
});

describe("POST /api/slot/cashout", () => {
  beforeEach(() => {
    sessionManager.resetInstance();
  });

  it("no cookie -> 401", async () => {
    const res = await app.request("/api/slot/cashout", { method: "POST" });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("invalid session cookie -> 401", async () => {
    const res = await app.request("/api/slot/cashout", {
      method: "POST",
      headers: { cookie: cookie("nonexistent") },
    });
    expect(res.status).toBe(401);
  });

  it("valid session with credits > 0 -> 200, session destroyed, cookie cleared", async () => {
    const session = createSessionWithCredits(15);
    const res = await app.request("/api/slot/cashout", {
      method: "POST",
      headers: { cookie: cookie(session.id) },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ credits: 15, message: "Cashed out successfully" });

    const setCookieHeader = res.headers.get("set-cookie");
    expect(setCookieHeader).toContain(SESSION_COOKIE_NAME);

    expect(sessionManager.getSession(session.id)).toBeUndefined();
  });

  it("valid session with 0 credits -> 400", async () => {
    const session = createSessionWithCredits(0);
    const res = await app.request("/api/slot/cashout", {
      method: "POST",
      headers: { cookie: cookie(session.id) },
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Bad request" });
  });

  it("session no longer exists after cashout (subsequent roll -> 401)", async () => {
    const session = createSessionWithCredits(10);
    await app.request("/api/slot/cashout", {
      method: "POST",
      headers: { cookie: cookie(session.id) },
    });

    const rollRes = await app.request("/api/slot/roll", {
      method: "POST",
      headers: { cookie: cookie(session.id) },
    });
    expect(rollRes.status).toBe(401);
  });
});
