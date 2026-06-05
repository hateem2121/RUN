import { productRepository } from "./server/lib/db/repositories/index.js";

async function main() {
  const result = await productRepository.getCategoryBySlug("athletic-wear");
  console.log("Result:", result);
  process.exit(0);
}
main();
