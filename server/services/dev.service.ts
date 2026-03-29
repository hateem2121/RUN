import * as devQueries from "../db/queries/dev.queries.js";

export async function getMockAdminUser(email: string) {
  return devQueries.getAdminUserByEmail(email);
}
