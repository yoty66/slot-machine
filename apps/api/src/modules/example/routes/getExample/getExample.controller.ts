import { Hono } from "hono";
import type { getExample_ResponseBody } from "@repo/network/example/getExample";

const router = new Hono();

router.get("/", (c) => {
  const responseBody: getExample_ResponseBody = {
    message: "Hello from getExample", 
  };
  return c.json(responseBody);
});

export default router;
