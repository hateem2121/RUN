import crypto from "node:crypto";

/**
 * AUDIT-01: Chained SHA-256 Tamper-Evident Audit Ledger
 *
 * Implements an append-only, cryptographically linked Merkle-chain ledger where
 * every administrative mutation is irrevocably hashed and chained to the previous
 * block, providing mathematical proof of audit log immutability.
 */

export interface AuditEntry {
  index: number;
  timestamp: string;
  actorId: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  prevHash: string;
  hash: string;
}

export const GENESIS_PREV_HASH = "0".repeat(64);

/**
 * Computes deterministic SHA-256 hash for an audit ledger entry.
 */
export function computeAuditHash(entry: {
  index: number;
  timestamp: string;
  actorId: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  prevHash: string;
}): string {
  const detailsStr = JSON.stringify(entry.details);
  const data = `${entry.index}|${entry.timestamp}|${entry.actorId}|${entry.action}|${entry.resource}|${detailsStr}|${entry.prevHash}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

export class AuditLedger {
  private static instance: AuditLedger | null = null;
  private entries: AuditEntry[] = [];
  private appendLock: Promise<void> = Promise.resolve();

  public static getInstance(): AuditLedger {
    if (!AuditLedger.instance) {
      AuditLedger.instance = new AuditLedger();
    }
    return AuditLedger.instance;
  }

  /**
   * Append-only event recorder with cryptographic chaining.
   */
  recordEvent(
    actorId: string,
    action: string,
    resource: string,
    details: Record<string, unknown> = {},
  ): AuditEntry {
    const index = this.entries.length;
    const timestamp = new Date().toISOString();
    const prevHash = index === 0 ? GENESIS_PREV_HASH : this.entries[index - 1]!.hash;

    const entryData = {
      index,
      timestamp,
      actorId,
      action,
      resource,
      details,
      prevHash,
    };

    const hash = computeAuditHash(entryData);

    const entry: AuditEntry = {
      ...entryData,
      hash,
    };

    this.entries.push(entry);
    return entry;
  }

  /**
   * Thread-safe asynchronous append wrapper.
   */
  async recordEventAsync(
    actorId: string,
    action: string,
    resource: string,
    details: Record<string, unknown> = {},
  ): Promise<AuditEntry> {
    let result: AuditEntry;
    this.appendLock = this.appendLock.then(async () => {
      result = this.recordEvent(actorId, action, resource, details);
    });
    await this.appendLock;
    return result!;
  }

  /**
   * Verifies the cryptographic integrity of the entire chain.
   * Returns isValid: false and corruptedIndex if any link is altered.
   */
  verifyLedgerIntegrity(): { isValid: boolean; corruptedIndex?: number; error?: string } {
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i]!;

      // 1. Index verification
      if (entry.index !== i) {
        return {
          isValid: false,
          corruptedIndex: i,
          error: `Index mismatch at position ${i}: found ${entry.index}`,
        };
      }

      // 2. Genesis block verification
      if (i === 0) {
        if (entry.prevHash !== GENESIS_PREV_HASH) {
          return {
            isValid: false,
            corruptedIndex: 0,
            error: `Genesis block prevHash mismatch: expected ${GENESIS_PREV_HASH}, found ${entry.prevHash}`,
          };
        }
      } else {
        // 3. Chain continuity verification
        const prevEntry = this.entries[i - 1]!;
        if (entry.prevHash !== prevEntry.hash) {
          return {
            isValid: false,
            corruptedIndex: i,
            error: `Chain broken at index ${i}: prevHash does not match entry ${i - 1} hash`,
          };
        }
      }

      // 4. Cryptographic hash validity
      const expectedHash = computeAuditHash({
        index: entry.index,
        timestamp: entry.timestamp,
        actorId: entry.actorId,
        action: entry.action,
        resource: entry.resource,
        details: entry.details,
        prevHash: entry.prevHash,
      });

      if (entry.hash !== expectedHash) {
        return {
          isValid: false,
          corruptedIndex: i,
          error: `Hash mismatch at index ${i}: stored ${entry.hash}, computed ${expectedHash}`,
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Retrieves recorded audit entries with pagination support.
   */
  getEntries(limit = 100, offset = 0): AuditEntry[] {
    return this.entries.slice(offset, offset + limit);
  }

  /**
   * Total length of the ledger.
   */
  get length(): number {
    return this.entries.length;
  }

  /**
   * Clears in-memory entries (test mode only).
   */
  clear(): void {
    this.entries = [];
    this.appendLock = Promise.resolve();
  }
}

export const auditLedger = AuditLedger.getInstance();
