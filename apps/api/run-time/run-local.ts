import "dotenv/config";
import app from "../src/index";
import { serve } from "@hono/node-server";

const port = process.env.PORT || 3001;

console.log(`Development server running on http://localhost:${port}/api`);

serve({
  fetch: app.fetch,
  port: Number(port),
});
