import { alertManager } from "../server/lib/alert-manager.js";

async function run() {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    process.exit(1);
  }

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
  } catch (_error) {
    process.exit(1);
  }
}

run();
