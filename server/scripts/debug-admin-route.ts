import fetch from "node-fetch";

async function verifyAdminRoute() {
  const url = "http://localhost:5001/api/homepage-process-cards/admin";
  console.log(`Checking Endpoint: ${url}`);

  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);

    const contentType = response.headers.get("content-type");
    console.log(`Content-Type: ${contentType}`);

    if (contentType?.includes("application/json")) {
      const data = await response.json();
      console.log("Response Body:", JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log("Response Text (truncated):", text.substring(0, 500));
    }
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

verifyAdminRoute();
