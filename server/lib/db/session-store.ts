import { sessions } from "@run-remix/shared";
import { eq } from "drizzle-orm";
import { type SessionData, Store } from "express-session";
import { db } from "../../db.js";
import { logger } from "../monitoring/logger.js";

// In-memory store for test/E2E environments where DB may not be available
const memoryStore = new Map<string, { sess: SessionData; expire: Date }>();

export class DrizzleSessionStore extends Store {
  private useMemoryStore = process.env.E2E === "true" || process.env.VITEST === "true" || process.env.NODE_ENV === "test";
  
  public override get(
    sid: string,
    callback: (err: unknown, session?: SessionData | null) => void,
  ): void {
    if (this.useMemoryStore) {
      const record = memoryStore.get(sid);
      if (!record || new Date() > record.expire) {
        memoryStore.delete(sid);
        callback(null, null);
        return;
      }
      callback(null, record.sess);
      return;
    }

    db.select().from(sessions).where(eq(sessions.sid, sid))
      .then((rows) => {
        if (rows.length === 0) {
          callback(null, null);
          return;
        }
        const record = rows[0];
        if (!record || new Date() > new Date(record.expire)) {
          callback(null, null);
          return;
        }
        callback(null, record.sess as unknown as SessionData);
      })
      .catch((error) => {
        logger.error("[DrizzleSessionStore] get error:", error);
        callback(error);
      });
  }

  public override set(
    sid: string,
    sessionData: SessionData,
    callback?: (err?: unknown) => void,
  ): void {
    let expire: Date;
    if (sessionData.cookie?.expires) {
      expire = new Date(sessionData.cookie.expires as string | number | Date);
    } else {
      expire = new Date(Date.now() + 604800000); // 1 week fallback
    }

    if (this.useMemoryStore) {
      memoryStore.set(sid, { sess: sessionData, expire });
      callback?.();
      return;
    }

    db.insert(sessions)
      .values({
        sid,
        sess: sessionData,
        expire,
      })
      .onConflictDoUpdate({
        target: sessions.sid,
        set: {
          sess: sessionData,
          expire,
        },
      })
      .then(() => callback?.())
      .catch((error) => {
        logger.error("[DrizzleSessionStore] set error:", error);
        callback?.(error);
      });
  }

  public override destroy(
    sid: string,
    callback?: (err?: unknown) => void,
  ): void {
    if (this.useMemoryStore) {
      memoryStore.delete(sid);
      callback?.();
      return;
    }

    db.delete(sessions).where(eq(sessions.sid, sid))
      .then(() => callback?.())
      .catch((error) => {
        logger.error("[DrizzleSessionStore] destroy error:", error);
        callback?.(error);
      });
  }

  public override touch(
    sid: string,
    sessionData: SessionData,
    callback?: (err?: unknown) => void,
  ): void {
    let expire: Date;
    if (sessionData.cookie?.expires) {
      expire = new Date(sessionData.cookie.expires as string | number | Date);
    } else {
      expire = new Date(Date.now() + 604800000);
    }

    if (this.useMemoryStore) {
      const record = memoryStore.get(sid);
      if (record) {
        memoryStore.set(sid, { sess: sessionData, expire });
      }
      callback?.();
      return;
    }

    db.update(sessions).set({ expire }).where(eq(sessions.sid, sid))
      .then(() => callback?.())
      .catch((error) => {
        logger.error("[DrizzleSessionStore] touch error:", error);
        callback?.(error);
      });
  }
}
