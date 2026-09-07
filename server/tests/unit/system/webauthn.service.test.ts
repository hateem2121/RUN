import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  decodeCbor,
  encodeCbor,
  WebAuthnService,
  webauthnService,
} from "../../../services/system/webauthn.service.js";

describe("WebAuthnService (AUTH-01)", () => {
  let service: WebAuthnService;

  beforeEach(() => {
    service = new WebAuthnService();
  });

  describe("CBOR Encoder / Decoder", () => {
    it("should roundtrip integers, strings, buffers, arrays, and maps", () => {
      const map = new Map<unknown, unknown>();
      map.set(1, 2); // kty: 2
      map.set(3, -7); // alg: -7
      map.set(-1, 1); // crv: 1
      map.set("name", "RUN APPAREL");
      map.set("active", true);
      map.set("raw", Buffer.from([0xaa, 0xbb, 0xcc]));

      const encoded = encodeCbor(map);
      expect(Buffer.isBuffer(encoded)).toBe(true);

      const decoded = decodeCbor(encoded).value;
      expect(decoded instanceof Map).toBe(true);
      const decodedMap = decoded as Map<unknown, unknown>;

      expect(decodedMap.get(1)).toBe(2);
      expect(decodedMap.get(3)).toBe(-7);
      expect(decodedMap.get(-1)).toBe(1);
      expect(decodedMap.get("name")).toBe("RUN APPAREL");
      expect(decodedMap.get("active")).toBe(true);
      expect(Buffer.isBuffer(decodedMap.get("raw"))).toBe(true);
      expect((decodedMap.get("raw") as Buffer).toString("hex")).toBe("aabbcc");
    });
  });

  describe("generateRegistrationOptions", () => {
    it("should generate valid W3C WebAuthn Level 3 registration options", () => {
      const options = service.generateRegistrationOptions(
        "user_123",
        "factory@wear-run.com",
        "Factory Operations",
      );

      expect(options).toHaveProperty("challenge");
      expect(typeof options.challenge).toBe("string");
      expect(options.challenge.length).toBeGreaterThanOrEqual(32);

      expect(options.rp.name).toBe("RUN APPAREL");
      expect(options.rp.id).toBeDefined();

      expect(options.user.name).toBe("factory@wear-run.com");
      expect(options.user.displayName).toBe("Factory Operations");

      expect(options.pubKeyCredParams).toEqual([
        { alg: -7, type: "public-key" },
        { alg: -257, type: "public-key" },
      ]);
      expect(options.timeout).toBe(60000);
      expect(options.attestation).toBe("none");
    });
  });

  describe("verifyRegistrationResponse", () => {
    it("should successfully verify a valid ES256 registration response", async () => {
      const options = service.generateRegistrationOptions("usr_1", "admin", "Admin");

      // Generate P-256 key pair
      const { publicKey, privateKey: _ } = generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
      });
      const jwk = publicKey.export({ format: "jwk" });
      const xBuffer = Buffer.from(jwk.x as string, "base64url");
      const yBuffer = Buffer.from(jwk.y as string, "base64url");

      // Build COSE key map
      const coseKey = new Map<unknown, unknown>();
      coseKey.set(1, 2); // kty: EC2
      coseKey.set(3, -7); // alg: ES256
      coseKey.set(-1, 1); // crv: P-256
      coseKey.set(-2, xBuffer); // x
      coseKey.set(-3, yBuffer); // y
      const coseKeyBytes = encodeCbor(coseKey);

      // Authenticator Data construction
      const rpIdHash = createHash("sha256").update(service.getRpId()).digest();
      const flags = Buffer.from([0x41]); // UP (0x01) | AT (0x40)
      const signCount = Buffer.alloc(4);
      signCount.writeUInt32BE(0, 0);
      const aaguid = Buffer.alloc(16, 0);
      const credentialId = Buffer.from("test-cred-id-123", "utf8");
      const credIdLen = Buffer.alloc(2);
      credIdLen.writeUInt16BE(credentialId.length, 0);

      const authData = Buffer.concat([
        rpIdHash,
        flags,
        signCount,
        aaguid,
        credIdLen,
        credentialId,
        coseKeyBytes,
      ]);

      // Attestation Object (fmt: "none")
      const attestationMap = new Map<unknown, unknown>();
      attestationMap.set("fmt", "none");
      attestationMap.set("attStmt", new Map());
      attestationMap.set("authData", authData);
      const attestationObject = encodeCbor(attestationMap).toString("base64url");

      // Client Data JSON
      const clientDataJSON = Buffer.from(
        JSON.stringify({
          type: "webauthn.create",
          challenge: options.challenge,
          origin: "http://localhost:5002",
        }),
      ).toString("base64url");

      const result = await service.verifyRegistrationResponse({
        challenge: options.challenge,
        response: {
          id: credentialId.toString("base64url"),
          rawId: credentialId.toString("base64url"),
          clientDataJSON,
          attestationObject,
        },
      });

      expect(result.verified).toBe(true);
      expect(result.credential).toBeDefined();
      expect(result.credential?.id).toBe(credentialId.toString("base64url"));
      expect(result.credential?.counter).toBe(0);
      expect(result.credential?.publicKey).toContain("BEGIN PUBLIC KEY");
    });

    it("should reject registration if challenge does not match", async () => {
      const options = service.generateRegistrationOptions("usr_1", "admin", "Admin");

      const clientDataJSON = Buffer.from(
        JSON.stringify({
          type: "webauthn.create",
          challenge: "invalid-challenge",
          origin: "http://localhost:5002",
        }),
      ).toString("base64url");

      const result = await service.verifyRegistrationResponse({
        challenge: options.challenge,
        response: {
          id: "cred_1",
          rawId: "cred_1",
          clientDataJSON,
          attestationObject: "mock",
        },
      });

      expect(result.verified).toBe(false);
      expect(result.credential).toBeUndefined();
    });

    it("should reject registration if clientData type is not webauthn.create", async () => {
      const options = service.generateRegistrationOptions("usr_1", "admin", "Admin");

      const clientDataJSON = Buffer.from(
        JSON.stringify({
          type: "webauthn.get",
          challenge: options.challenge,
          origin: "http://localhost:5002",
        }),
      ).toString("base64url");

      const result = await service.verifyRegistrationResponse({
        challenge: options.challenge,
        response: {
          id: "cred_1",
          rawId: "cred_1",
          clientDataJSON,
          attestationObject: "mock",
        },
      });

      expect(result.verified).toBe(false);
    });

    it("should reject registration if UP or AT flags are missing", async () => {
      const options = service.generateRegistrationOptions("usr_1", "admin", "Admin");

      const rpIdHash = createHash("sha256").update(service.getRpId()).digest();
      const flags = Buffer.from([0x00]); // No UP or AT flags
      const signCount = Buffer.alloc(4);
      const authData = Buffer.concat([
        rpIdHash,
        flags,
        signCount,
        Buffer.alloc(16),
        Buffer.alloc(2),
      ]);

      const attestationMap = new Map<unknown, unknown>();
      attestationMap.set("fmt", "none");
      attestationMap.set("attStmt", new Map());
      attestationMap.set("authData", authData);
      const attestationObject = encodeCbor(attestationMap).toString("base64url");

      const clientDataJSON = Buffer.from(
        JSON.stringify({
          type: "webauthn.create",
          challenge: options.challenge,
          origin: "http://localhost:5002",
        }),
      ).toString("base64url");

      const result = await service.verifyRegistrationResponse({
        challenge: options.challenge,
        response: {
          id: "cred_1",
          rawId: "cred_1",
          clientDataJSON,
          attestationObject,
        },
      });

      expect(result.verified).toBe(false);
    });
  });

  describe("generateAuthenticationOptions", () => {
    it("should generate valid authentication options", () => {
      const options = service.generateAuthenticationOptions([{ id: "cred-1" }, { id: "cred-2" }]);

      expect(options.challenge).toBeDefined();
      expect(options.timeout).toBe(60000);
      expect(options.rpId).toBe(service.getRpId());
      expect(options.allowCredentials).toEqual([
        { id: "cred-1", type: "public-key" },
        { id: "cred-2", type: "public-key" },
      ]);
    });
  });

  describe("verifyAuthenticationResponse", () => {
    it("should verify valid assertion signature and advance counter", async () => {
      const { publicKey, privateKey } = generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
      });
      const pemPublicKey = publicKey.export({ type: "spki", format: "pem" }).toString();

      const credId = "cred-passkey-1";
      const authOptions = service.generateAuthenticationOptions([{ id: credId }]);

      // Client Data
      const clientDataObj = {
        type: "webauthn.get",
        challenge: authOptions.challenge,
        origin: "http://localhost:5002",
      };
      const clientDataBuffer = Buffer.from(JSON.stringify(clientDataObj));
      const clientDataJSON = clientDataBuffer.toString("base64url");

      // Authenticator Data (UP=1, counter=5)
      const rpIdHash = createHash("sha256").update(service.getRpId()).digest();
      const flags = Buffer.from([0x01]); // UP
      const signCount = Buffer.alloc(4);
      signCount.writeUInt32BE(5, 0);
      const authenticatorData = Buffer.concat([rpIdHash, flags, signCount]);

      // Sign authData || SHA256(clientDataJSON)
      const clientDataHash = createHash("sha256").update(clientDataBuffer).digest();
      const signaturePayload = Buffer.concat([authenticatorData, clientDataHash]);
      const signature = sign("sha256", signaturePayload, privateKey).toString("base64url");

      const result = await service.verifyAuthenticationResponse({
        challenge: authOptions.challenge,
        credential: {
          id: credId,
          publicKey: pemPublicKey,
          counter: 0,
        },
        response: {
          id: credId,
          rawId: credId,
          clientDataJSON,
          authenticatorData: authenticatorData.toString("base64url"),
          signature,
        },
      });

      expect(result.verified).toBe(true);
      expect(result.newCounter).toBe(5);
    });

    it("should reject assertion when counter rolled back or replayed", async () => {
      const { publicKey, privateKey } = generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
      });
      const pemPublicKey = publicKey.export({ type: "spki", format: "pem" }).toString();

      const credId = "cred-passkey-2";
      const authOptions = service.generateAuthenticationOptions([{ id: credId }]);

      const clientDataBuffer = Buffer.from(
        JSON.stringify({
          type: "webauthn.get",
          challenge: authOptions.challenge,
        }),
      );
      const clientDataJSON = clientDataBuffer.toString("base64url");

      // Counter is 3, but credential stored counter is 10 (Replay Attack)
      const rpIdHash = createHash("sha256").update(service.getRpId()).digest();
      const flags = Buffer.from([0x01]);
      const signCount = Buffer.alloc(4);
      signCount.writeUInt32BE(3, 0);
      const authenticatorData = Buffer.concat([rpIdHash, flags, signCount]);

      const clientDataHash = createHash("sha256").update(clientDataBuffer).digest();
      const signaturePayload = Buffer.concat([authenticatorData, clientDataHash]);
      const signature = sign("sha256", signaturePayload, privateKey).toString("base64url");

      const result = await service.verifyAuthenticationResponse({
        challenge: authOptions.challenge,
        credential: {
          id: credId,
          publicKey: pemPublicKey,
          counter: 10,
        },
        response: {
          id: credId,
          rawId: credId,
          clientDataJSON,
          authenticatorData: authenticatorData.toString("base64url"),
          signature,
        },
      });

      expect(result.verified).toBe(false);
      expect(result.newCounter).toBe(10);
    });

    it("should reject assertion when signature is forged", async () => {
      const { publicKey } = generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
      });
      const pemPublicKey = publicKey.export({ type: "spki", format: "pem" }).toString();

      const credId = "cred-passkey-3";
      const authOptions = service.generateAuthenticationOptions([{ id: credId }]);

      const clientDataBuffer = Buffer.from(
        JSON.stringify({
          type: "webauthn.get",
          challenge: authOptions.challenge,
        }),
      );

      const rpIdHash = createHash("sha256").update(service.getRpId()).digest();
      const flags = Buffer.from([0x01]);
      const signCount = Buffer.alloc(4);
      signCount.writeUInt32BE(1, 0);
      const authenticatorData = Buffer.concat([rpIdHash, flags, signCount]);

      // Fake signature
      const fakeSignature = Buffer.from("invalid-crypto-signature").toString("base64url");

      const result = await service.verifyAuthenticationResponse({
        challenge: authOptions.challenge,
        credential: {
          id: credId,
          publicKey: pemPublicKey,
          counter: 0,
        },
        response: {
          id: credId,
          rawId: credId,
          clientDataJSON: clientDataBuffer.toString("base64url"),
          authenticatorData: authenticatorData.toString("base64url"),
          signature: fakeSignature,
        },
      });

      expect(result.verified).toBe(false);
    });
  });

  describe("Singleton Instance and Credential Store", () => {
    it("should persist and retrieve user credentials in memory", () => {
      const cred = {
        id: "cred-singleton",
        publicKey: "MOCK_KEY",
        counter: 1,
      };

      webauthnService.saveUserCredential("user_test", cred);
      const userCreds = webauthnService.getUserCredentials("user_test");
      expect(userCreds).toHaveLength(1);
      expect(userCreds[0]?.id).toBe("cred-singleton");

      const found = webauthnService.getCredentialById("cred-singleton");
      expect(found).toBeDefined();
      expect(found?.counter).toBe(1);

      webauthnService.updateCredentialCounter("cred-singleton", 15);
      expect(webauthnService.getCredentialById("cred-singleton")?.counter).toBe(15);
    });
  });
});
