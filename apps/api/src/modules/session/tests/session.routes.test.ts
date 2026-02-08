import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import sessionRoutes from "../routes/index";
import { sessionManager } from "../lib/SessionManager.class";
import { INITIAL_CREDITS, SESSION_COOKIE_NAME } from "../lib/session.constants";

const app = new Hono()
  .basePath("/api")
  .route("/slot/session", sessionRoutes);

describe("GET /api/slot/session", () => {
  beforeEach(() => {
    sessionManager.resetInstance();
  });

  it("no cookie: returns 200, creates new session with INITIAL_CREDITS, sets Set-Cookie", async () => {
    const res = await app.request("/api/slot/session");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ credits: INITIAL_CREDITS });
    const setCookieHeader = res.headers.get("set-cookie");
    expect(setCookieHeader).toBeTruthy();
    expect(setCookieHeader).toContain(SESSION_COOKIE_NAME);
  });

  it("valid cookie: returns that session's credits (not always 10)", async () => {
    const session = sessionManager.createSession();
    sessionManager.updateCredits(session.id, 3);
    const res = await app.request("/api/slot/session", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${session.id}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ credits: 3 });
  });

  it("valid cookie with 0 credits: returns 0", async () => {
    const session = sessionManager.createSession();
    sessionManager.updateCredits(session.id, 0);
    const res = await app.request("/api/slot/session", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${session.id}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ credits: 0 });
  });

  it("invalid cookie: creates new session and returns 200 with INITIAL_CREDITS", async () => {
    const invalidSessionId = "non-existent-id";
    const res = await app.request("/api/slot/session", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${invalidSessionId}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ credits: INITIAL_CREDITS });
    const setCookieHeader = res.headers.get("set-cookie");
    expect(setCookieHeader).toBeTruthy();
    const cookieValue = setCookieHeader!.split(";")[0]?.split("=")[1];
    expect(cookieValue).toBeDefined();
    expect(cookieValue).not.toBe(invalidSessionId);
  });
});
