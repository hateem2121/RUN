import type { User } from "@run-remix/shared";

export interface SessionUser extends User {
  claims: {
    email: string | null;
    sub: string;
    isMock?: boolean;
  };
}

declare global {
  namespace Express {
    interface User extends SessionUser {}
    interface Request {
      user?: SessionUser;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    passport?: { user: SessionUser };
    uaHash?: string;
    lastRotated?: number;
  }
}
