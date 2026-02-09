import { cors } from "hono/cors";

const applicationUrl = process.env.NEXT_PUBLIC_APPLICATION_URL;
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

if (!applicationUrl || !serverUrl) {
  throw new Error(
    "NEXT_PUBLIC_APPLICATION_URL and NEXT_PUBLIC_SERVER_URL must be set",
  );
}
export const corsMiddleware = cors({
  origin: [applicationUrl as string, serverUrl as string],
  credentials: true,
});
