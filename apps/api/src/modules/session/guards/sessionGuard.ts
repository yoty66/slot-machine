import type { Next, Context } from "hono";
import { getCookie } from "hono/cookie";
import logger from "../../../capabilities/logger";
import { sessionManager } from "../lib/SessionManager.class";
import { SESSION_COOKIE_NAME, SESSION_CONTEXT_KEY } from "../lib/session.constants";

export const sessionGuard = async (c: Context, next: Next) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  if (!sessionId) {
    logger.error("sessionGuard: missing session cookie", {});
    return c.json({ error: "Unauthorized" }, 401);
  }
  const session = sessionManager.getSession(sessionId);
  if (!session) {
    logger.error("sessionGuard: invalid or unknown session id", { sessionId });
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set(SESSION_CONTEXT_KEY, session);
  return next();
};
