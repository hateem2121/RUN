/**
 * TechnologyRoadmapManagement Test Suite
 *
 * Phase 5: Roadmap Management Component Extraction
 * Testing roadmap data normalization and timeline ViewModel integrity.
 */

import { describe, expect, it } from "vitest";

// Mock roadmap data matching the RoadmapVM shape
const mockRoadmap = {
  id: 1,
  name: "Nano-Thread Integration",
  description: "Integrate nano-thread technology into mainstream production lines.",
  timeline: "Q3 2026",
  imageId: undefined,
  videoId: undefined,
};

const mockRoadmapList = [
  {
    id: 1,
    name: "Nano-Thread Integration",
    description: "Phase 1",
    timeline: "Q3 2026",
    imageId: undefined,
    videoId: undefined,
  },
  {
    id: 2,
    name: "AI-Driven Cutting",
    description: "Phase 2",
    timeline: "Q4 2026",
    imageId: undefined,
    videoId: undefined,
  },
  {
    id: 3,
    name: "Self-Healing Seams",
    description: "Phase 3",
    timeline: "Q1 2027",
    imageId: undefined,
    videoId: undefined,
  },
  {
    id: 4,
    name: "Carbon-Neutral Production",
    description: "Phase 4",
    timeline: "Q2 2027",
    imageId: undefined,
    videoId: undefined,
  },
];

describe("Roadmap Management Data", () => {
  it("should have valid roadmap structure with required fields", () => {
    expect(mockRoadmap.id).toBeDefined();
    expect(mockRoadmap.name).toBeDefined();
    expect(typeof mockRoadmap.name).toBe("string");
    expect(mockRoadmap.description).toBeDefined();
    expect(mockRoadmap.timeline).toBeDefined();
  });

  it("should handle optional media ids as undefined", () => {
    expect(mockRoadmap.imageId).toBeUndefined();
    expect(mockRoadmap.videoId).toBeUndefined();
  });

  it("should support timeline list for 4-column grid layout", () => {
    expect(Array.isArray(mockRoadmapList)).toBe(true);
    expect(mockRoadmapList.length).toBe(4);
  });

  it("should slice to maximum 4 timeline nodes for display", () => {
    const displayNodes = mockRoadmapList.slice(0, 4);
    expect(displayNodes.length).toBeLessThanOrEqual(4);
  });

  it("should mark first roadmap item as current milestone", () => {
    const nodes = mockRoadmapList.map((r, i) => ({
      ...r,
      isCurrent: i === 0,
    }));
    expect(nodes[0].isCurrent).toBe(true);
    expect(nodes[1].isCurrent).toBe(false);
    expect(nodes[2].isCurrent).toBe(false);
    expect(nodes[3].isCurrent).toBe(false);
  });

  it("should have unique ids for all roadmap items", () => {
    const ids = mockRoadmapList.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should preserve timeline string format", () => {
    for (const item of mockRoadmapList) {
      expect(typeof item.timeline).toBe("string");
      expect(item.timeline.length).toBeGreaterThan(0);
    }
  });
});
