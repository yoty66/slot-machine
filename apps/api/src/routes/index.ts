import { Hono } from "hono";
import sessionRoutes from "../modules/session/routes/index";
import slotRoutes from "../modules/slot/routes/index";

const app = new Hono();

app.route("/slot/session", sessionRoutes);
app.route("/slot", slotRoutes);

export default app;
