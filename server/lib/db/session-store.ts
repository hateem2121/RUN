import { Store, type SessionData } from "express-session";
import { db } from "../../db.js";
import { sessions } from "@run-remix/shared";
import { eq } from "drizzle-orm";
import { ResultAsync } from "neverthrow";
import { logger } from "../monitoring/logger.js";

export class DrizzleSessionStore extends Store {
  constructor() {
    super();
  }

  public override get(sid: string, callback: (err: any, session?: SessionData | null) => void): void {
    ResultAsync.fromPromise(
      db.select().from(sessions).where(eq(sessions.sid, sid)),
      (error) => error as Error
    )
      .map((rows) => {
        if (rows.length === 0) return null;
        const record = rows[0];
        if (!record) return null;
        if (new Date() > new Date(record.expire)) {
          return null; // Expired
        }
        return record.sess as unknown as SessionData;
      })
      .match(
        (sess) => callback(null, sess),
        (error) => {
          logger.error("[DrizzleSessionStore] get error:", error);
          callback(error);
        }
      );
  }

  public override set(sid: string, sessionData: SessionData, callback?: (err?: any) => void): void {
    let expire: Date;
    if (sessionData.cookie && sessionData.cookie.expires) {
      expire = new Date(sessionData.cookie.expires as any);
    } else {
      expire = new Date(Date.now() + 604800000); // 1 week fallback
    }

    ResultAsync.fromPromise(
      db
        .insert(sessions)
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
        }),
      (error) => error as Error
    ).match(
      () => callback?.(),
      (error) => {
        logger.error("[DrizzleSessionStore] set error:", error);
        callback?.(error);
      }
    );
  }

  public override destroy(sid: string, callback?: (err?: any) => void): void {
    ResultAsync.fromPromise(
      db.delete(sessions).where(eq(sessions.sid, sid)),
      (error) => error as Error
    ).match(
      () => callback?.(),
      (error) => {
        logger.error("[DrizzleSessionStore] destroy error:", error);
        callback?.(error);
      }
    );
  }

  public override touch(sid: string, sessionData: SessionData, callback?: (err?: any) => void): void {
    let expire: Date;
    if (sessionData.cookie && sessionData.cookie.expires) {
      expire = new Date(sessionData.cookie.expires as any);
    } else {
      expire = new Date(Date.now() + 604800000);
    }

    ResultAsync.fromPromise(
      db
        .update(sessions)
        .set({ expire })
        .where(eq(sessions.sid, sid)),
      (error) => error as Error
    ).match(
      () => callback?.(),
      (error) => {
        logger.error("[DrizzleSessionStore] touch error:", error);
        callback?.(error);
      }
    );
  }
}
