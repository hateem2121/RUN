/**
 * WEBAUTHN FIDO2 PASSKEYS SERVICE (AUTH-01)
 *
 * Implements W3C WebAuthn Level 3 challenge generation, registration verification,
 * and authentication assertion verification using native `node:crypto`.
 */

import {
  createHash,
  createPublicKey,
  verify as cryptoVerify,
  type KeyObject,
  randomBytes,
} from "node:crypto";
import { logger } from "../../lib/monitoring/logger.js";

// ============================================================================
// Types
// ============================================================================

export interface RegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    alg: number;
    type: string;
  }>;
  timeout: number;
  attestation: string;
}

export interface WebAuthnCredential {
  id: string;
  publicKey: string;
  counter: number;
  transports?: string[] | undefined;
}

export interface VerifyRegistrationParams {
  challenge: string;
  response: {
    id: string;
    rawId: string;
    clientDataJSON: string;
    attestationObject: string;
  };
}

export interface VerifyRegistrationResult {
  verified: boolean;
  credential?: WebAuthnCredential;
}

export interface AuthenticationOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials: Array<{
    id: string;
    type: string;
  }>;
}

export interface VerifyAuthenticationParams {
  challenge: string;
  credential: {
    id: string;
    publicKey: string;
    counter: number;
  };
  response: {
    id: string;
    rawId: string;
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string | undefined;
  };
}

export interface VerifyAuthenticationResult {
  verified: boolean;
  newCounter: number;
}

// ============================================================================
// Minimal Native CBOR Decoder & Encoder (RFC 8949 compliant for WebAuthn)
// ============================================================================

export function decodeCbor(buffer: Buffer, initialOffset = 0): { value: unknown; offset: number } {
  let offset = initialOffset;
  if (offset >= buffer.length) {
    throw new Error("Unexpected end of CBOR buffer");
  }

  const initialByte = buffer[offset];
  if (initialByte === undefined) {
    throw new Error("Unexpected end of CBOR buffer");
  }
  offset += 1;
  const majorType = initialByte >> 5;
  const info = initialByte & 0x1f;

  let length: number;
  if (info < 24) {
    length = info;
  } else if (info === 24) {
    const nextByte = buffer[offset];
    if (nextByte === undefined) {
      throw new Error("Unexpected end of CBOR buffer");
    }
    length = nextByte;
    offset += 1;
  } else if (info === 25) {
    length = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (info === 26) {
    length = buffer.readUInt32BE(offset);
    offset += 4;
  } else if (info === 27) {
    length = Number(buffer.readBigUInt64BE(offset));
    offset += 8;
  } else {
    throw new Error(`Unsupported CBOR additional info: ${info}`);
  }

  switch (majorType) {
    case 0: // Unsigned integer
      return { value: length, offset };
    case 1: // Negative integer
      return { value: -1 - length, offset };
    case 2: {
      // Byte string
      const bytes = buffer.subarray(offset, offset + length);
      return { value: bytes, offset: offset + length };
    }
    case 3: {
      // Text string
      const text = buffer.toString("utf8", offset, offset + length);
      return { value: text, offset: offset + length };
    }
    case 4: {
      // Array
      const arr: unknown[] = [];
      for (let i = 0; i < length; i++) {
        const item = decodeCbor(buffer, offset);
        arr.push(item.value);
        offset = item.offset;
      }
      return { value: arr, offset };
    }
    case 5: {
      // Map (keys can be numbers or strings)
      const map = new Map<unknown, unknown>();
      for (let i = 0; i < length; i++) {
        const keyItem = decodeCbor(buffer, offset);
        offset = keyItem.offset;
        const valItem = decodeCbor(buffer, offset);
        offset = valItem.offset;
        map.set(keyItem.value, valItem.value);
      }
      return { value: map, offset };
    }
    case 6: // Semantic tag
      return decodeCbor(buffer, offset);
    case 7: {
      // Simple values
      if (info === 20) return { value: false, offset };
      if (info === 21) return { value: true, offset };
      if (info === 22) return { value: null, offset };
      if (info === 23) return { value: undefined, offset };
      return { value: undefined, offset };
    }
    default:
      throw new Error(`Unknown CBOR major type: ${majorType}`);
  }
}

export function encodeCbor(value: unknown): Buffer {
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      if (value >= 0) {
        return encodeTypeAndLength(0, value);
      }
      return encodeTypeAndLength(1, -1 - value);
    }
    const buf = Buffer.alloc(9);
    buf[0] = (7 << 5) | 27;
    buf.writeDoubleBE(value, 1);
    return buf;
  }

  if (Buffer.isBuffer(value)) {
    return Buffer.concat([encodeTypeAndLength(2, value.length), value]);
  }

  if (typeof value === "string") {
    const strBuf = Buffer.from(value, "utf8");
    return Buffer.concat([encodeTypeAndLength(3, strBuf.length), strBuf]);
  }

  if (Array.isArray(value)) {
    const parts = [encodeTypeAndLength(4, value.length)];
    for (const item of value) {
      parts.push(encodeCbor(item));
    }
    return Buffer.concat(parts);
  }

  if (value instanceof Map) {
    const parts = [encodeTypeAndLength(5, value.size)];
    for (const [k, v] of value.entries()) {
      parts.push(encodeCbor(k));
      parts.push(encodeCbor(v));
    }
    return Buffer.concat(parts);
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value);
    const parts = [encodeTypeAndLength(5, entries.length)];
    for (const [k, v] of entries) {
      parts.push(encodeCbor(k));
      parts.push(encodeCbor(v));
    }
    return Buffer.concat(parts);
  }

  if (typeof value === "boolean") {
    return Buffer.from([(7 << 5) | (value ? 21 : 20)]);
  }

  if (value === null) {
    return Buffer.from([(7 << 5) | 22]);
  }

  return Buffer.from([(7 << 5) | 23]);
}

function encodeTypeAndLength(majorType: number, length: number): Buffer {
  const typeByte = majorType << 5;
  if (length < 24) {
    return Buffer.from([typeByte | length]);
  }
  if (length < 256) {
    return Buffer.from([typeByte | 24, length]);
  }
  if (length < 65536) {
    const buf = Buffer.alloc(3);
    buf[0] = typeByte | 25;
    buf.writeUInt16BE(length, 1);
    return buf;
  }
  const buf = Buffer.alloc(5);
  buf[0] = typeByte | 26;
  buf.writeUInt32BE(length, 1);
  return buf;
}

// ============================================================================
// Service Implementation
// ============================================================================

export class WebAuthnService {
  private rpName = "RUN APPAREL";
  private defaultRpId = process.env.WEBAUTHN_RP_ID || "localhost";
  private userCredentials = new Map<string, WebAuthnCredential[]>();

  public getRpId(): string {
    return process.env.WEBAUTHN_RP_ID || this.defaultRpId;
  }

  public setRpId(rpId: string): void {
    this.defaultRpId = rpId;
  }

  /**
   * Generates W3C WebAuthn Level 3 registration options
   */
  public generateRegistrationOptions(
    userId: string,
    username: string,
    displayName: string,
  ): RegistrationOptions {
    const challenge = randomBytes(32).toString("base64url");
    const userHandle = Buffer.from(userId, "utf8").toString("base64url");

    return {
      challenge,
      rp: {
        name: this.rpName,
        id: this.getRpId(),
      },
      user: {
        id: userHandle,
        name: username,
        displayName: displayName || username,
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256 (P-256)
        { alg: -257, type: "public-key" }, // RS256
      ],
      timeout: 60000,
      attestation: "none",
    };
  }

  /**
   * Verifies registration response and extracts public key credential
   */
  public async verifyRegistrationResponse(
    params: VerifyRegistrationParams,
  ): Promise<VerifyRegistrationResult> {
    try {
      const { challenge, response } = params;

      // 1. Decode and verify clientDataJSON
      const clientDataBuffer = this.toBuffer(response.clientDataJSON);
      const clientDataStr = clientDataBuffer.toString("utf8");
      const clientData = JSON.parse(clientDataStr) as {
        type?: string;
        challenge?: string;
        origin?: string;
      };

      if (clientData.type !== "webauthn.create") {
        logger.warn("[WebAuthn] Invalid clientData.type for registration", {
          type: clientData.type,
        });
        return { verified: false };
      }

      if (clientData.challenge !== challenge) {
        logger.warn("[WebAuthn] Challenge mismatch during registration");
        return { verified: false };
      }

      // 2. Decode and parse attestationObject
      const attestationBuffer = this.toBuffer(response.attestationObject);
      const decodedCbor = decodeCbor(attestationBuffer).value;

      let authData: Buffer;
      if (decodedCbor instanceof Map) {
        const extractedAuthData = decodedCbor.get("authData");
        if (!Buffer.isBuffer(extractedAuthData)) {
          logger.warn("[WebAuthn] attestationObject missing binary authData");
          return { verified: false };
        }
        authData = extractedAuthData;
      } else if (Buffer.isBuffer(decodedCbor)) {
        authData = decodedCbor;
      } else {
        logger.warn("[WebAuthn] Invalid attestationObject structure");
        return { verified: false };
      }

      // 3. Verify authenticator data
      if (authData.length < 55) {
        logger.warn("[WebAuthn] authData buffer too short for attested credential");
        return { verified: false };
      }

      const flags = authData[32];
      if (flags === undefined) {
        return { verified: false };
      }
      const up = (flags & 0x01) !== 0; // User Present
      const at = (flags & 0x40) !== 0; // Attested Credential Data Present

      if (!up || !at) {
        logger.warn("[WebAuthn] UP or AT flag missing in registration authData", {
          up,
          at,
        });
        return { verified: false };
      }

      const counter = authData.readUInt32BE(33);

      // 4. Extract Attested Credential Data
      const credentialIdLength = authData.readUInt16BE(53);
      const credentialIdEnd = 55 + credentialIdLength;

      if (authData.length < credentialIdEnd) {
        logger.warn("[WebAuthn] authData truncated before credential ID ended");
        return { verified: false };
      }

      const credentialIdBuffer = authData.subarray(55, credentialIdEnd);
      const credentialId = response.id || credentialIdBuffer.toString("base64url");

      // 5. Extract and parse COSE public key
      const coseKeyResult = decodeCbor(authData, credentialIdEnd);
      const coseKey = coseKeyResult.value;

      if (!(coseKey instanceof Map)) {
        logger.warn("[WebAuthn] COSE key is not a valid CBOR map");
        return { verified: false };
      }

      const pemPublicKey = this.convertCoseKeyToPem(coseKey);
      if (!pemPublicKey) {
        logger.warn("[WebAuthn] Failed to convert COSE key to PEM format");
        return { verified: false };
      }

      return {
        verified: true,
        credential: {
          id: credentialId,
          publicKey: pemPublicKey,
          counter,
          transports: undefined,
        },
      };
    } catch (error) {
      logger.error("[WebAuthn] Registration verification error:", error);
      return { verified: false };
    }
  }

  /**
   * Generates W3C WebAuthn Level 3 authentication assertion options
   */
  public generateAuthenticationOptions(credentials?: Array<{ id: string }>): AuthenticationOptions {
    const challenge = randomBytes(32).toString("base64url");

    return {
      challenge,
      timeout: 60000,
      rpId: this.getRpId(),
      allowCredentials: (credentials || []).map((cred) => ({
        id: cred.id,
        type: "public-key",
      })),
    };
  }

  /**
   * Verifies authentication assertion response
   */
  public async verifyAuthenticationResponse(
    params: VerifyAuthenticationParams,
  ): Promise<VerifyAuthenticationResult> {
    try {
      const { challenge, credential, response } = params;

      // 1. Verify credential ID match
      if (response.id !== credential.id && response.rawId !== credential.id) {
        logger.warn("[WebAuthn] Assertion response ID does not match credential ID");
        return { verified: false, newCounter: credential.counter };
      }

      // 2. Decode and verify clientDataJSON
      const clientDataBuffer = this.toBuffer(response.clientDataJSON);
      const clientDataStr = clientDataBuffer.toString("utf8");
      const clientData = JSON.parse(clientDataStr) as {
        type?: string;
        challenge?: string;
        origin?: string;
      };

      if (clientData.type !== "webauthn.get") {
        logger.warn("[WebAuthn] Invalid clientData.type for authentication assertion", {
          type: clientData.type,
        });
        return { verified: false, newCounter: credential.counter };
      }

      if (clientData.challenge !== challenge) {
        logger.warn("[WebAuthn] Challenge mismatch during authentication assertion");
        return { verified: false, newCounter: credential.counter };
      }

      // 3. Decode authenticatorData
      const authData = this.toBuffer(response.authenticatorData);
      if (authData.length < 37) {
        logger.warn("[WebAuthn] authData buffer too short for assertion");
        return { verified: false, newCounter: credential.counter };
      }

      const flags = authData[32];
      if (flags === undefined) {
        return { verified: false, newCounter: credential.counter };
      }
      const up = (flags & 0x01) !== 0; // User Present
      if (!up) {
        logger.warn("[WebAuthn] User Present (UP) flag not set in assertion authData");
        return { verified: false, newCounter: credential.counter };
      }

      const newCounter = authData.readUInt32BE(33);

      // Replay / cloned authenticator protection
      if (credential.counter > 0 && newCounter > 0 && newCounter <= credential.counter) {
        logger.warn("[WebAuthn] Counter rollback or replay detected", {
          storedCounter: credential.counter,
          receivedCounter: newCounter,
        });
        return { verified: false, newCounter: credential.counter };
      }

      // 4. Verify cryptographic signature
      const clientDataHash = createHash("sha256").update(clientDataBuffer).digest();
      const signedData = Buffer.concat([authData, clientDataHash]);
      const signatureBuffer = this.toBuffer(response.signature);

      const pubKeyObject = this.parsePublicKey(credential.publicKey);
      if (!pubKeyObject) {
        logger.error("[WebAuthn] Unable to parse stored public key");
        return { verified: false, newCounter: credential.counter };
      }

      const isSignatureValid = this.verifySignatureWithFallback(
        signedData,
        pubKeyObject,
        signatureBuffer,
      );

      if (!isSignatureValid) {
        logger.warn("[WebAuthn] Assertion signature verification failed");
        return { verified: false, newCounter: credential.counter };
      }

      return {
        verified: true,
        newCounter: newCounter > credential.counter ? newCounter : credential.counter + 1,
      };
    } catch (error) {
      logger.error("[WebAuthn] Authentication verification error:", error);
      return { verified: false, newCounter: params.credential.counter };
    }
  }

  // ==========================================================================
  // Credential Repository Helpers
  // ==========================================================================

  public saveUserCredential(userId: string, credential: WebAuthnCredential): void {
    const existing = this.userCredentials.get(userId) || [];
    const filtered = existing.filter((c) => c.id !== credential.id);
    filtered.push(credential);
    this.userCredentials.set(userId, filtered);
  }

  public getUserCredentials(userId: string): WebAuthnCredential[] {
    return this.userCredentials.get(userId) || [];
  }

  public getCredentialById(id: string): WebAuthnCredential | undefined {
    for (const credentials of this.userCredentials.values()) {
      const match = credentials.find((c) => c.id === id);
      if (match) return match;
    }
    return undefined;
  }

  public updateCredentialCounter(id: string, newCounter: number): void {
    for (const credentials of this.userCredentials.values()) {
      const match = credentials.find((c) => c.id === id);
      if (match) {
        match.counter = newCounter;
        return;
      }
    }
  }

  // ==========================================================================
  // Internal Cryptographic Helpers
  // ==========================================================================

  private toBuffer(val: string | Buffer): Buffer {
    if (Buffer.isBuffer(val)) return val;
    if (typeof val === "string") {
      // Check if it is a JSON string or raw text
      if (val.trim().startsWith("{") || val.trim().startsWith("[")) {
        return Buffer.from(val, "utf8");
      }
      // Try base64url decode
      try {
        return Buffer.from(val, "base64url");
      } catch {
        return Buffer.from(val, "base64");
      }
    }
    return Buffer.from(String(val));
  }

  private convertCoseKeyToPem(coseKey: Map<unknown, unknown>): string | null {
    try {
      const kty = coseKey.get(1); // 1 = Key Type (2 = EC2, 3 = RSA)

      if (kty === 2) {
        // EC2 Key (P-256 / ES256)
        const x = coseKey.get(-2);
        const y = coseKey.get(-3);

        if (!Buffer.isBuffer(x) || !Buffer.isBuffer(y)) {
          return null;
        }

        const jwk = {
          kty: "EC",
          crv: "P-256",
          x: x.toString("base64url"),
          y: y.toString("base64url"),
        };

        const key = createPublicKey({ key: jwk, format: "jwk" });
        return key.export({ type: "spki", format: "pem" }).toString();
      }

      if (kty === 3) {
        // RSA Key (RS256)
        const n = coseKey.get(-1);
        const e = coseKey.get(-2);

        if (!Buffer.isBuffer(n) || !Buffer.isBuffer(e)) {
          return null;
        }

        const jwk = {
          kty: "RSA",
          n: n.toString("base64url"),
          e: e.toString("base64url"),
        };

        const key = createPublicKey({ key: jwk, format: "jwk" });
        return key.export({ type: "spki", format: "pem" }).toString();
      }

      return null;
    } catch (error) {
      logger.error("[WebAuthn] Failed to convert COSE key to PEM:", error);
      return null;
    }
  }

  private parsePublicKey(keyString: string): KeyObject | null {
    try {
      if (keyString.includes("BEGIN PUBLIC KEY")) {
        return createPublicKey(keyString);
      }
      if (keyString.trim().startsWith("{")) {
        const jwk = JSON.parse(keyString);
        return createPublicKey({ key: jwk, format: "jwk" });
      }
      return createPublicKey({
        key: Buffer.from(keyString, "base64url"),
        format: "der",
        type: "spki",
      });
    } catch (error) {
      logger.error("[WebAuthn] KeyObject creation error:", error);
      return null;
    }
  }

  private verifySignatureWithFallback(
    signedData: Buffer,
    pubKey: KeyObject,
    signature: Buffer,
  ): boolean {
    // 1. Standard DER verification
    try {
      if (cryptoVerify("sha256", signedData, pubKey, signature)) {
        return true;
      }
    } catch {
      // Signature might be IEEE P1363 encoded
    }

    // 2. IEEE P1363 fallback verification
    try {
      const hash = createHash("sha256").update(signedData).digest();
      if (
        cryptoVerify(
          null,
          hash,
          {
            key: pubKey,
            dsaEncoding: "ieee-p1363",
          },
          signature,
        )
      ) {
        return true;
      }
    } catch {
      // Failed both formats
    }

    return false;
  }
}

export const webauthnService = new WebAuthnService();
