import type { Next, Context } from "hono";
import type { Session } from "../lib/Session.types";
import logger from "../../../capabilities/logger";
import { SESSION_CONTEXT_KEY } from "../lib/session.constants";

export const verifyUserHasCredit = async (c: Context, next: Next) => {
  const session = c.get(SESSION_CONTEXT_KEY) as Session | undefined;
  if (!session) {
    logger.error("verifyUserHasCredit: session missing in context", {});
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (session.credits < 1) {
    logger.error("verifyUserHasCredit: insufficient credits for action", {
      credits: session.credits,
      sessionId: session.id,
    });
    return c.json({ error: "Bad request" }, 400);
  }
  return next();
};
