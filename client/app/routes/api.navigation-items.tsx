export async function loader() {
  try {
    // Dynamic import to avoid including server code in client bundle
    // React Router 7 loaders run on the server in this architecture
    const { NavigationService } = await import("@run-remix/server/services/navigation-service.js");
    const result = await NavigationService.getItems();

    if (result.isErr()) {
      throw new Response(result.error.message, { status: 500 });
    }

    return result.value.data;
  } catch (error) {
    console.error("[NavigationItemsLoader] Error:", error);
    throw new Response("Internal Server Error", { status: 500 });
  }
}
