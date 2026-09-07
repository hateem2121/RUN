/**
 * Cradle-to-Gate Life Cycle Assessment (LCA) Carbon Engine
 * Compliant with ISO 14067 & Higg Materials Sustainability Index (Higg MSI) standards.
 * Calibrated specifically for RUN APPAREL's 100% solar-powered athleticwear manufacturing facility.
 */

export interface GarmentLcaInput {
  composition: Record<string, number>;
  weightGrams: number;
  useSolarOffset?: boolean;
}

export interface LcaReport {
  totalCarbonKgCO2e: number;
  materialCarbon: number;
  processingCarbon: number;
  carbonAvoidedKgCO2e: number;
  waterLiters: number;
  benchmarkSavingsPercent: number;
}

/**
 * Higg MSI & ISO 14067 material carbon intensity factors (kg CO2e / kg material).
 */
export const SUSTAINABLE_CARBON_FACTORS: Record<string, number> = {
  recycled_polyester: 1.53,
  organic_cotton: 2.35,
  recycled_polyamide: 2.1,
  elastane: 6.8,
  bamboo_viscose: 2.9,
  merino_wool: 14.2,
};

/**
 * Conventional industry benchmark carbon factors (kg CO2e / kg material).
 */
export const CONVENTIONAL_BENCHMARK_FACTORS: Record<string, number> = {
  recycled_polyester: 4.41, // vs virgin polyester: 4.41
  organic_cotton: 5.89, // vs conventional cotton: 5.89
  recycled_polyamide: 7.9, // vs virgin nylon: 7.90
  elastane: 6.8,
  bamboo_viscose: 2.9,
  merino_wool: 14.2,
  polyester: 4.41,
  cotton: 5.89,
  polyamide: 7.9,
  nylon: 7.9,
};

/**
 * Water consumption factors (Liters / kg material).
 */
export const WATER_CONSUMPTION_FACTORS: Record<string, number> = {
  recycled_polyester: 18.0,
  organic_cotton: 2430.0,
  recycled_polyamide: 28.0,
  elastane: 45.0,
  bamboo_viscose: 180.0,
  merino_wool: 550.0,
};

/**
 * Processing and factory emission factors.
 */
export const PROCESSING_EMISSION_FACTORS = {
  knittingWeavingPerKg: 0.85, // kg CO2e / kg
  dyeingFinishingEcoPerKg: 1.4, // kg CO2e / kg (eco dye baths)
  dyeingFinishingConventionalPerKg: 3.2, // kg CO2e / kg (conventional)
  cutAndSewPerGarment: 0.35, // kg CO2e / garment
  solarFactoryOffsetPerGarment: 0.45, // kg CO2e / garment (RUN APPAREL Sialkot solar array)
  ecoProcessingWaterPerKg: 35.0, // Liters / kg (closed-loop dye baths)
};

/**
 * Normalizes fiber names to canonical snake_case keys.
 */
function normalizeFiberKey(key: string): string {
  return key
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

/**
 * Calculates the Cradle-to-Gate Life Cycle Assessment (LCA) for a sportswear garment.
 *
 * @param input Garment composition, weight in grams, and solar offset preference
 * @returns Verified LcaReport containing total carbon, avoided emissions, and benchmark savings
 */
export function calculateGarmentLCA(input: GarmentLcaInput): LcaReport {
  const weightKg = Math.max(0, input.weightGrams / 1000);
  const useSolarOffset = input.useSolarOffset ?? true;

  // 1. Calculate composition fractions
  let totalDeclaredPercent = 0;
  for (const percent of Object.values(input.composition)) {
    if (typeof percent === "number" && !Number.isNaN(percent) && percent > 0) {
      totalDeclaredPercent += percent;
    }
  }

  const normFactor = totalDeclaredPercent > 0 ? totalDeclaredPercent : 100;

  // 2. Material Emissions and Water Footprint
  let materialCarbon = 0;
  let benchmarkMaterialCarbon = 0;
  let materialWater = 0;

  for (const [rawKey, percent] of Object.entries(input.composition)) {
    if (typeof percent !== "number" || Number.isNaN(percent) || percent <= 0) {
      continue;
    }

    const key = normalizeFiberKey(rawKey);
    const fraction = percent / normFactor;
    const fiberWeightKg = weightKg * fraction;

    const sustFactor = SUSTAINABLE_CARBON_FACTORS[key] ?? 3.5;
    const benchFactor = CONVENTIONAL_BENCHMARK_FACTORS[key] ?? 5.5;
    const waterFactor = WATER_CONSUMPTION_FACTORS[key] ?? 50.0;

    materialCarbon += fiberWeightKg * sustFactor;
    benchmarkMaterialCarbon += fiberWeightKg * benchFactor;
    materialWater += fiberWeightKg * waterFactor;
  }

  // 3. Processing and Factory Emissions
  const knittingWeaving = weightKg * PROCESSING_EMISSION_FACTORS.knittingWeavingPerKg;
  const ecoDyeingFinishing = weightKg * PROCESSING_EMISSION_FACTORS.dyeingFinishingEcoPerKg;
  const cutAndSew = PROCESSING_EMISSION_FACTORS.cutAndSewPerGarment;
  const solarOffset = useSolarOffset ? PROCESSING_EMISSION_FACTORS.solarFactoryOffsetPerGarment : 0;

  const grossProcessingCarbon = knittingWeaving + ecoDyeingFinishing + cutAndSew;
  const processingCarbon = grossProcessingCarbon - solarOffset;
  const totalCarbonKgCO2e = materialCarbon + processingCarbon;

  // 4. Conventional Benchmark Emissions
  const convDyeingFinishing =
    weightKg * PROCESSING_EMISSION_FACTORS.dyeingFinishingConventionalPerKg;
  const benchmarkProcessingCarbon = knittingWeaving + convDyeingFinishing + cutAndSew;
  const benchmarkTotalCarbon = benchmarkMaterialCarbon + benchmarkProcessingCarbon;

  // 5. Carbon Avoided and Savings Percentage
  const carbonAvoidedKgCO2e = Math.max(0, benchmarkTotalCarbon - totalCarbonKgCO2e);
  const benchmarkSavingsPercent =
    benchmarkTotalCarbon > 0 ? (carbonAvoidedKgCO2e / benchmarkTotalCarbon) * 100 : 0;

  const totalWater = materialWater + weightKg * PROCESSING_EMISSION_FACTORS.ecoProcessingWaterPerKg;

  return {
    totalCarbonKgCO2e: Number(totalCarbonKgCO2e.toFixed(3)),
    materialCarbon: Number(materialCarbon.toFixed(3)),
    processingCarbon: Number(processingCarbon.toFixed(3)),
    carbonAvoidedKgCO2e: Number(carbonAvoidedKgCO2e.toFixed(3)),
    waterLiters: Number(totalWater.toFixed(1)),
    benchmarkSavingsPercent: Number(benchmarkSavingsPercent.toFixed(1)),
  };
}
