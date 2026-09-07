/**
 * FIN-01: BigInt High-Precision Financial Math
 *
 * Implements deterministic monetary arithmetic using integer cents (BigInt)
 * to eliminate IEEE 754 floating-point drift in B2B manufacturing quotes,
 * order invoices, and tier pricing.
 */

export interface Money {
  amount: bigint;
  currency: string;
  decimals?: number | undefined;
}

export interface DiscountTier {
  minQuantity: number;
  discountPercent: number;
}

export type RoundingMode = "HALF_UP" | "BANKERS";

/**
 * Creates a Money instance from number, string, or bigint.
 * Default decimals is 2 (e.g., 1050n = $10.50).
 */
export function createMoney(
  amount: number | string | bigint,
  currency = "USD",
  decimals = 2,
): Money {
  if (decimals < 0 || !Number.isInteger(decimals)) {
    throw new RangeError("Decimals must be a non-negative integer");
  }

  const normalizedCurrency = currency.toUpperCase().trim();

  if (typeof amount === "bigint") {
    return { amount, currency: normalizedCurrency, decimals };
  }

  if (typeof amount === "number") {
    if (!Number.isFinite(amount)) {
      throw new TypeError("Amount must be a finite number");
    }
    // Convert to fixed string with extra precision to avoid float drift, then parse
    amount = amount.toFixed(decimals + 4);
  }

  if (typeof amount === "string") {
    const trimmed = amount.trim();
    if (!trimmed) {
      return { amount: 0n, currency: normalizedCurrency, decimals };
    }

    const isNegative = trimmed.startsWith("-");
    const cleanStr = isNegative ? trimmed.slice(1) : trimmed;

    const [intPartStr = "0", fracPartStr = ""] = cleanStr.split(".");
    const intPart = BigInt(intPartStr.replace(/\D/g, "") || "0");

    // Pad or truncate fraction to (decimals + 1) to inspect next digit for rounding
    const paddedFrac = fracPartStr.padEnd(decimals + 1, "0");
    const mainFracStr = paddedFrac.slice(0, decimals);
    const nextDigit = Number.parseInt(paddedFrac[decimals] || "0", 10);

    let units = intPart * 10n ** BigInt(decimals) + BigInt(mainFracStr || "0");
    if (nextDigit >= 5) {
      units += 1n;
    }

    return {
      amount: isNegative ? -units : units,
      currency: normalizedCurrency,
      decimals,
    };
  }

  throw new TypeError("Amount must be a number, string, or bigint");
}

/**
 * Asserts matching currencies before monetary operations.
 */
function assertMatchingCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: cannot operate on ${a.currency} and ${b.currency}`);
  }
}

/**
 * Adds two Money instances.
 */
export function addMoney(a: Money, b: Money): Money {
  assertMatchingCurrency(a, b);
  const aDec = a.decimals ?? 2;
  const bDec = b.decimals ?? 2;

  if (aDec === bDec) {
    return { amount: a.amount + b.amount, currency: a.currency, decimals: aDec };
  }

  const maxDec = Math.max(aDec, bDec);
  const aScaled = a.amount * 10n ** BigInt(maxDec - aDec);
  const bScaled = b.amount * 10n ** BigInt(maxDec - bDec);

  return { amount: aScaled + bScaled, currency: a.currency, decimals: maxDec };
}

/**
 * Subtracts Money b from Money a.
 */
export function subtractMoney(a: Money, b: Money): Money {
  assertMatchingCurrency(a, b);
  const aDec = a.decimals ?? 2;
  const bDec = b.decimals ?? 2;

  if (aDec === bDec) {
    return { amount: a.amount - b.amount, currency: a.currency, decimals: aDec };
  }

  const maxDec = Math.max(aDec, bDec);
  const aScaled = a.amount * 10n ** BigInt(maxDec - aDec);
  const bScaled = b.amount * 10n ** BigInt(maxDec - bDec);

  return { amount: aScaled - bScaled, currency: a.currency, decimals: maxDec };
}

/**
 * Internal helper for integer division with HALF_UP or BANKERS rounding.
 */
function divideBigIntWithRounding(
  numerator: bigint,
  divisor: bigint,
  mode: RoundingMode = "HALF_UP",
): bigint {
  if (divisor === 0n) {
    throw new RangeError("Division by zero");
  }

  const isNegative = numerator < 0n !== divisor < 0n;
  const absNum = numerator < 0n ? -numerator : numerator;
  const absDiv = divisor < 0n ? -divisor : divisor;

  let quotient = absNum / absDiv;
  const remainder = absNum % absDiv;

  if (remainder !== 0n) {
    const doubleRemainder = remainder * 2n;

    if (mode === "HALF_UP") {
      if (doubleRemainder >= absDiv) {
        quotient += 1n;
      }
    } else if (mode === "BANKERS") {
      if (doubleRemainder > absDiv) {
        quotient += 1n;
      } else if (doubleRemainder === absDiv) {
        // Round half to even
        if (quotient % 2n !== 0n) {
          quotient += 1n;
        }
      }
    }
  }

  return isNegative ? -quotient : quotient;
}

/**
 * Multiplies a Money instance by a factor (e.g. quantity, tax rate, markup).
 * Supports HALF_UP (default) or BANKERS rounding mode.
 */
export function multiplyMoney(
  m: Money,
  factor: number | string,
  roundingMode: RoundingMode = "HALF_UP",
): Money {
  if (typeof factor === "number") {
    if (!Number.isFinite(factor)) {
      throw new TypeError("Factor must be a finite number");
    }
    // High-precision decimal string representation
    factor = factor.toString();
  }

  const factorStr = factor.trim();
  const isNegative = factorStr.startsWith("-");
  const cleanFactor = isNegative ? factorStr.slice(1) : factorStr;

  const [intPart = "0", fracPart = ""] = cleanFactor.split(".");
  const factorDecimals = fracPart.length;

  const factorBigInt =
    (isNegative ? -1n : 1n) *
    (BigInt(intPart) * 10n ** BigInt(factorDecimals) + BigInt(fracPart || "0"));

  const divisor = 10n ** BigInt(factorDecimals);
  const numerator = m.amount * factorBigInt;

  const resultAmount = divideBigIntWithRounding(numerator, divisor, roundingMode);

  return {
    amount: resultAmount,
    currency: m.currency,
    decimals: m.decimals,
  };
}

/**
 * Splits a Money instance into N parts with ZERO pennies lost.
 * Distributes remainder 1 cent at a time across first remainder parts.
 */
export function splitMoney(m: Money, parts: number): Money[] {
  if (!Number.isInteger(parts) || parts <= 0) {
    throw new RangeError("Number of parts must be a positive integer");
  }

  const pBig = BigInt(parts);
  const basePart = m.amount / pBig;
  const remainder = m.amount % pBig;

  const results: Money[] = [];
  const remCount = Number(remainder < 0n ? -remainder : remainder);

  for (let i = 0; i < parts; i++) {
    let partAmount = basePart;
    if (i < remCount) {
      partAmount += m.amount < 0n ? -1n : 1n;
    }
    results.push({
      amount: partAmount,
      currency: m.currency,
      decimals: m.decimals,
    });
  }

  return results;
}

/**
 * Calculates the total tier discount amount based on order volume.
 * If quantity does not qualify for any tier, returns 0.
 */
export function calculateTierDiscount(
  basePrice: Money,
  quantity: number,
  tiers: DiscountTier[],
): Money {
  if (quantity <= 0 || !Number.isFinite(quantity)) {
    return {
      amount: 0n,
      currency: basePrice.currency,
      decimals: basePrice.decimals,
    };
  }

  const eligibleTiers = tiers.filter((t) => quantity >= t.minQuantity);
  if (eligibleTiers.length === 0) {
    return {
      amount: 0n,
      currency: basePrice.currency,
      decimals: basePrice.decimals,
    };
  }

  // Best tier: highest discount percent
  eligibleTiers.sort(
    (a, b) => b.discountPercent - a.discountPercent || b.minQuantity - a.minQuantity,
  );
  const bestTier = eligibleTiers[0];

  if (!bestTier || bestTier.discountPercent <= 0) {
    return {
      amount: 0n,
      currency: basePrice.currency,
      decimals: basePrice.decimals,
    };
  }

  const totalBase = multiplyMoney(basePrice, quantity);
  return multiplyMoney(totalBase, bestTier.discountPercent / 100);
}

/**
 * Convenience helper to calculate final price after tier discount.
 */
export function calculateTierPrice(
  basePrice: Money,
  quantity: number,
  tiers: DiscountTier[],
): Money {
  const totalBase = multiplyMoney(basePrice, quantity);
  const discount = calculateTierDiscount(basePrice, quantity, tiers);
  return subtractMoney(totalBase, discount);
}

/**
 * Formats a Money instance for display according to locale and currency.
 */
export function formatMoney(
  m: Money,
  options?: { locale?: string; showCurrency?: boolean },
): string {
  const locale = options?.locale ?? "en-US";
  const showCurrency = options?.showCurrency ?? true;
  const decimals = m.decimals ?? 2;

  const divisor = 10 ** decimals;
  const numValue = Number(m.amount) / divisor;

  if (showCurrency) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: m.currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numValue);
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
}

/**
 * Parses a currency string (e.g. "$1,234.56", "($49.99)", "-50.00 EUR") into a Money instance.
 */
export function parseMoney(str: string, currency = "USD"): Money {
  const trimmed = str.trim();
  if (!trimmed) {
    return createMoney(0n, currency);
  }

  // Check accounting negative format: (123.45)
  const isAccountingNegative = trimmed.startsWith("(") && trimmed.endsWith(")");
  const isMinusNegative = trimmed.startsWith("-") || trimmed.includes(" -");
  const isNegative = isAccountingNegative || isMinusNegative;

  // Extract digits and optional decimal point
  const cleanNumeric = trimmed.replace(/[^\d.]/g, "");
  const signedStr = isNegative ? `-${cleanNumeric}` : cleanNumeric;

  return createMoney(signedStr, currency, 2);
}
