/**
 * Vitest setup: set env vars required by app (e.g. CORS) so tests can run without .env
 */
process.env.NEXT_PUBLIC_APPLICATION_URL =
  process.env.NEXT_PUBLIC_APPLICATION_URL || "http://localhost:3000";
process.env.NEXT_PUBLIC_SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";
