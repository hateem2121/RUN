import { describe, expect, it } from "vitest";
import {
  canonicalStringify,
  generateEd25519KeyPair,
  signPassport,
  verifyPassportSignature,
} from "../../../services/compliance/digital-product-passport.js";
import {
  calculateGarmentLCA,
  SUSTAINABLE_CARBON_FACTORS,
} from "../../../services/compliance/lca-carbon-engine.js";

describe("Digital Product Passport (DPP-01)", () => {
  const samplePayload = {
    productId: 101,
    sku: "RUN-AERO-01",
    fiberComposition: {
      recycled_polyester: 85,
      elastane: 15,
    },
    recycledContentPercent: 85,
    certifications: ["OEKO-TEX Standard 100", "GRS", "GOTS"],
    carbonFootprintKgCO2e: 0.814,
    waterUsageLiters: 22.3,
    circularityScore: 88,
    repairabilityScore: 9,
    batch: "2026-B1",
  };

  it("generates an Ed25519 keypair in SPKI/PKCS8 PEM format", () => {
    const keys = generateEd25519KeyPair();
    expect(keys.publicKey).toContain("BEGIN PUBLIC KEY");
    expect(keys.privateKey).toContain("BEGIN PRIVATE KEY");
  });

  it("produces deterministic canonical JSON stringification regardless of key insertion order", () => {
    const objA = { z: 1, a: 2, m: { y: "test", b: 4 } };
    const objB = { a: 2, m: { b: 4, y: "test" }, z: 1 };

    expect(canonicalStringify(objA)).toBe(canonicalStringify(objB));
    expect(canonicalStringify(objA)).toBe('{"a":2,"m":{"b":4,"y":"test"},"z":1}');
  });

  it("signs and verifies an EU ESPR compliant passport", () => {
    const { publicKey, privateKey } = generateEd25519KeyPair();
    const passport = signPassport(samplePayload, privateKey);

    expect(passport.dppId).toBe("urn:dpp:run-apparel:run-aero-01:2026-B1");
    expect(passport.brand).toBe("RUN APPAREL");
    expect(passport.facility).toBe("RUN APPAREL (PVT) LTD, Sialkot, Pakistan");
    expect(passport.qrPayloadUrl).toBe(
      "https://wear-run.com/dpp/urn%3Adpp%3Arun-apparel%3Arun-aero-01%3A2026-B1",
    );
    expect(passport.signature).toBeDefined();
    expect(typeof passport.signature).toBe("string");
    expect(passport.signature.length).toBeGreaterThan(60);

    const isValid = verifyPassportSignature(passport, publicKey);
    expect(isValid).toBe(true);
  });

  it("detects tampering when fiber composition is altered", () => {
    const { publicKey, privateKey } = generateEd25519KeyPair();
    const passport = signPassport(samplePayload, privateKey);

    // Tamper with composition
    const tampered = {
      ...passport,
      fiberComposition: {
        recycled_polyester: 90,
        elastane: 10,
      },
    };

    expect(verifyPassportSignature(tampered, publicKey)).toBe(false);
  });

  it("detects tampering when carbon footprint is altered", () => {
    const { publicKey, privateKey } = generateEd25519KeyPair();
    const passport = signPassport(samplePayload, privateKey);

    const tampered = {
      ...passport,
      carbonFootprintKgCO2e: 0.12, // fraudulently reduced
    };

    expect(verifyPassportSignature(tampered, publicKey)).toBe(false);
  });

  it("fails verification when checked against a different public key", () => {
    const keyPairA = generateEd25519KeyPair();
    const keyPairB = generateEd25519KeyPair();

    const passport = signPassport(samplePayload, keyPairA.privateKey);

    expect(verifyPassportSignature(passport, keyPairB.publicKey)).toBe(false);
  });

  it("fails verification when signature is malformed or corrupted", () => {
    const { publicKey, privateKey } = generateEd25519KeyPair();
    const passport = signPassport(samplePayload, privateKey);

    const corrupted = {
      ...passport,
      signature: "corrupted-invalid-base64-signature",
    };

    expect(verifyPassportSignature(corrupted, publicKey)).toBe(false);
  });
});

describe("Higg MSI & ISO 14067 Carbon Engine (LCA-01)", () => {
  it("calculates accurate Cradle-to-Gate emissions for 200g recycled poly blend", () => {
    // 200g garment: 85% recycled polyester (1.53), 15% elastane (6.80)
    // weightKg = 0.2
    // material:
    //   recycled_polyester: 0.2 * 0.85 * 1.53 = 0.17 * 1.53 = 0.2601
    //   elastane: 0.2 * 0.15 * 6.80 = 0.03 * 6.80 = 0.204
    //   total material = 0.4641 kg CO2e
    // processing (with solar offset):
    //   knitting: 0.2 * 0.85 = 0.17
    //   dyeing: 0.2 * 1.40 = 0.28
    //   cutAndSew: 0.35
    //   solarOffset: -0.45
    //   net processing = 0.17 + 0.28 + 0.35 - 0.45 = 0.35 kg CO2e
    // total = 0.4641 + 0.35 = 0.8141 -> 0.814 kg CO2e
    const report = calculateGarmentLCA({
      composition: {
        recycled_polyester: 85,
        elastane: 15,
      },
      weightGrams: 200,
      useSolarOffset: true,
    });

    expect(report.materialCarbon).toBeCloseTo(0.464, 3);
    expect(report.processingCarbon).toBeCloseTo(0.35, 3);
    expect(report.totalCarbonKgCO2e).toBeCloseTo(0.814, 3);

    // Benchmark comparison:
    // virgin poly (4.41) = 0.17 * 4.41 = 0.7497
    // elastane = 0.204
    // benchmark material = 0.9537
    // benchmark processing = 0.17 + (0.2 * 3.20) + 0.35 = 0.17 + 0.64 + 0.35 = 1.16
    // benchmark total = 0.9537 + 1.16 = 2.1137
    // avoided = 2.1137 - 0.8141 = 1.2996 -> 1.300 kg CO2e
    // savings % = (1.2996 / 2.1137) * 100 =~ 61.5%
    expect(report.carbonAvoidedKgCO2e).toBeGreaterThan(1.2);
    expect(report.benchmarkSavingsPercent).toBeGreaterThan(60);
    expect(report.waterLiters).toBeGreaterThan(0);
  });

  it("accurately handles solar offset deduction toggle", () => {
    const withSolar = calculateGarmentLCA({
      composition: { recycled_polyester: 100 },
      weightGrams: 250,
      useSolarOffset: true,
    });

    const withoutSolar = calculateGarmentLCA({
      composition: { recycled_polyester: 100 },
      weightGrams: 250,
      useSolarOffset: false,
    });

    // Exactly 0.45 kg CO2e difference from the solar array
    expect(withoutSolar.totalCarbonKgCO2e - withSolar.totalCarbonKgCO2e).toBeCloseTo(0.45, 2);
    expect(withoutSolar.processingCarbon - withSolar.processingCarbon).toBeCloseTo(0.45, 2);
    expect(withSolar.carbonAvoidedKgCO2e - withoutSolar.carbonAvoidedKgCO2e).toBeCloseTo(0.45, 2);
  });

  it("calculates emissions for 100% organic cotton garment", () => {
    // 300g hoodie: 100% organic cotton (2.35 factor)
    const report = calculateGarmentLCA({
      composition: { organic_cotton: 100 },
      weightGrams: 300,
      useSolarOffset: true,
    });

    const expectedMaterial = 0.3 * SUSTAINABLE_CARBON_FACTORS.organic_cotton; // 0.705
    expect(report.materialCarbon).toBeCloseTo(expectedMaterial, 2);
    expect(report.totalCarbonKgCO2e).toBeGreaterThan(report.materialCarbon);
    expect(report.benchmarkSavingsPercent).toBeGreaterThan(50);
  });

  it("handles normalized compositions and case variations", () => {
    // Percentage values that sum to something other than 100 or have spaces
    const report = calculateGarmentLCA({
      composition: {
        "Recycled-Polyester": 170,
        Elastane: 30,
      },
      weightGrams: 200,
    });

    // 170 / 200 = 85%, 30 / 200 = 15% -> identical to 85/15
    expect(report.materialCarbon).toBeCloseTo(0.464, 3);
  });
});
