export const SESSION_COOKIE_NAME = "session_id";

export const SESSION_COOKIE_OPTIONS = {
  // prevent a cross-site scripting attack
  httpOnly: true,
  // prevent CSRF attacks
  sameSite: "Lax" as const,
  path: "/",
  // For production with SSL
  secure: process.env.NODE_ENV === "production"
};

export const SESSION_CONTEXT_KEY = "session";

export const INITIAL_CREDITS = 10;
