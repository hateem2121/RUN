import { sessions } from "@run-remix/shared";
import { eq } from "drizzle-orm";
import { type SessionData, Store } from "express-session";
import { ResultAsync } from "neverthrow";
import { db } from "../../db.js";
import { logger } from "../monitoring/logger.js";

export class DrizzleSessionStore extends Store {
  public override get(
    sid: string,
    callback: (err: unknown, session?: SessionData | null) => void,
  ): ResultAsync<SessionData | null, Error> {
    const result = ResultAsync.fromPromise(
      db.select().from(sessions).where(eq(sessions.sid, sid)),
      (error) => error as Error,
    ).map((rows) => {
      if (rows.length === 0) return null;
      const record = rows[0];
      if (!record) return null;
      if (new Date() > new Date(record.expire)) {
        return null; // Expired
      }
      return record.sess as unknown as SessionData;
    });

    result.match(
      (sess) => callback(null, sess),
      (error) => {
        logger.error("[DrizzleSessionStore] get error:", error);
        callback(error);
      },
    );
    return result;
  }

  public override set(
    sid: string,
    sessionData: SessionData,
    callback?: (err?: unknown) => void,
  ): ResultAsync<void, Error> {
    let expire: Date;
    if (sessionData.cookie?.expires) {
      expire = new Date(sessionData.cookie.expires as string | number | Date);
    } else {
      expire = new Date(Date.now() + 604800000); // 1 week fallback
    }

    const result = ResultAsync.fromPromise(
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
      (error) => error as Error,
    ).map(() => undefined);

    result.match(
      () => callback?.(),
      (error) => {
        logger.error("[DrizzleSessionStore] set error:", error);
        callback?.(error);
      },
    );
    return result;
  }

  public override destroy(
    sid: string,
    callback?: (err?: unknown) => void,
  ): ResultAsync<void, Error> {
    const result = ResultAsync.fromPromise(
      db.delete(sessions).where(eq(sessions.sid, sid)),
      (error) => error as Error,
    ).map(() => undefined);

    result.match(
      () => callback?.(),
      (error) => {
        logger.error("[DrizzleSessionStore] destroy error:", error);
        callback?.(error);
      },
    );
    return result;
  }

  public override touch(
    sid: string,
    sessionData: SessionData,
    callback?: (err?: unknown) => void,
  ): ResultAsync<void, Error> {
    let expire: Date;
    if (sessionData.cookie?.expires) {
      expire = new Date(sessionData.cookie.expires as string | number | Date);
    } else {
      expire = new Date(Date.now() + 604800000);
    }

    const result = ResultAsync.fromPromise(
      db.update(sessions).set({ expire }).where(eq(sessions.sid, sid)),
      (error) => error as Error,
    ).map(() => undefined);

    result.match(
      () => callback?.(),
      (error) => {
        logger.error("[DrizzleSessionStore] touch error:", error);
        callback?.(error);
      },
    );
    return result;
  }
}
