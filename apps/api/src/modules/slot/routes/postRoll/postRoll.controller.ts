import { Hono } from "hono";
import type { Context } from "hono";
import { deleteCookie } from "hono/cookie";
import type { Session } from "../../../session/lib/Session.types";
import {
  SESSION_COOKIE_NAME,
  SESSION_CONTEXT_KEY,
} from "../../../session/lib/session.constants";
import { sessionGuard, verifyUserHasCredit } from "../../guards";
import { executeRoll } from "./postRoll.service";

const router = new Hono();

router.post("/roll", sessionGuard, verifyUserHasCredit, (c: Context) => {
  const session = c.get(SESSION_CONTEXT_KEY) as Session;
  const result = executeRoll(session);
  if (result.credits === 0) {
    deleteCookie(c, SESSION_COOKIE_NAME);
  }
  return c.json(result);
});

export default router;
