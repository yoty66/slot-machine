import { Context, Next } from "hono";

const handleError = (error: Error, c: Context) => {
  console.log("Error caught in middleware:", error);
  return c.json({ error: "Bad request" }, 400);
};

const errorHandlerMiddleware = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    return handleError(error as Error, c);
  }
};

export default errorHandlerMiddleware;

export const onError = (err: Error, c: Context) => {
  return handleError(err, c);
};
