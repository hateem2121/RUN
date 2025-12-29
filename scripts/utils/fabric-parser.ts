/**
 * Fabric Parser Utility
 * Parses the complete fabric guide text file and extracts structured data
 */

interface ParsedFabric {
  name: string;
  description: string;
  fabricType: string;
  weight: string;
  compositions: Array<{
    name: string;
    isDefault: boolean;
    fibers: Array<{
      fiberName: string;
      percentage: string;
    }>;
  }>;
  keyApplications: string[];
  stretchPercentage: string;
  airPermeability: string;
  waterColumn: string;
  enhancedMoistureManagement: string;
  wickingRate: string;
  dryingTime: string;
  performanceFeatures: string[];
  yarnCountConstruction: string;
  abrasionResistance: string;
  pillingGrade: string;
  shrinkageTolerance: string;
  washTemperature: string;
  sustainabilityScore: string;
  certificationTags: string[];
  endOfLifeOptions: string[];
  careInstructions: string;
  detailedInstructions: string;
  stretchDirection: string[];
}

export class FabricParser {
  parseFile(content: string): ParsedFabric[] {
    const fabrics: ParsedFabric[] = [];

    // Split content into fabric sections (numbered sections)
    const sections = content.split(/(?=\d+\.\s+[A-Z])/);

    for (const section of sections) {
      if (section.trim().length < 100) continue; // Skip small sections

      const fabric = this.parseSection(section);
      if (fabric) {
        fabrics.push(fabric);
      }
    }

    return fabrics;
  }

  private parseSection(section: string): ParsedFabric | null {
    try {
      // Extract fabric name (after number and dot, until newline)
      const nameMatch = section.match(/^\d+\.\s+([A-Za-z\s]+?)(?=\n|$)/);
      if (!nameMatch) return null;

      const name = nameMatch[1]?.trim();

      // Parse each field
      const weight = this.extractField(section, "Weight \\(GSM\\):", "([0-9]+-[0-9]+\\s+GSM)");
      const description = this.extractField(
        section,
        "Description:",
        "([^\\n]+(?:\\n[^\\n:]+)*?)(?=\\n\\n|\\nFiber Compositions:)",
      );
      const fabricType = this.extractField(section, "Fabric Type:", "([^\\n]+)");
      const keyApplications = this.extractListField(section, "Key Applications:", "([^\\n]+)");
      const stretchPercentage = this.extractField(
        section,
        "Stretch Percentage \\(%\\):",
        "([^\\n]+)",
      );
      const airPermeability = this.extractField(section, "Air Permeability:", "([^\\n]+)");
      const waterColumn = this.extractField(section, "Water Column:", "([^\\n]+)");
      const enhancedMoistureManagement = this.extractField(
        section,
        "Enhanced Moisture Management Rating:",
        "([^\\n]+)",
      );
      const wickingRate = this.extractField(section, "Wicking Rate \\(mm/hr\\):", "([^\\n]+)");
      const dryingTime = this.extractField(section, "Drying Time \\(min\\):", "([^\\n]+)");
      const performanceFeatures = this.extractMultilineList(
        section,
        "Performance Features:",
        "Yarn Count/Construction:",
      );
      const yarnCountConstruction = this.extractField(
        section,
        "Yarn Count/Construction:",
        "([^\\n]+)",
      );
      const abrasionResistance = this.extractField(section, "Abrasion Resistance:", "([^\\n]+)");
      const pillingGrade = this.extractField(section, "Pilling Grade \\(ISO 1-5\\):", "([^\\n]+)");
      const shrinkageTolerance = this.extractField(
        section,
        "Shrinkage Tolerance \\(%\\):",
        "([^\\n]+)",
      );
      const washTemperature = this.extractField(section, "Wash Temperature \\(°C\\):", "([^\\n]+)");
      const sustainabilityScore = this.extractSustainabilityScore(section);
      const certificationTags = this.extractListField(section, "Certification Tags:", "([^\\n]+)");
      const endOfLifeOptions = this.extractListField(section, "End-of-Life Options:", "([^\\n]+)");
      const careInstructions = this.extractField(
        section,
        "Care Instructions & Restrictions:",
        "([^\\n]+)",
      );
      const detailedInstructions = this.extractField(
        section,
        "Detailed Instructions:",
        "([^\\n]+)",
      );

      // Parse fiber compositions
      const compositions = this.parseCompositions(section);

      // Extract stretch direction from stretch percentage
      const stretchDirection = this.extractStretchDirection(stretchPercentage);

      return {
        name: name || "",
        description: description || "",
        fabricType: fabricType || "",
        weight: weight || "",
        compositions,
        keyApplications,
        stretchPercentage: stretchPercentage || "",
        airPermeability: airPermeability || "",
        waterColumn: waterColumn || "",
        enhancedMoistureManagement: enhancedMoistureManagement || "",
        wickingRate: wickingRate || "",
        dryingTime: dryingTime || "",
        performanceFeatures,
        yarnCountConstruction: yarnCountConstruction || "",
        abrasionResistance: abrasionResistance || "",
        pillingGrade: pillingGrade || "",
        shrinkageTolerance: shrinkageTolerance || "",
        washTemperature: washTemperature || "",
        sustainabilityScore,
        certificationTags,
        endOfLifeOptions,
        careInstructions: careInstructions || "",
        detailedInstructions: detailedInstructions || "",
        stretchDirection,
      };
    } catch (_error) {
      return null;
    }
  }

  private extractField(section: string, fieldName: string, pattern: string): string {
    const regex = new RegExp(`${fieldName}\\s*${pattern}`, "i");
    const match = section.match(regex);
    return match ? match[1]?.trim() || "" : "";
  }

  private extractListField(section: string, fieldName: string, pattern: string): string[] {
    const value = this.extractField(section, fieldName, pattern);
    if (!value) return [];

    // Split by comma, semicolon, or "and"
    return value
      .split(/[,;]|\s+and\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private extractMultilineList(section: string, startMarker: string, endMarker: string): string[] {
    const startIndex = section.indexOf(startMarker);
    const endIndex = section.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) return [];

    const listSection = section.substring(startIndex + startMarker.length, endIndex);

    // Extract bullet points or lines
    const lines = listSection
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.includes(":"))
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter((line) => line.length > 0);

    return lines;
  }

  private extractSustainabilityScore(section: string): string {
    const scoreMatch = section.match(/Sustainability Score:\s*⭐*\s*\((\d+)\/5\s*stars?\)/i);
    return scoreMatch?.[1] ? scoreMatch[1] : "";
  }

  private parseCompositions(section: string): Array<{
    name: string;
    isDefault: boolean;
    fibers: Array<{
      fiberName: string;
      percentage: string;
    }>;
  }> {
    const compositions: Array<{
      name: string;
      isDefault: boolean;
      fibers: Array<{
        fiberName: string;
        percentage: string;
      }>;
    }> = [];

    // Extract primary compositions
    const primarySection = this.extractCompositionSection(
      section,
      "Fiber Compositions:",
      "Multiple Alternative Compositions:",
    );
    const primaryCompositions = this.parseCompositionLines(primarySection);

    // Extract alternative compositions
    const alternativeSection = this.extractCompositionSection(
      section,
      "Multiple Alternative Compositions:",
      "Fabric Type:",
    );
    const alternativeCompositions = this.parseCompositionLines(alternativeSection);

    // Add primary compositions (first one is default)
    primaryCompositions.forEach((comp, index) => {
      compositions.push({
        name: comp,
        isDefault: index === 0,
        fibers: this.parseCompositionString(comp),
      });
    });

    // Add alternative compositions
    alternativeCompositions.forEach((comp) => {
      compositions.push({
        name: comp,
        isDefault: false,
        fibers: this.parseCompositionString(comp),
      });
    });

    return compositions;
  }

  private extractCompositionSection(
    section: string,
    startMarker: string,
    endMarker: string,
  ): string {
    const startIndex = section.indexOf(startMarker);
    const endIndex = section.indexOf(endMarker);

    if (startIndex === -1) return "";
    if (endIndex === -1) return section.substring(startIndex + startMarker.length);

    return section.substring(startIndex + startMarker.length, endIndex);
  }

  private parseCompositionLines(compositionSection: string): string[] {
    return compositionSection
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.includes("%"))
      .map((line) => line.replace(/^[-•*]\s*/, "").trim());
  }

  private parseCompositionString(composition: string): Array<{
    fiberName: string;
    percentage: string;
  }> {
    const fibers: Array<{
      fiberName: string;
      percentage: string;
    }> = [];

    // Handle patterns like "65% Polyester + 35% Cotton"
    const parts = composition.split(/\s*\+\s*/);

    for (const part of parts) {
      const match = part.match(/(\d+)%\s*([^%]+)/);
      if (match) {
        const percentage = match[1]!;
        let fiberName = match[2]?.trim();

        // Clean up fiber name
        fiberName = (fiberName || "").replace(/\s*\([^)]*\)/g, ""); // Remove parentheses
        fiberName = fiberName.replace(/\s*(Organic|Conventional|Recycled|rPET)\s*/g, ""); // Remove modifiers
        fiberName = this.normalizeFiberName(fiberName);

        fibers.push({
          fiberName,
          percentage: `${percentage}%`,
        });
      } else if (part.includes("100%")) {
        // Handle "100% Cotton" format
        const singleMatch = part.match(/100%\s*([^%]+)/);
        if (singleMatch) {
          let fiberName = singleMatch[1]?.trim();
          fiberName = (fiberName || "").replace(/\s*\([^)]*\)/g, "");
          fiberName = fiberName.replace(/\s*(Organic|Conventional|Recycled|rPET)\s*/g, "");
          fiberName = this.normalizeFiberName(fiberName);

          fibers.push({
            fiberName,
            percentage: "100%",
          });
        }
      }
    }

    return fibers;
  }

  private normalizeFiberName(name: string): string {
    const normalizedName = name.toLowerCase().trim();

    // Map common variations to standard names
    const nameMap: { [key: string]: string } = {
      elastane: "Spandex",
      lycra: "Spandex",
      cotton: "Cotton",
      polyester: "Polyester",
      "recycled polyester": "Recycled Polyester",
      spandex: "Spandex",
      nylon: "Nylon",
      "recycled nylon": "Recycled Nylon",
      "recycled plastic bottles": "Recycled Polyester",
      "organic cotton": "Cotton",
      "pima cotton": "Cotton",
      "conventional cotton": "Cotton",
      "recycled cotton": "Cotton",
    };

    return nameMap[normalizedName] || name;
  }

  private extractStretchDirection(stretchPercentage: string): string[] {
    const directions: string[] = [];

    if (stretchPercentage.includes("4-way")) {
      directions.push("4-way stretch");
    } else if (stretchPercentage.includes("2-way")) {
      directions.push("2-way stretch");
    }

    return directions;
  }
}
