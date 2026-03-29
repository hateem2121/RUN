import * as debugQueries from "../db/queries/debug.queries.js";

export async function triggerSlowQuery(duration: number) {
  await debugQueries.executeSlowQuery(duration);
}
