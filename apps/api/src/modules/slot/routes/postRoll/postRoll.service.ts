import type { postRoll_ResponseBody } from "@repo/network/slot/postRoll";
import type { Session } from "../../../session/lib/Session";
import { sessionManager } from "../../../session/lib/SessionManager.class";
import { slotMachine } from "../../lib/SlotMachine.class";
import { ROLL_COST } from "../../lib/slot.constants";

export const executeRoll = (session: Session): postRoll_ResponseBody => {
  const afterDeduction = sessionManager.updateCredits(session.id, session.credits - ROLL_COST);
  if (!afterDeduction) {
    throw new Error("Session lost during roll");
  }

  const result = slotMachine.roll(afterDeduction.credits);

  let finalCredits = afterDeduction.credits;
  if (result.isWin) {
    const afterReward = sessionManager.updateCredits(session.id, afterDeduction.credits + result.reward);
    if (!afterReward) {
      throw new Error("Session lost during reward");
    }
    finalCredits = afterReward.credits;
  }

  if (finalCredits === 0) {
    sessionManager.destroySession(session.id);
  }

  return {
    symbols: result.symbols,
    credits: finalCredits,
    isWin: result.isWin,
    reward: result.reward,
  };
};
