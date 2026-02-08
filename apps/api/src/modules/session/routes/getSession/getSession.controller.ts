import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { getSession_ResponseBody } from "@repo/network/session/getSession";
import { sessionManager } from "../../lib/SessionManager.class";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "../../lib/session.constants";

const router = new Hono();

router.get("/", (c) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  let session = sessionId ? sessionManager.getSession(sessionId) : undefined;

  if (!session) {
    session = sessionManager.createSession();
    setCookie(c, SESSION_COOKIE_NAME, session.id, SESSION_COOKIE_OPTIONS);
  }

  const responseBody: getSession_ResponseBody = { credits: session.credits };
  return c.json(responseBody);
});

export default router;
