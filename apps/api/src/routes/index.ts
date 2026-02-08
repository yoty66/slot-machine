import { Hono } from "hono";
import exampleRoutes from "../modules/example/routes/index";

const app = new Hono();

app.route("/example", exampleRoutes);

export default app;
