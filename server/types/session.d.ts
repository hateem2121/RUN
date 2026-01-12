import "express-session";

declare module "express-session" {
  interface SessionData {
    passport?: { user: unknown } | undefined;
    uaHash?: string | undefined;
    lastRotated?: number | undefined;
  }
}
