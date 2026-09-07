import crypto from "node:crypto";

export interface DppPayload {
  dppId?: string;
  productId: number;
  sku: string;
  brand?: string;
  facility?: string;
  fiberComposition: Record<string, number>;
  recycledContentPercent: number;
  certifications: string[];
  carbonFootprintKgCO2e: number;
  waterUsageLiters: number;
  circularityScore: number;
  repairabilityScore: number;
  qrPayloadUrl?: string;
  batch?: string;
  issuedAt?: string;
}

export interface DigitalProductPassport {
  dppId: string;
  productId: number;
  sku: string;
  brand: string;
  facility: string;
  fiberComposition: Record<string, number>;
  recycledContentPercent: number;
  certifications: string[];
  carbonFootprintKgCO2e: number;
  waterUsageLiters: number;
  circularityScore: number;
  repairabilityScore: number;
  qrPayloadUrl: string;
  signature: string;
  issuedAt: string;
}

export interface Ed25519KeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Generates an Ed25519 keypair for cryptographic passport signing and verification.
 */
export function generateEd25519KeyPair(): Ed25519KeyPair {
  return crypto.generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
}

/**
 * Deterministically stringifies an object following the JSON Canonicalization Scheme (RFC 8785).
 * Object keys are recursively sorted alphabetically to ensure cross-platform cryptographic determinism.
 */
export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const entries = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalStringify(record[key])}`,
  );
  return `{${entries.join(",")}}`;
}

/**
 * Signs a Digital Product Passport payload using Ed25519.
 * Computes canonical representation of the passport (excluding the signature) before signing.
 *
 * @param payload DPP payload parameters
 * @param privateKey Ed25519 private key (PEM string or KeyObject)
 * @returns Fully signed DigitalProductPassport compliant with EU ESPR
 */
export function signPassport(
  payload: DppPayload,
  privateKey: crypto.KeyObject | string,
): DigitalProductPassport {
  const batch = payload.batch ?? "2026-B1";
  const skuSlug = payload.sku.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const dppId = payload.dppId ?? `urn:dpp:run-apparel:${skuSlug}:${batch}`;
  const brand = payload.brand ?? "RUN APPAREL";
  const facility = payload.facility ?? "RUN APPAREL (PVT) LTD, Sialkot, Pakistan";
  const qrPayloadUrl =
    payload.qrPayloadUrl ?? `https://wear-run.com/dpp/${encodeURIComponent(dppId)}`;
  const issuedAt = payload.issuedAt ?? new Date().toISOString();

  const passportData: Omit<DigitalProductPassport, "signature"> = {
    dppId,
    productId: payload.productId,
    sku: payload.sku,
    brand,
    facility,
    fiberComposition: payload.fiberComposition,
    recycledContentPercent: payload.recycledContentPercent,
    certifications: payload.certifications,
    carbonFootprintKgCO2e: payload.carbonFootprintKgCO2e,
    waterUsageLiters: payload.waterUsageLiters,
    circularityScore: payload.circularityScore,
    repairabilityScore: payload.repairabilityScore,
    qrPayloadUrl,
    issuedAt,
  };

  const canonicalJson = canonicalStringify(passportData);
  const signatureBuffer = crypto.sign(null, Buffer.from(canonicalJson, "utf-8"), privateKey);
  const signature = signatureBuffer.toString("base64");

  return {
    ...passportData,
    signature,
  };
}

/**
 * Verifies the Ed25519 signature of a Digital Product Passport.
 *
 * @param passport Complete DigitalProductPassport with signature
 * @param publicKey Ed25519 public key (PEM string or KeyObject)
 * @returns true if signature is valid and payload untampered, false otherwise
 */
export function verifyPassportSignature(
  passport: DigitalProductPassport,
  publicKey: crypto.KeyObject | string,
): boolean {
  try {
    if (!passport || typeof passport !== "object" || !passport.signature) {
      return false;
    }

    const { signature, ...signablePayload } = passport;
    const canonicalJson = canonicalStringify(signablePayload);

    // Support both base64 and hex encoding for signature
    const signatureBuffer =
      /^[0-9a-fA-F]+$/.test(signature) && signature.length === 128
        ? Buffer.from(signature, "hex")
        : Buffer.from(signature, "base64");

    return crypto.verify(null, Buffer.from(canonicalJson, "utf-8"), publicKey, signatureBuffer);
  } catch {
    return false;
  }
}
