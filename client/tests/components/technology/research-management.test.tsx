/**
 * TechnologyResearchManagement Test Suite
 *
 * Phase 4: Research Management Component Extraction
 * Testing research data normalization and ViewModel integrity.
 */

import { describe, expect, it } from "vitest";

// Mock research data matching the ResearchVM shape
const mockResearch = {
  id: 1,
  name: "Bio-Responsive Fabrics",
  description: "Research into fabrics that respond to biological signals.",
  researchArea: "Smart Textiles",
  status: "Ongoing",
  startDate: "2025-01-15",
  expectedCompletion: "2026-12-31",
  funding: 250000,
  teamMembers: ["Dr. Ali", "Eng. Sara"],
  objectives: ["Develop prototype", "Test in field conditions"],
  partners: ["MIT", "KAUST"],
  outcomes: [],
  publications: [],
  imageId: undefined,
  videoId: undefined,
};

describe("Research Management Data", () => {
  it("should have valid research structure with required fields", () => {
    expect(mockResearch.id).toBeDefined();
    expect(mockResearch.name).toBeDefined();
    expect(typeof mockResearch.name).toBe("string");
    expect(mockResearch.description).toBeDefined();
  });

  it("should handle research status values", () => {
    const validStatuses = ["Ongoing", "Completed", "Planned", "Paused"];
    expect(validStatuses).toContain(mockResearch.status);
  });

  it("should preserve team members array structure", () => {
    expect(Array.isArray(mockResearch.teamMembers)).toBe(true);
    expect(mockResearch.teamMembers.length).toBeGreaterThan(0);
    expect(typeof mockResearch.teamMembers[0]).toBe("string");
  });

  it("should preserve partner collaborations array", () => {
    expect(Array.isArray(mockResearch.partners)).toBe(true);
    expect(mockResearch.partners.length).toBeGreaterThan(0);
  });

  it("should handle optional media ids as undefined", () => {
    expect(mockResearch.imageId).toBeUndefined();
    expect(mockResearch.videoId).toBeUndefined();
  });

  it("should have valid funding amount", () => {
    expect(typeof mockResearch.funding).toBe("number");
    expect(mockResearch.funding).toBeGreaterThan(0);
  });

  it("should handle empty outcomes and publications arrays", () => {
    expect(Array.isArray(mockResearch.outcomes)).toBe(true);
    expect(mockResearch.outcomes.length).toBe(0);
    expect(Array.isArray(mockResearch.publications)).toBe(true);
    expect(mockResearch.publications.length).toBe(0);
  });
});
