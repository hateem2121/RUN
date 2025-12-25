async function verifyAdminRoute() {
  const url = "http://localhost:5001/api/homepage-process-cards/admin";

  try {
    const response = await fetch(url);

    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const _data = await response.json();
    } else {
      const _text = await response.text();
    }
  } catch (_error) {}
}

verifyAdminRoute();
