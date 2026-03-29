/**
 * Technology Page ViewModels
 *
 * These types define the contract between the technology route loader
 * and its child components. They are intentionally decoupled from
 * Drizzle schema types to allow for data transformation in the loader.
 */

/**
 * Innovation ViewModel
 * Used by InnovationsSection component
 */
export interface InnovationVM {
  id: number;
  name: string;
  description: string;
  shortDescription?: string | undefined;
  iconName?: string | undefined;
  status?: string | undefined;
  technicalDetails?: Record<string, unknown> | undefined;
  relatedProducts?: string[];
  category: string;
  benefits: string[] | null;
  imageId?: number | undefined;
  videoId?: number | undefined;
  developmentYear?: string | undefined;
}

/**
 * Equipment ViewModel
 * Used by EquipmentSection component
 */
export interface EquipmentVM {
  id: number;
  name: string;
  brand: string;
  model: string;
  category?: string | undefined;
  quantity?: number | undefined;
  capacity?: string | undefined;
  maintenanceSchedule?: string | undefined;
  certifications?: string[];
  capabilities: string[];
  specs: Record<string, unknown> | null;
  imageId?: number | undefined;
  installationDate?: string | undefined;
}

/**
 * Research ViewModel
 * Used by ResearchSection component
 */
export interface ResearchVM {
  id: number;
  name: string;
  description: string;
  researchArea?: string | undefined;
  status?: string | undefined;
  startDate?: string | undefined;
  expectedCompletion?: string | undefined;
  funding?: number | undefined;
  teamMembers?: string[];
  objectives?: string[];
  partners?: string[];
  outcomes?: string[];
  publications?: string[];
  imageId?: number | undefined;
  videoId?: number | undefined;
}

/**
 * Roadmap ViewModel
 * Used by RoadmapSection component
 */
export interface RoadmapVM {
  id: number;
  name: string;
  description: string;
  timeline: string;
  imageId?: number | undefined;
  videoId?: number | undefined;
}

/**
 * Hero ViewModel
 * Used by technology page hero section
 */
export interface HeroVM {
  title: string;
  subtitle: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaLink: string;
  backgroundImageId: number | null;
}

/**
 * CTA ViewModel
 * Used by TechnologyCta component
 */
export interface CtaVM {
  headline: string;
  subheadline: string;
  primaryText: string;
  secondaryText: string;
}
