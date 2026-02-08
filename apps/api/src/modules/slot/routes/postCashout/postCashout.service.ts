import type { postCashout_ResponseBody } from "@repo/network/slot/postCashout";
import type { Session } from "../../../session/lib/Session";
import { sessionManager } from "../../../session/lib/SessionManager.class";

export const executeCashout = (session: Session): postCashout_ResponseBody => {
  const credits = session.credits;
  sessionManager.destroySession(session.id);
  return {
    credits,
    message: "Cashed out successfully",
  };
};
