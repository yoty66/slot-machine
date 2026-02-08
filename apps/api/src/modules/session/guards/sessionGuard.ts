import { Next, Context } from "hono";

export const sessionGuard = (c: Context, next: Next) => {
    return next()
}
