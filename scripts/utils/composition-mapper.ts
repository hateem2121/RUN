// @ts-nocheck
/**
 * Composition Mapper Utility
 * Maps fiber compositions to existing fiber IDs in the database
 */

import type { ReplitStorage } from '../../server/replit-storage.js';
import { Fiber } from '../../shared/schema-types.js';

interface CompositionMappingResult {
  success: boolean;
  compositions: Array<{
    name: string;
    isDefault: boolean;
    fibers: Array<{
      fiberId: number;
      percentage: string;
    }>;
  }>;
  missingFibers: string[];
  errors: string[];
}

export class CompositionMapper {
  private storage: ReplitStorage;
  private fiberMap: Map<string, number> = new Map();
  private initialized = false;
  
  constructor(storage: ReplitStorage) {
    this.storage = storage;
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('🔍 Loading existing fibers for composition mapping...');
    const fibers = await this.storage.getFibers();
    
    // Create mapping from fiber names to IDs
    for (const fiber of fibers) {
      // Map exact name
      this.fiberMap.set(fiber.name.toLowerCase(), fiber.id);
      
      // Map common variations
      const variations = this.getFiberVariations(fiber.name);
      for (const variation of variations) {
        this.fiberMap.set(variation.toLowerCase(), fiber.id);
      }
    }
    
    console.log(`✅ Mapped ${fibers.length} fibers with ${this.fiberMap.size} total name variations`);
    this.initialized = true;
  }
  
  async mapCompositions(compositions: Array<{
    name: string;
    isDefault: boolean;
    fibers: Array<{
      fiberName: string;
      percentage: string;
    }>;
  }>): Promise<CompositionMappingResult> {
    
    if (!this.initialized) {
      await this.initialize();
    }
    
    const result: CompositionMappingResult = {
      success: true,
      compositions: [],
      missingFibers: [],
      errors: []
    };
    
    for (const composition of compositions) {
      const mappedComposition = {
        name: composition.name,
        isDefault: composition.isDefault,
        fibers: [] as Array<{
          fiberId: number;
          percentage: string;
        }>
      };
      
      let compositionSuccess = true;
      
      for (const fiber of composition.fibers) {
        const fiberId = this.findFiberId(fiber.fiberName);
        
        if (fiberId) {
          mappedComposition.fibers.push({
            fiberId,
            percentage: fiber.percentage
          });
        } else {
          result.missingFibers.push(fiber.fiberName);
          result.errors.push(`Fiber not found: ${fiber.fiberName} in composition "${composition.name}"`);
          compositionSuccess = false;
        }
      }
      
      if (!compositionSuccess) {
        result.success = false;
      }
      
      result.compositions.push(mappedComposition);
    }
    
    return result;
  }
  
  private findFiberId(fiberName: string): number | null {
    const normalizedName = fiberName.toLowerCase().trim();
    
    // Direct lookup
    if (this.fiberMap.has(normalizedName)) {
      return this.fiberMap.get(normalizedName)!;
    }
    
    // Try with common variations
    const variations = this.getFiberVariations(fiberName);
    for (const variation of variations) {
      if (this.fiberMap.has(variation.toLowerCase())) {
        return this.fiberMap.get(variation.toLowerCase())!;
      }
    }
    
    return null;
  }
  
  private getFiberVariations(fiberName: string): string[] {
    const variations = [fiberName];
    const name = fiberName.toLowerCase().trim();
    
    // Add common variations
    const variationMap: { [key: string]: string[] } = {
      'polyester': ['polyester', 'pet', 'polyethylene terephthalate'],
      'recycled polyester': ['recycled polyester', 'rpet', 'recycled pet', 'recycled plastic bottles'],
      'cotton': ['cotton', 'organic cotton', 'pima cotton', 'conventional cotton'],
      'spandex': ['spandex', 'elastane', 'lycra', 'stretch fiber'],
      'nylon': ['nylon', 'polyamide', 'pa'],
      'recycled nylon': ['recycled nylon', 'recycled polyamide'],
      'merino wool': ['merino wool', 'merino', 'wool'],
      'bamboo fiber': ['bamboo fiber', 'bamboo'],
      'tencel lyocell': ['tencel lyocell', 'lyocell', 'tencel'],
      'tencel modal': ['tencel modal', 'modal', 'tencel'],
      'hemp fiber': ['hemp fiber', 'hemp'],
      'recycled wool': ['recycled wool', 'recycled merino wool']
    };
    
    // Find matching variations
    for (const [key, values] of Object.entries(variationMap)) {
      if (values.some(v => v === name)) {
        variations.push(...values);
      }
    }
    
    return [...new Set(variations)];
  }
  
  async createMissingFibers(missingFibers: string[]): Promise<void> {
    console.log(`🔧 Creating ${missingFibers.length} missing fibers...`);
    
    const uniqueFibers = [...new Set(missingFibers)];
    
    for (const fiberName of uniqueFibers) {
      const fiberData = this.createFiberData(fiberName);
      
      try {
        const createdFiber = await this.storage.createFiber(fiberData);
        this.fiberMap.set(fiberName.toLowerCase(), createdFiber.id);
        console.log(`✅ Created fiber: ${createdFiber.name} (ID: ${createdFiber.id})`);
      } catch (error) {
        console.error(`❌ Failed to create fiber: ${fiberName}`, error);
      }
    }
  }
  
  private createFiberData(fiberName: string) {
    const name = fiberName.trim();
    const normalizedName = name.toLowerCase();
    
    // Define fiber properties based on type
    const fiberProperties: { [key: string]: any } = {
      'polyester': {
        type: 'Synthetic (Petroleum-based)',
        description: 'Durable synthetic fiber with excellent moisture-wicking properties',
        sustainabilityScore: 2,
        environmentalImpactNotes: 'Petroleum-based, long-lasting but not biodegradable',
        properties: {
          strength: 'High',
          moisture: 'Wicks moisture away from skin',
          durability: 'Excellent',
          stretchability: 'Low to moderate',
          breathability: 'Good',
          dyeability: 'Good'
        }
      },
      'recycled polyester': {
        type: 'Recycled Synthetic',
        description: 'Recycled polyester from plastic bottles, offering sustainability benefits',
        sustainabilityScore: 4,
        environmentalImpactNotes: 'Made from recycled plastic bottles, reduces waste',
        properties: {
          strength: 'High',
          moisture: 'Wicks moisture away from skin',
          durability: 'Excellent',
          stretchability: 'Low to moderate',
          breathability: 'Good',
          recyclability: 'Excellent'
        }
      },
      'cotton': {
        type: 'Natural (Plant-based)',
        description: 'Natural fiber offering comfort and breathability',
        sustainabilityScore: 3,
        environmentalImpactNotes: 'Natural and biodegradable, but water-intensive cultivation',
        properties: {
          strength: 'Moderate',
          moisture: 'Absorbs moisture',
          durability: 'Good',
          stretchability: 'Low',
          breathability: 'Excellent',
          comfort: 'Excellent'
        }
      },
      'spandex': {
        type: 'Synthetic (Elastane)',
        description: 'Elastic synthetic fiber providing stretch and recovery',
        sustainabilityScore: 1,
        environmentalImpactNotes: 'Synthetic and non-biodegradable, difficult to recycle',
        properties: {
          strength: 'Moderate',
          moisture: 'Low moisture absorption',
          durability: 'Good',
          stretchability: 'Excellent',
          recovery: 'Excellent',
          comfort: 'Good'
        }
      },
      'nylon': {
        type: 'Synthetic (Polyamide)',
        description: 'Strong synthetic fiber with excellent durability',
        sustainabilityScore: 2,
        environmentalImpactNotes: 'Petroleum-based, durable but not biodegradable',
        properties: {
          strength: 'Very high',
          moisture: 'Quick-drying',
          durability: 'Excellent',
          stretchability: 'Moderate',
          breathability: 'Good',
          abrasionResistance: 'Excellent'
        }
      }
    };
    
    // Find matching properties or use defaults
    let fiberProps = fiberProperties[normalizedName] || 
                     fiberProperties['polyester']; // Default fallback
    
    // Check for variations
    if (normalizedName.includes('recycled')) {
      fiberProps = fiberProperties['recycled polyester'];
    } else if (normalizedName.includes('elastane')) {
      fiberProps = fiberProperties['spandex'];
    }
    
    return {
      name,
      type: fiberProps.type,
      description: fiberProps.description,
      sustainabilityScore: fiberProps.sustainabilityScore,
      environmentalImpactNotes: fiberProps.environmentalImpactNotes,
      properties: fiberProps.properties,
      isActive: true
    };
  }
}