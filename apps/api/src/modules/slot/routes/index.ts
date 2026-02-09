import { Hono } from "hono";
import postRoll from "./postRoll/postRoll.controller";
import postCashout from "./postCashout/postCashout.controller";

const router = new Hono();

router.route("/", postRoll);
router.route("/", postCashout);

export default router;
