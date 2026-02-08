import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import routes from "./routes/index";
import { corsMiddleware } from "./capabilities/cors/index";
import errorHandlerMiddleware, { onError } from "./capabilities/error-handling/index";
import { loggerMiddleware } from "./capabilities/logger/loggerMiddleware";

const app = new Hono()
  .basePath("/api")
  .onError(onError);
app.use("*", loggerMiddleware);
app.use("*", errorHandlerMiddleware);
app.use("*", corsMiddleware);

app.route("/", routes);

showRoutes(app, { colorize: true });

export default app;
