import { describe, expect, it } from "vitest";
import {
  addMoney,
  calculateTierDiscount,
  calculateTierPrice,
  createMoney,
  formatMoney,
  multiplyMoney,
  parseMoney,
  splitMoney,
  subtractMoney,
} from "../utils/financial-math.js";

describe("FIN-01: BigInt High-Precision Financial Math", () => {
  describe("createMoney", () => {
    it("should create Money from bigint", () => {
      const m = createMoney(1050n, "USD", 2);
      expect(m).toEqual({ amount: 1050n, currency: "USD", decimals: 2 });
    });

    it("should create Money from string with exact integer cents", () => {
      const m = createMoney("10.50");
      expect(m).toEqual({ amount: 1050n, currency: "USD", decimals: 2 });
    });

    it("should create Money from number avoiding floating point errors", () => {
      // 0.1 + 0.2 in JS is 0.30000000000000004
      const m = createMoney(0.1 + 0.2);
      expect(m.amount).toBe(30n);
      expect(m.currency).toBe("USD");
      expect(m.decimals).toBe(2);
    });

    it("should handle negative numbers and strings", () => {
      expect(createMoney("-12.34").amount).toBe(-1234n);
      expect(createMoney(-12.34).amount).toBe(-1234n);
      expect(createMoney(-1234n).amount).toBe(-1234n);
    });

    it("should round to specified decimals if more fractional digits provided", () => {
      // Half-up rounding on creation
      expect(createMoney("10.505").amount).toBe(1051n);
      expect(createMoney("10.504").amount).toBe(1050n);
    });

    it("should support custom decimals", () => {
      const btc = createMoney("1.23456789", "BTC", 8);
      expect(btc).toEqual({
        amount: 123456789n,
        currency: "BTC",
        decimals: 8,
      });
    });
  });

  describe("addMoney and subtractMoney", () => {
    it("should add money instances with matching currency", () => {
      const a = createMoney("10.50");
      const b = createMoney("5.25");
      const sum = addMoney(a, b);
      expect(sum).toEqual({ amount: 1575n, currency: "USD", decimals: 2 });
    });

    it("should subtract money instances with matching currency", () => {
      const a = createMoney("10.50");
      const b = createMoney("5.25");
      const diff = subtractMoney(a, b);
      expect(diff).toEqual({ amount: 525n, currency: "USD", decimals: 2 });
    });

    it("should throw error on currency mismatch", () => {
      const usd = createMoney("10.00", "USD");
      const eur = createMoney("10.00", "EUR");
      expect(() => addMoney(usd, eur)).toThrow(/Currency mismatch/);
      expect(() => subtractMoney(usd, eur)).toThrow(/Currency mismatch/);
    });

    it("should align precision when adding different decimals", () => {
      const a = createMoney("10.50", "USD", 2); // 1050n
      const b = createMoney("1.0005", "USD", 4); // 10005n
      const sum = addMoney(a, b);
      // a scaled to 4 decimals = 105000n + 10005n = 115005n ($11.5005)
      expect(sum).toEqual({ amount: 115005n, currency: "USD", decimals: 4 });
    });
  });

  describe("multiplyMoney", () => {
    it("should multiply by integer factor", () => {
      const m = createMoney("15.00");
      const res = multiplyMoney(m, 3);
      expect(res).toEqual({ amount: 4500n, currency: "USD", decimals: 2 });
    });

    it("should multiply with HALF_UP rounding for tax and percentages", () => {
      // $10.50 * 7.5% tax (0.075) = 0.7875 -> 0.79
      const price = createMoney("10.50");
      const tax = multiplyMoney(price, "0.075", "HALF_UP");
      expect(tax.amount).toBe(79n); // $0.79
    });

    it("should support BANKERS rounding mode (round half to even)", () => {
      // 2.5 cents rounds to 2 cents (even)
      const m1 = { amount: 25n, currency: "USD", decimals: 2 };
      const bankers1 = multiplyMoney(m1, "0.1", "BANKERS"); // 2.5 / 10 -> 2.5 cents -> 2
      expect(bankers1.amount).toBe(2n);

      // 3.5 cents rounds to 4 cents (even)
      const m2 = { amount: 35n, currency: "USD", decimals: 2 };
      const bankers2 = multiplyMoney(m2, "0.1", "BANKERS"); // 3.5 / 10 -> 3.5 cents -> 4
      expect(bankers2.amount).toBe(4n);
    });
  });

  describe("splitMoney (Zero Penny Loss Invariant)", () => {
    it("should split $10.00 into 3 parts with exact sum preservation", () => {
      const total = createMoney("10.00"); // 1000n
      const parts = splitMoney(total, 3);

      expect(parts).toHaveLength(3);
      expect(parts[0].amount).toBe(334n); // $3.34
      expect(parts[1].amount).toBe(333n); // $3.33
      expect(parts[2].amount).toBe(333n); // $3.33

      const sum = parts.reduce((acc, p) => acc + p.amount, 0n);
      expect(sum).toBe(1000n);
    });

    it("should split $100.00 into 7 parts with exact sum preservation", () => {
      const total = createMoney("100.00"); // 10000n
      const parts = splitMoney(total, 7);

      expect(parts).toHaveLength(7);
      const sum = parts.reduce((acc, p) => acc + p.amount, 0n);
      expect(sum).toBe(10000n);
    });

    it("should split small amounts (e.g. 5 cents across 2 parts)", () => {
      const total = createMoney("0.05"); // 5n
      const parts = splitMoney(total, 2);

      expect(parts[0].amount).toBe(3n);
      expect(parts[1].amount).toBe(2n);
      expect(parts[0].amount + parts[1].amount).toBe(5n);
    });

    it("should reject non-positive integer parts", () => {
      const total = createMoney("10.00");
      expect(() => splitMoney(total, 0)).toThrow(RangeError);
      expect(() => splitMoney(total, -1)).toThrow(RangeError);
      expect(() => splitMoney(total, 2.5)).toThrow(RangeError);
    });
  });

  describe("calculateTierDiscount & calculateTierPrice", () => {
    const tiers = [
      { minQuantity: 100, discountPercent: 10 },
      { minQuantity: 500, discountPercent: 20 },
      { minQuantity: 1000, discountPercent: 25 },
    ];
    const basePrice = createMoney("25.00"); // $25.00 / garment

    it("should give 0% discount if quantity is below lowest tier", () => {
      const discount = calculateTierDiscount(basePrice, 50, tiers);
      expect(discount.amount).toBe(0n);

      const totalPrice = calculateTierPrice(basePrice, 50, tiers);
      expect(totalPrice.amount).toBe(125000n); // 50 * $25 = $1,250.00
    });

    it("should apply 10% discount for orders between 100 and 499 units", () => {
      // 150 units * $25.00 = $3,750.00
      // 10% discount = $375.00
      const discount = calculateTierDiscount(basePrice, 150, tiers);
      expect(discount.amount).toBe(37500n); // $375.00

      const price = calculateTierPrice(basePrice, 150, tiers);
      expect(price.amount).toBe(337500n); // $3,375.00
    });

    it("should apply highest qualifying tier (25% for 1000+ units)", () => {
      // 1200 units * $25.00 = $30,000.00
      // 25% discount = $7,500.00
      const discount = calculateTierDiscount(basePrice, 1200, tiers);
      expect(discount.amount).toBe(750000n); // $7,500.00

      const price = calculateTierPrice(basePrice, 1200, tiers);
      expect(price.amount).toBe(2250000n); // $22,500.00
    });
  });

  describe("formatMoney", () => {
    it("should format USD money with currency symbol", () => {
      const m = createMoney("1234.50");
      const str = formatMoney(m);
      expect(str).toBe("$1,234.50");
    });

    it("should format money without currency symbol when showCurrency is false", () => {
      const m = createMoney("1234.50");
      const str = formatMoney(m, { showCurrency: false });
      expect(str).toBe("1,234.50");
    });
  });

  describe("parseMoney", () => {
    it("should parse currency strings with symbols and commas", () => {
      expect(parseMoney("$1,234.56")).toEqual(createMoney("1234.56"));
      expect(parseMoney("  $99.00  ")).toEqual(createMoney("99.00"));
    });

    it("should parse negative accounting format ($12.34)", () => {
      expect(parseMoney("($12.34)")).toEqual(createMoney("-12.34"));
      expect(parseMoney("-$12.34")).toEqual(createMoney("-12.34"));
    });

    it("should parse foreign currency strings", () => {
      expect(parseMoney("€500.00", "EUR")).toEqual(createMoney("500.00", "EUR"));
    });
  });
});
