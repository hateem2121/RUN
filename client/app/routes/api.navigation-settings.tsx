export async function loader() {
  try {
    const { NavigationService } = await import("../../../server/services/navigation-service.js");
    const result = await NavigationService.getGlassmorphismSettings();

    if (result.isErr()) {
      throw new Response(result.error.message, { status: 500 });
    }

    return result.value;
  } catch (error) {
    console.error("[NavigationSettingsLoader] Error:", error);
    throw new Response("Internal Server Error", { status: 500 });
  }
}
