import { alertManager } from "../server/lib/alert-manager";

async function run() {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;

  console.log("🔍 Checking Alert Config...");
  if (!webhookUrl) {
    console.error("❌ ALERT_WEBHOOK_URL is missing. Please set it to test notifications.");
    process.exit(1);
  }
  console.log(`✅ ALERT_WEBHOOK_URL found: ${webhookUrl.substring(0, 10)}...`);

  console.log("\n🚀 Sending Test Alert...");

  // Hack to access private method for testing verification
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const manager = alertManager as any;

  try {
    // Manually trigger the notification logic
    await manager.sendWebhookNotification({
      id: `test_${Date.now()}`,
      type: "manual_verification",
      severity: "critical",
      message: "This is a test alert to verify the Phase 0 Safety Net webhook.",
      timestamp: new Date().toISOString(),
      details: {
        info: "If you see this, the notification pipeline is working!",
        environment: process.env.NODE_ENV || "development",
        timestamp: Date.now(),
      },
    });

    console.log("✅ Webhook request completed successfully!");
    console.log("👉 Check your Slack/Discord channel for the message.");
  } catch (error) {
    console.error("❌ Webhook request failed:", error);
    process.exit(1);
  }
}

run();
