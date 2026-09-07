import { describe, expect, it } from "vitest";
import {
  createXPBDClothEngine,
  isWebGPUSupported,
  XPBD_WGSL_COMPUTE_SHADER,
  XPBDClothEngine,
} from "@/lib/cloth-simulation/xpbd-cloth-engine.js";

describe("3D-06: WebGPU WGSL XPBD Cloth Drape Simulation Engine", () => {
  describe("Initialization & Constraint Topology", () => {
    it("should initialize correct particle count and 3D grid layout", () => {
      const engine = new XPBDClothEngine();
      const width = 4;
      const height = 5;
      const spacing = 0.05;

      engine.initialize(width, height, spacing);

      expect(engine.getParticleCount()).toBe(width * height);
      const positions = engine.getPositions();
      expect(positions.length).toBe(width * height * 3);

      // Verify origin particle (0, 0)
      expect(positions[0]).toBe(0); // x
      expect(positions[1]).toBe(0); // y
      expect(positions[2]).toBe(0); // z

      // Verify particle at (1, 0)
      expect(positions[3]).toBeCloseTo(0.05, 5); // x
      expect(positions[4]).toBeCloseTo(0, 5); // y
      expect(positions[5]).toBeCloseTo(0, 5); // z

      // Verify particle at (0, 1)
      const row1Idx = width * 3;
      expect(positions[row1Idx]).toBeCloseTo(0, 5); // x
      expect(positions[row1Idx + 1]).toBeCloseTo(-0.05, 5); // y
      expect(positions[row1Idx + 2]).toBeCloseTo(0, 5); // z
    });

    it("should generate correct constraint counts for structural, shear, and bending topology", () => {
      const engine = new XPBDClothEngine();
      const w = 4;
      const h = 4;
      const spacing = 0.1;

      engine.initialize(w, h, spacing);

      const counts = engine.getConstraintCount();

      // Theoretical counts for 4x4 grid:
      // Structural horizontal: (w - 1) * h = 3 * 4 = 12
      // Structural vertical: w * (h - 1) = 4 * 3 = 12
      // Stretch total = 24
      const expectedStretch = (w - 1) * h + w * (h - 1);
      expect(counts.stretch).toBe(expectedStretch);
      expect(counts.stretch).toBe(24);

      // Shear diagonals: 2 * (w - 1) * (h - 1) = 2 * 3 * 3 = 18
      const expectedShear = 2 * (w - 1) * (h - 1);
      expect(counts.shear).toBe(expectedShear);
      expect(counts.shear).toBe(18);

      // Bending:
      // Horizontal (w - 2) * h = 2 * 4 = 8
      // Vertical w * (h - 2) = 4 * 2 = 8
      // Bending total = 16
      const expectedBending = (w - 2) * h + w * (h - 2);
      expect(counts.bending).toBe(expectedBending);
      expect(counts.bending).toBe(16);

      // Total = 24 + 18 + 16 = 58
      expect(counts.total).toBe(expectedStretch + expectedShear + expectedBending);
      expect(counts.total).toBe(58);

      // Verify constraint properties
      const constraints = engine.getConstraints();
      expect(constraints.length).toBe(counts.total);

      for (const c of constraints) {
        expect(c.p1).toBeGreaterThanOrEqual(0);
        expect(c.p1).toBeLessThan(w * h);
        expect(c.p2).toBeGreaterThanOrEqual(0);
        expect(c.p2).toBeLessThan(w * h);
        expect(c.p1).not.toBe(c.p2);

        if (c.type === "stretch") {
          expect(c.restLength).toBeCloseTo(spacing, 5);
        } else if (c.type === "shear") {
          expect(c.restLength).toBeCloseTo(spacing * Math.SQRT2, 5);
        } else if (c.type === "bending") {
          expect(c.restLength).toBeCloseTo(spacing * 2, 5);
        }
      }
    });

    it("should throw error for invalid dimensions or spacing", () => {
      const engine = new XPBDClothEngine();
      expect(() => engine.initialize(0, 5, 0.1)).toThrow(/Invalid grid dimensions/);
      expect(() => engine.initialize(5, -1, 0.1)).toThrow(/Invalid grid dimensions/);
      expect(() => engine.initialize(5, 5, 0)).toThrow(/Invalid spacing/);
      expect(() => engine.initialize(5, 5, -0.1)).toThrow(/Invalid spacing/);
    });

    it("should support pinCorners, pinTopRow, and manual pinning", () => {
      const engine = createXPBDClothEngine();
      const w = 4;
      const h = 4;
      engine.initialize(w, h, 0.1, { pinCorners: true });

      expect(engine.isPinned(0)).toBe(true);
      expect(engine.isPinned(w - 1)).toBe(true);
      expect(engine.isPinned(1)).toBe(false);

      // Manual pinning and unpinning
      engine.pinParticle(5);
      expect(engine.isPinned(5)).toBe(true);
      engine.unpinParticle(5);
      expect(engine.isPinned(5)).toBe(false);

      // Top row pinning
      const engine2 = new XPBDClothEngine();
      engine2.initialize(w, h, 0.1, { pinTopRow: true });
      for (let x = 0; x < w; x++) {
        expect(engine2.isPinned(x)).toBe(true);
      }
      expect(engine2.isPinned(w)).toBe(false);
    });
  });

  describe("Physics Simulation: Gravity, Constraints & Damping", () => {
    it("should simulate downward gravity acceleration over time steps", () => {
      const engine = new XPBDClothEngine();
      // 2x1 particles with no pinning
      engine.initialize(2, 1, 0.1, {
        stiffness: 1.0,
        damping: 0.0,
        gravity: [0, -9.81, 0],
      });

      const initialPositions = new Float32Array(engine.getPositions());
      expect(initialPositions[1]).toBe(0); // y of particle 0
      expect(initialPositions[4]).toBe(0); // y of particle 1

      // Step with dt = 0.016 (approx 60fps)
      engine.step(0.016);

      const postPositions = engine.getPositions();
      // Under downward gravity, y should decrease (become negative)
      expect(postPositions[1]).toBeLessThan(0);
      expect(postPositions[4]).toBeLessThan(0);

      // Both particles should have fallen equally
      expect(postPositions[1]).toBeCloseTo(postPositions[4], 5);

      // Velocities should also be negative in y
      const velocities = engine.getVelocities();
      expect(velocities[1]).toBeLessThan(0);
      expect(velocities[4]).toBeLessThan(0);
    });

    it("should relax stretched distance constraints towards rest length", () => {
      const engine = new XPBDClothEngine();
      const restLength = 1.0;

      // 2x1 particles with zero gravity so only constraint projection acts
      engine.initialize(2, 1, restLength, {
        stiffness: 1.0,
        iterations: 10,
        gravity: [0, 0, 0],
        damping: 0.0,
      });

      const positions = engine.getPositions();
      // Particle 0 is at (0, 0, 0)
      // Displace particle 1 from (1.0, 0, 0) to (3.0, 0, 0) — 200% stretched
      positions[3] = 3.0; // x of particle 1

      const initialDistance = Math.abs(positions[3] - positions[0]);
      expect(initialDistance).toBeCloseTo(3.0, 5);

      // Step simulation
      engine.step(0.016);

      const relaxedPositions = engine.getPositions();
      const newDistance = Math.abs(relaxedPositions[3] - relaxedPositions[0]);

      // Constraint projection should have pulled particles closer towards rest length (1.0)
      expect(newDistance).toBeLessThan(initialDistance);
      expect(newDistance).toBeCloseTo(restLength, 2);
    });

    it("should keep pinned particles fixed while unpinned particles drape under gravity", () => {
      const engine = new XPBDClothEngine();
      // 3x3 cloth with top corners pinned
      engine.initialize(3, 3, 0.1, {
        pinCorners: true,
        stiffness: 0.9,
        iterations: 8,
        gravity: [0, -9.81, 0],
      });

      const initialPositions = new Float32Array(engine.getPositions());
      const p0_y = initialPositions[1];
      const p2_y = initialPositions[7]; // (2, 0) is particle 2: index 2 * 3 + 1 = 7

      // Run 20 steps
      for (let i = 0; i < 20; i++) {
        engine.step(0.016);
      }

      const postPositions = engine.getPositions();

      // Pinned top corners must not move
      expect(postPositions[1]).toBeCloseTo(p0_y, 6);
      expect(postPositions[7]).toBeCloseTo(p2_y, 6);

      // Unpinned bottom center particle (particle 7: (1, 2) -> index 7 * 3 + 1 = 22)
      // must have dropped significantly
      const centerBottomY = postPositions[7 * 3 + 1];
      expect(centerBottomY).toBeLessThan(initialPositions[7 * 3 + 1]);
    });
  });

  describe("Numerical Stability", () => {
    it("should remain numerically stable with zero NaN or Infinity after 100 steps", () => {
      const engine = new XPBDClothEngine();
      engine.initialize(5, 5, 0.05, {
        pinCorners: true,
        stiffness: 0.95,
        bendingStiffness: 0.4,
        damping: 0.03,
        gravity: [0, -9.81, 0],
        wind: [0.5, 0.1, 0.2],
        iterations: 5,
      });

      // Execute 100 simulation steps with fluctuating delta times (10ms to 40ms)
      for (let step = 0; step < 100; step++) {
        const variableDt = 0.01 + (step % 4) * 0.008;
        engine.step(variableDt);
      }

      const positions = engine.getPositions();
      const velocities = engine.getVelocities();

      expect(positions.length).toBe(5 * 5 * 3);
      expect(velocities.length).toBe(5 * 5 * 3);

      for (let i = 0; i < positions.length; i++) {
        expect(Number.isNaN(positions[i])).toBe(false);
        expect(Number.isFinite(positions[i])).toBe(true);
      }

      for (let i = 0; i < velocities.length; i++) {
        expect(Number.isNaN(velocities[i])).toBe(false);
        expect(Number.isFinite(velocities[i])).toBe(true);
      }
    });

    it("should gracefully handle zero, negative, or non-finite delta times", () => {
      const engine = new XPBDClothEngine();
      engine.initialize(3, 3, 0.1);

      const before = new Float32Array(engine.getPositions());

      engine.step(0);
      engine.step(-0.016);
      engine.step(Number.NaN);
      engine.step(Number.POSITIVE_INFINITY);

      const after = engine.getPositions();
      expect(after).toEqual(before);
    });
  });

  describe("WebGPU Integration & Shader Template", () => {
    it("should export isWebGPUSupported and check environment correctly", () => {
      const engine = new XPBDClothEngine();
      expect(typeof engine.isWebGPUSupported()).toBe("boolean");
      expect(typeof isWebGPUSupported()).toBe("boolean");

      // In JSDOM without WebGPU mock, isWebGPUSupported should safely return false
      expect(isWebGPUSupported()).toBe(false);
    });

    it("should provide valid WGSL compute shader code containing all simulation passes", () => {
      const engine = new XPBDClothEngine();
      const shader = engine.getWGSLShaderCode();

      expect(shader).toBe(XPBD_WGSL_COMPUTE_SHADER);
      expect(shader).toContain("@compute @workgroup_size(64)");
      expect(shader).toContain("fn verletIntegrate");
      expect(shader).toContain("fn projectDistanceConstraints");
      expect(shader).toContain("fn projectBendingConstraints");
      expect(shader).toContain("fn updateVelocities");
      expect(shader).toContain("struct Particle");
      expect(shader).toContain("struct DistanceConstraint");
      expect(shader).toContain("struct SimUniforms");
    });
  });
});
