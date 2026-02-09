/**
 * Fabric Validator Utility
 * Validates technical specifications against expected ranges
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class FabricValidator {
  validateFabric(fabric: any): ValidationResult {
    const errors: string[] = [];

    // Basic field validation
    if (!fabric.name || fabric.name.trim().length === 0) {
      errors.push("Fabric name is required");
    }

    if (!fabric.description || fabric.description.trim().length === 0) {
      errors.push("Fabric description is required");
    }

    // Weight validation (GSM)
    if (fabric.weight) {
      const weightValid = this.validateWeight(fabric.weight);
      if (!weightValid) {
        errors.push(`Invalid weight range: ${fabric.weight} (expected: 50-500 GSM)`);
      }
    }

    // Sustainability score validation
    if (fabric.sustainabilityScore) {
      const scoreValid = this.validateSustainabilityScore(fabric.sustainabilityScore);
      if (!scoreValid) {
        errors.push(`Invalid sustainability score: ${fabric.sustainabilityScore} (expected: 1-5)`);
      }
    }

    // Stretch percentage validation
    if (fabric.stretchPercentage) {
      const stretchValid = this.validateStretchPercentage(fabric.stretchPercentage);
      if (!stretchValid) {
        errors.push(`Invalid stretch percentage: ${fabric.stretchPercentage} (expected: 0-100%)`);
      }
    }

    // Air permeability validation
    if (fabric.airPermeability) {
      const airValid = this.validateAirPermeability(fabric.airPermeability);
      if (!airValid) {
        errors.push(
          `Invalid air permeability: ${fabric.airPermeability} (expected: 0-1000 L/m²/s)`,
        );
      }
    }

    // Water column validation
    if (fabric.waterColumn) {
      const waterValid = this.validateWaterColumn(fabric.waterColumn);
      if (!waterValid) {
        errors.push(`Invalid water column: ${fabric.waterColumn} (expected: 0-30000 mm)`);
      }
    }

    // Moisture management validation
    if (fabric.enhancedMoistureManagement) {
      const moistureValid = this.validateMoistureManagement(fabric.enhancedMoistureManagement);
      if (!moistureValid) {
        errors.push(
          `Invalid moisture management rating: ${fabric.enhancedMoistureManagement} (expected: 1-5/5)`,
        );
      }
    }

    // Wicking rate validation
    if (fabric.wickingRate) {
      const wickingValid = this.validateWickingRate(fabric.wickingRate);
      if (!wickingValid) {
        errors.push(`Invalid wicking rate: ${fabric.wickingRate} (expected: 0-500 mm/hr)`);
      }
    }

    // Drying time validation
    if (fabric.dryingTime) {
      const dryingValid = this.validateDryingTime(fabric.dryingTime);
      if (!dryingValid) {
        errors.push(`Invalid drying time: ${fabric.dryingTime} (expected: 0-300 minutes)`);
      }
    }

    // Abrasion resistance validation
    if (fabric.abrasionResistance) {
      const abrasionValid = this.validateAbrasionResistance(fabric.abrasionResistance);
      if (!abrasionValid) {
        errors.push(`Invalid abrasion resistance: ${fabric.abrasionResistance} (expected: 1-5/5)`);
      }
    }

    // Pilling grade validation
    if (fabric.pillingGrade) {
      const pillingValid = this.validatePillingGrade(fabric.pillingGrade);
      if (!pillingValid) {
        errors.push(`Invalid pilling grade: ${fabric.pillingGrade} (expected: 1-5)`);
      }
    }

    // Shrinkage tolerance validation
    if (fabric.shrinkageTolerance) {
      const shrinkageValid = this.validateShrinkageTolerance(fabric.shrinkageTolerance);
      if (!shrinkageValid) {
        errors.push(`Invalid shrinkage tolerance: ${fabric.shrinkageTolerance} (expected: 0-20%)`);
      }
    }

    // Wash temperature validation
    if (fabric.washTemperature) {
      const washValid = this.validateWashTemperature(fabric.washTemperature);
      if (!washValid) {
        errors.push(`Invalid wash temperature: ${fabric.washTemperature} (expected: 0-100°C)`);
      }
    }

    // Composition validation
    if (fabric.compositions && fabric.compositions.length > 0) {
      const compositionValid = this.validateCompositions(fabric.compositions);
      if (!compositionValid.isValid) {
        errors.push(...compositionValid.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateWeight(weight: string): boolean {
    // Match patterns like "120-200 GSM" or "180 GSM"
    const gsmMatch = weight.match(/(\d+)(?:-(\d+))?\s*GSM/i);
    if (!gsmMatch) {
      return false;
    }

    const minWeight = parseInt(gsmMatch[1]!, 10);
    const maxWeight = gsmMatch[2] ? parseInt(gsmMatch[2], 10) : minWeight;

    return minWeight >= 50 && maxWeight <= 500 && minWeight <= maxWeight;
  }

  private validateSustainabilityScore(score: string): boolean {
    const numScore = parseInt(score, 10);
    return numScore >= 1 && numScore <= 5;
  }

  private validateStretchPercentage(stretch: string): boolean {
    // Match patterns like "15-25%" or "30%"
    const stretchMatch = stretch.match(/(\d+)(?:-(\d+))?%/);
    if (!stretchMatch) {
      return false;
    }

    const minStretch = parseInt(stretchMatch[1]!, 10);
    const maxStretch = stretchMatch[2] ? parseInt(stretchMatch[2], 10) : minStretch;

    return minStretch >= 0 && maxStretch <= 100 && minStretch <= maxStretch;
  }

  private validateAirPermeability(airPerm: string): boolean {
    // Match patterns like "150-300 L/m²/s"
    const airMatch = airPerm.match(/(\d+)(?:-(\d+))?\s*L\/m²\/s/i);
    if (!airMatch) {
      return false;
    }

    const minAir = parseInt(airMatch[1]!, 10);
    const maxAir = airMatch[2] ? parseInt(airMatch[2], 10) : minAir;

    return minAir >= 0 && maxAir <= 1000 && minAir <= maxAir;
  }

  private validateWaterColumn(water: string): boolean {
    // Match patterns like "0-5 mm" or "0 mm"
    const waterMatch = water.match(/(\d+)(?:-(\d+))?\s*mm/i);
    if (!waterMatch) {
      return false;
    }

    const minWater = parseInt(waterMatch[1]!, 10);
    const maxWater = waterMatch[2] ? parseInt(waterMatch[2], 10) : minWater;

    return minWater >= 0 && maxWater <= 30000 && minWater <= maxWater;
  }

  private validateMoistureManagement(moisture: string): boolean {
    // Match patterns like "3-4/5" or "4/5"
    const moistureMatch = moisture.match(/(\d+)(?:-(\d+))?\/5/);
    if (!moistureMatch) {
      return false;
    }

    const minMoisture = parseInt(moistureMatch[1]!, 10);
    const maxMoisture = moistureMatch[2] ? parseInt(moistureMatch[2], 10) : minMoisture;

    return minMoisture >= 1 && maxMoisture <= 5 && minMoisture <= maxMoisture;
  }

  private validateWickingRate(wicking: string): boolean {
    // Match patterns like "120-180 mm/hr"
    const wickingMatch = wicking.match(/(\d+)(?:-(\d+))?\s*mm\/hr/i);
    if (!wickingMatch) {
      return false;
    }

    const minWicking = parseInt(wickingMatch[1]!, 10);
    const maxWicking = wickingMatch[2] ? parseInt(wickingMatch[2], 10) : minWicking;

    return minWicking >= 0 && maxWicking <= 500 && minWicking <= maxWicking;
  }

  private validateDryingTime(drying: string): boolean {
    // Match patterns like "45-75 minutes"
    const dryingMatch = drying.match(/(\d+)(?:-(\d+))?\s*minutes?/i);
    if (!dryingMatch) {
      return false;
    }

    const minDrying = parseInt(dryingMatch[1]!, 10);
    const maxDrying = dryingMatch[2] ? parseInt(dryingMatch[2], 10) : minDrying;

    return minDrying >= 0 && maxDrying <= 300 && minDrying <= maxDrying;
  }

  private validateAbrasionResistance(abrasion: string): boolean {
    // Match patterns like "3/5" or "3-4/5"
    const abrasionMatch = abrasion.match(/(\d+)(?:-(\d+))?\/5/);
    if (!abrasionMatch) {
      return false;
    }

    const minAbrasion = parseInt(abrasionMatch[1]!, 10);
    const maxAbrasion = abrasionMatch[2] ? parseInt(abrasionMatch[2], 10) : minAbrasion;

    return minAbrasion >= 1 && maxAbrasion <= 5 && minAbrasion <= maxAbrasion;
  }

  private validatePillingGrade(pilling: string): boolean {
    // Match patterns like "3-4" or "4"
    const pillingMatch = pilling.match(/(\d+)(?:-(\d+))?/);
    if (!pillingMatch) {
      return false;
    }

    const minPilling = parseInt(pillingMatch[1]!, 10);
    const maxPilling = pillingMatch[2] ? parseInt(pillingMatch[2], 10) : minPilling;

    return minPilling >= 1 && maxPilling <= 5 && minPilling <= maxPilling;
  }

  private validateShrinkageTolerance(shrinkage: string): boolean {
    // Match patterns like "3-5%" or "4%"
    const shrinkageMatch = shrinkage.match(/(\d+)(?:-(\d+))?%/);
    if (!shrinkageMatch) {
      return false;
    }

    const minShrinkage = parseInt(shrinkageMatch[1]!, 10);
    const maxShrinkage = shrinkageMatch[2] ? parseInt(shrinkageMatch[2], 10) : minShrinkage;

    return minShrinkage >= 0 && maxShrinkage <= 20 && minShrinkage <= maxShrinkage;
  }

  private validateWashTemperature(temp: string): boolean {
    // Match patterns like "30-60°C" or "40°C"
    const tempMatch = temp.match(/(\d+)(?:-(\d+))?°C/);
    if (!tempMatch) {
      return false;
    }

    const minTemp = parseInt(tempMatch[1]!, 10);
    const maxTemp = tempMatch[2] ? parseInt(tempMatch[2], 10) : minTemp;

    return minTemp >= 0 && maxTemp <= 100 && minTemp <= maxTemp;
  }

  private validateCompositions(compositions: any[]): ValidationResult {
    const errors: string[] = [];

    if (compositions.length === 0) {
      errors.push("At least one composition is required");
    }

    let hasDefault = false;

    for (const composition of compositions) {
      if (composition.isDefault) {
        if (hasDefault) {
          errors.push("Only one composition can be marked as default");
        }
        hasDefault = true;
      }

      if (!composition.fibers || composition.fibers.length === 0) {
        errors.push(`Composition "${composition.name}" has no fibers`);
        continue;
      }

      // Validate percentage totals
      let totalPercentage = 0;
      for (const fiber of composition.fibers) {
        const percentage = parseInt(fiber.percentage.replace("%", ""), 10);
        if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
          errors.push(
            `Invalid fiber percentage in composition "${composition.name}": ${fiber.percentage}`,
          );
        } else {
          totalPercentage += percentage;
        }
      }

      if (totalPercentage !== 100) {
        errors.push(
          `Composition "${composition.name}" percentages don't add up to 100% (total: ${totalPercentage}%)`,
        );
      }
    }

    if (!hasDefault) {
      errors.push("At least one composition must be marked as default");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
