import { beforeEach, describe, expect, it } from "vitest";
import { AuditLedger, GENESIS_PREV_HASH } from "../../../services/audit/audit-ledger.js";

describe("AUDIT-01: Chained SHA-256 Tamper-Evident Audit Ledger", () => {
  let ledger: AuditLedger;

  beforeEach(() => {
    ledger = new AuditLedger();
    ledger.clear();
  });

  it("should create genesis entry with 64 zero-character prevHash", () => {
    const entry = ledger.recordEvent("admin-1", "PRODUCT_CREATE", "product:101", {
      title: "Seamless Eco Tee",
    });

    expect(entry.index).toBe(0);
    expect(entry.prevHash).toBe(GENESIS_PREV_HASH);
    expect(entry.hash).toHaveLength(64);
    expect(ledger.length).toBe(1);

    const integrity = ledger.verifyLedgerIntegrity();
    expect(integrity.isValid).toBe(true);
  });

  it("should cryptographically chain subsequent events to previous block hashes", () => {
    const e0 = ledger.recordEvent("admin-1", "PRODUCT_CREATE", "product:101");
    const e1 = ledger.recordEvent("admin-2", "CATEGORY_UPDATE", "category:5");
    const e2 = ledger.recordEvent("admin-1", "ORDER_UPDATE", "order:999");

    expect(e1.index).toBe(1);
    expect(e1.prevHash).toBe(e0.hash);

    expect(e2.index).toBe(2);
    expect(e2.prevHash).toBe(e1.hash);

    const integrity = ledger.verifyLedgerIntegrity();
    expect(integrity.isValid).toBe(true);
  });

  it("should detect tampering if payload details are modified in any block", () => {
    ledger.recordEvent("admin-1", "PRODUCT_CREATE", "product:101", { price: 50 });
    const e1 = ledger.recordEvent("admin-1", "PRODUCT_UPDATE", "product:101", { price: 60 });
    ledger.recordEvent("admin-1", "PRODUCT_PUBLISH", "product:101");

    expect(ledger.verifyLedgerIntegrity().isValid).toBe(true);

    // Maliciously tamper with e1 payload without re-hashing
    e1.details = { price: 10 }; // Attacker altered the price in the ledger

    const tamperedCheck = ledger.verifyLedgerIntegrity();
    expect(tamperedCheck.isValid).toBe(false);
    expect(tamperedCheck.corruptedIndex).toBe(1);
    expect(tamperedCheck.error).toContain("Hash mismatch at index 1");
  });

  it("should detect tampering if an action is modified", () => {
    ledger.recordEvent("admin-1", "MEDIA_UPLOAD", "media:1");
    const e1 = ledger.recordEvent("admin-2", "MEDIA_DELETE", "media:1");
    ledger.recordEvent("admin-1", "MEDIA_AUDIT", "media:1");

    // Attacker modifies action from MEDIA_DELETE to MEDIA_VIEW
    e1.action = "MEDIA_VIEW";

    const check = ledger.verifyLedgerIntegrity();
    expect(check.isValid).toBe(false);
    expect(check.corruptedIndex).toBe(1);
  });

  it("should detect tampering if chain link (prevHash) is altered", () => {
    ledger.recordEvent("admin-1", "AUTH_LOGIN", "user:1");
    const e1 = ledger.recordEvent("admin-1", "USER_ROLE_CHANGE", "user:2");

    // Break chain link
    e1.prevHash = "a".repeat(64);

    const check = ledger.verifyLedgerIntegrity();
    expect(check.isValid).toBe(false);
    expect(check.corruptedIndex).toBe(1);
    expect(check.error).toContain("Chain broken at index 1");
  });

  it("should support paginated retrieval of audit events", () => {
    for (let i = 0; i < 25; i++) {
      ledger.recordEvent("admin-1", `ACTION_${i}`, `resource:${i}`);
    }

    expect(ledger.length).toBe(25);

    const page1 = ledger.getEntries(10, 0);
    expect(page1).toHaveLength(10);
    expect(page1[0]?.index).toBe(0);
    expect(page1[9]?.index).toBe(9);

    const page2 = ledger.getEntries(10, 10);
    expect(page2).toHaveLength(10);
    expect(page2[0]?.index).toBe(10);
    expect(page2[9]?.index).toBe(19);

    const page3 = ledger.getEntries(10, 20);
    expect(page3).toHaveLength(5);
    expect(page3[0]?.index).toBe(20);
  });

  it("should maintain integrity under concurrent asynchronous appends", async () => {
    const promises = Array.from({ length: 50 }, (_, i) =>
      ledger.recordEventAsync(`actor-${i}`, "CONCURRENT_ACTION", `res:${i}`, { idx: i }),
    );

    await Promise.all(promises);

    expect(ledger.length).toBe(50);
    const integrity = ledger.verifyLedgerIntegrity();
    expect(integrity.isValid).toBe(true);
  });

  it("should verify 1,000-block cryptographic chain in under 20ms", () => {
    for (let i = 0; i < 1000; i++) {
      ledger.recordEvent(`actor-${i % 5}`, `ACTION_${i}`, `res:${i}`, { count: i });
    }

    const start = performance.now();
    const integrity = ledger.verifyLedgerIntegrity();
    const duration = performance.now() - start;

    expect(integrity.isValid).toBe(true);
    expect(duration).toBeLessThan(20);
  });
});
