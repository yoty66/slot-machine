import { Hono } from "hono";
import getExample from "./getExample/getExample.controller";

const router = new Hono();

router.route("/", getExample);

export default router;
