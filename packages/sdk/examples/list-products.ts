import { RunCMSClient } from "../src/index.js";

async function main() {
  // Initialize the client
  const client = new RunCMSClient({
    baseUrl: "http://localhost:5002/api",
    apiKey: "your-api-key-here",
  });

  try {
    console.log("Fetching products...");

    // Type-safe products list
    const response = await client.products.list({
      limit: 10,
      active: "true",
    });

    if (response.success) {
      console.log(`Successfully fetched ${response.data.length} products:`);
      response.data.forEach((product: any) => {
        console.log(`- ${product.name} (SKU: ${product.sku})`);
      });
    } else {
      console.error("Failed to fetch products:", response);
    }
  } catch (error: any) {
    if (error.name === "RunCMSError") {
      console.error(`API Error (${error.status}):`, error.message);
      console.error("Details:", error.data);
    } else {
      console.error("Unexpected error:", error);
    }
  }
}

main();
