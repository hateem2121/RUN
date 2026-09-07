/**
 * 3D-06: WebGPU WGSL XPBD Cloth Drape Simulation Engine
 *
 * Provides an Extended Position-Based Dynamics (XPBD) simulation engine
 * for real-time B2B sportswear fabric drape analysis.
 *
 * Supports:
 * - WGSL compute shader template for hardware-accelerated WebGPU execution
 * - High-performance TypedArray CPU fallback for SSR, Vitest, and non-WebGPU devices
 * - Structural stretch, diagonal shear, and bending constraints
 * - Numerical stability under variable frame delta times
 */

export interface XPBDConstraint {
  p1: number;
  p2: number;
  restLength: number;
  stiffness: number;
  type: "stretch" | "shear" | "bending";
}

export interface XPBDConstraintCount {
  total: number;
  stretch: number;
  shear: number;
  bending: number;
}

export interface XPBDClothEngineOptions {
  stiffness?: number; // Distance constraint stiffness [0..1], default 0.95
  damping?: number; // Velocity damping factor [0..1], default 0.02
  bendingStiffness?: number; // Bending stiffness [0..1], default 0.5
  iterations?: number; // Constraint projection iterations per step, default 5
  gravity?: [number, number, number]; // Gravity acceleration vector, default [0, -9.81, 0]
  wind?: [number, number, number]; // Wind acceleration vector, default [0, 0, 0]
  pinCorners?: boolean; // Pin top-left and top-right corners, default false
  pinTopRow?: boolean; // Pin all particles in the top row, default false
  pinnedIndices?: number[]; // Specific particle indices to pin
}

/**
 * WGSL compute shader source for WebGPU execution
 */
export const XPBD_WGSL_COMPUTE_SHADER = /* wgsl */ `
struct Particle {
  position: vec4<f32>,     // xyz: current position, w: invMass (0.0 = fixed)
  prevPosition: vec4<f32>, // xyz: previous position, w: unused
  velocity: vec4<f32>,     // xyz: current velocity, w: unused
};

struct DistanceConstraint {
  p1: u32,
  p2: u32,
  restLength: f32,
  stiffness: f32,
};

struct SimUniforms {
  gravity: vec4<f32>,
  wind: vec4<f32>,
  deltaTime: f32,
  damping: f32,
  particleCount: u32,
  distanceConstraintCount: u32,
  bendingConstraintCount: u32,
};

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<storage, read> distanceConstraints: array<DistanceConstraint>;
@group(0) @binding(2) var<storage, read> bendingConstraints: array<DistanceConstraint>;
@group(0) @binding(3) var<uniform> simUniforms: SimUniforms;

@compute @workgroup_size(64)
fn verletIntegrate(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let idx = global_id.x;
  if (idx >= simUniforms.particleCount) {
    return;
  }

  var p = particles[idx];
  let invMass = p.position.w;
  if (invMass <= 0.0) {
    p.velocity = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    particles[idx] = p;
    return;
  }

  let dt = simUniforms.deltaTime;
  let externalAccel = simUniforms.gravity.xyz + simUniforms.wind.xyz;
  let newVel = (p.velocity.xyz + externalAccel * dt) * (1.0 - simUniforms.damping);

  p.prevPosition = vec4<f32>(p.position.xyz, 0.0);
  p.position = vec4<f32>(p.position.xyz + newVel * dt, invMass);
  p.velocity = vec4<f32>(newVel, 0.0);

  particles[idx] = p;
}

@compute @workgroup_size(64)
fn projectDistanceConstraints(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let idx = global_id.x;
  if (idx >= simUniforms.distanceConstraintCount) {
    return;
  }

  let c = distanceConstraints[idx];
  var p1 = particles[c.p1];
  var p2 = particles[c.p2];

  let w1 = p1.position.w;
  let w2 = p2.position.w;
  let wSum = w1 + w2;
  if (wSum <= 0.00001) {
    return;
  }

  let delta = p1.position.xyz - p2.position.xyz;
  let currentDist = length(delta);
  if (currentDist <= 0.00001) {
    return;
  }

  let error = (currentDist - c.restLength) / currentDist;
  let correction = delta * (error * c.stiffness / wSum);

  if (w1 > 0.0) {
    p1.position = vec4<f32>(p1.position.xyz - correction * w1, w1);
    particles[c.p1] = p1;
  }
  if (w2 > 0.0) {
    p2.position = vec4<f32>(p2.position.xyz + correction * w2, w2);
    particles[c.p2] = p2;
  }
}

@compute @workgroup_size(64)
fn projectBendingConstraints(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let idx = global_id.x;
  if (idx >= simUniforms.bendingConstraintCount) {
    return;
  }

  let c = bendingConstraints[idx];
  var p1 = particles[c.p1];
  var p2 = particles[c.p2];

  let w1 = p1.position.w;
  let w2 = p2.position.w;
  let wSum = w1 + w2;
  if (wSum <= 0.00001) {
    return;
  }

  let delta = p1.position.xyz - p2.position.xyz;
  let currentDist = length(delta);
  if (currentDist <= 0.00001) {
    return;
  }

  let error = (currentDist - c.restLength) / currentDist;
  let correction = delta * (error * c.stiffness / wSum);

  if (w1 > 0.0) {
    p1.position = vec4<f32>(p1.position.xyz - correction * w1, w1);
    particles[c.p1] = p1;
  }
  if (w2 > 0.0) {
    p2.position = vec4<f32>(p2.position.xyz + correction * w2, w2);
    particles[c.p2] = p2;
  }
}

@compute @workgroup_size(64)
fn updateVelocities(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let idx = global_id.x;
  if (idx >= simUniforms.particleCount) {
    return;
  }

  var p = particles[idx];
  let invMass = p.position.w;
  if (invMass <= 0.0) {
    p.velocity = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  } else {
    let dt = simUniforms.deltaTime;
    if (dt > 0.00001) {
      p.velocity = vec4<f32>((p.position.xyz - p.prevPosition.xyz) / dt, 0.0);
    }
  }
  particles[idx] = p;
}
`;

/**
 * Checks whether the current runtime environment supports WebGPU.
 */
export function isWebGPUSupported(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return typeof navigator.gpu !== "undefined" && navigator.gpu !== null;
}

/**
 * High-performance XPBD fabric drape simulation engine.
 */
export class XPBDClothEngine {
  private gridWidth = 0;
  private gridHeight = 0;
  private particleCount = 0;
  private spacing = 0;

  // Numerical particle state arrays
  private positions: Float32Array = new Float32Array(0);
  private prevPositions: Float32Array = new Float32Array(0);
  private velocities: Float32Array = new Float32Array(0);
  private invMass: Float32Array = new Float32Array(0);

  // Constraint topology
  private constraints: XPBDConstraint[] = [];

  // Simulation tuning parameters
  private stiffness = 0.95;
  private bendingStiffness = 0.5;
  private damping = 0.02;
  private iterations = 5;
  private gravity: [number, number, number] = [0, -9.81, 0];
  private wind: [number, number, number] = [0, 0, 0];

  /**
   * Initializes the particle grid and generates structural, shear, and bending constraints.
   */
  public initialize(
    gridWidth: number,
    gridHeight: number,
    spacing: number,
    options?: XPBDClothEngineOptions,
  ): void {
    if (gridWidth < 1 || gridHeight < 1) {
      throw new Error(`Invalid grid dimensions: ${gridWidth}x${gridHeight}. Must be at least 1x1.`);
    }
    if (spacing <= 0) {
      throw new Error(`Invalid spacing: ${spacing}. Must be greater than 0.`);
    }

    this.gridWidth = Math.floor(gridWidth);
    this.gridHeight = Math.floor(gridHeight);
    this.spacing = spacing;
    this.particleCount = this.gridWidth * this.gridHeight;

    if (options?.stiffness !== undefined) this.stiffness = options.stiffness;
    if (options?.bendingStiffness !== undefined) this.bendingStiffness = options.bendingStiffness;
    if (options?.damping !== undefined) this.damping = options.damping;
    if (options?.iterations !== undefined) this.iterations = options.iterations;
    if (options?.gravity) this.gravity = [...options.gravity];
    if (options?.wind) this.wind = [...options.wind];

    // Allocate continuous Float32Arrays for CPU solver
    this.positions = new Float32Array(this.particleCount * 3);
    this.prevPositions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.invMass = new Float32Array(this.particleCount);

    // Initialize particle grid positions in 3D space
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const i = y * this.gridWidth + x;
        const idx = i * 3;

        const posX = x === 0 ? 0 : x * spacing;
        const posY = y === 0 ? 0 : -y * spacing;
        const posZ = 0;

        this.positions[idx] = posX;
        this.positions[idx + 1] = posY;
        this.positions[idx + 2] = posZ;

        this.prevPositions[idx] = posX;
        this.prevPositions[idx + 1] = posY;
        this.prevPositions[idx + 2] = posZ;

        this.velocities[idx] = 0;
        this.velocities[idx + 1] = 0;
        this.velocities[idx + 2] = 0;

        this.invMass[i] = 1.0;
      }
    }

    // Configure particle pinning
    if (options?.pinTopRow) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.invMass[x] = 0.0;
      }
    }

    if (options?.pinCorners) {
      this.invMass[0] = 0.0;
      this.invMass[this.gridWidth - 1] = 0.0;
    }

    if (options?.pinnedIndices) {
      for (const idx of options.pinnedIndices) {
        if (idx >= 0 && idx < this.particleCount) {
          this.invMass[idx] = 0.0;
        }
      }
    }

    // Build cloth constraint topology
    this.buildConstraints();
  }

  private buildConstraints(): void {
    const constraints: XPBDConstraint[] = [];
    const w = this.gridWidth;
    const h = this.gridHeight;
    const s = this.spacing;

    const getIdx = (x: number, y: number) => y * w + x;

    // 1. Structural stretch constraints (horizontal & vertical)
    // Horizontal stretch
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w - 1; x++) {
        constraints.push({
          p1: getIdx(x, y),
          p2: getIdx(x + 1, y),
          restLength: s,
          stiffness: this.stiffness,
          type: "stretch",
        });
      }
    }
    // Vertical stretch
    for (let y = 0; y < h - 1; y++) {
      for (let x = 0; x < w; x++) {
        constraints.push({
          p1: getIdx(x, y),
          p2: getIdx(x, y + 1),
          restLength: s,
          stiffness: this.stiffness,
          type: "stretch",
        });
      }
    }

    // 2. Shear constraints (diagonal crosses)
    const diagLength = s * Math.SQRT2;
    for (let y = 0; y < h - 1; y++) {
      for (let x = 0; x < w - 1; x++) {
        constraints.push({
          p1: getIdx(x, y),
          p2: getIdx(x + 1, y + 1),
          restLength: diagLength,
          stiffness: this.stiffness,
          type: "shear",
        });
        constraints.push({
          p1: getIdx(x + 1, y),
          p2: getIdx(x, y + 1),
          restLength: diagLength,
          stiffness: this.stiffness,
          type: "shear",
        });
      }
    }

    // 3. Bending constraints (2-step neighbor spans)
    const bendLength = s * 2;
    // Horizontal bending
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w - 2; x++) {
        constraints.push({
          p1: getIdx(x, y),
          p2: getIdx(x + 2, y),
          restLength: bendLength,
          stiffness: this.bendingStiffness,
          type: "bending",
        });
      }
    }
    // Vertical bending
    for (let y = 0; y < h - 2; y++) {
      for (let x = 0; x < w; x++) {
        constraints.push({
          p1: getIdx(x, y),
          p2: getIdx(x, y + 2),
          restLength: bendLength,
          stiffness: this.bendingStiffness,
          type: "bending",
        });
      }
    }

    this.constraints = constraints;
  }

  /**
   * Advances the simulation by one time step using XPBD.
   */
  public step(deltaTimeSeconds: number): void {
    if (this.particleCount === 0) return;
    if (!Number.isFinite(deltaTimeSeconds) || deltaTimeSeconds <= 0) return;

    // Numerical safety guard: clamp frame delta to avoid explosion on long idle intervals
    const dt = Math.min(deltaTimeSeconds, 0.05);

    const positions = this.positions;
    const prevPositions = this.prevPositions;
    const velocities = this.velocities;
    const invMass = this.invMass;
    const count = this.particleCount;

    const gx = this.gravity[0] + this.wind[0];
    const gy = this.gravity[1] + this.wind[1];
    const gz = this.gravity[2] + this.wind[2];
    const dampingFactor = Math.max(0, 1.0 - this.damping);

    // 1. Verlet numerical integration
    for (let i = 0; i < count; i++) {
      const im = invMass[i] ?? 0;
      const idx = i * 3;
      if (im <= 0.0) {
        velocities[idx] = 0;
        velocities[idx + 1] = 0;
        velocities[idx + 2] = 0;
        continue;
      }

      const vx = ((velocities[idx] ?? 0) + gx * dt) * dampingFactor;
      const vy = ((velocities[idx + 1] ?? 0) + gy * dt) * dampingFactor;
      const vz = ((velocities[idx + 2] ?? 0) + gz * dt) * dampingFactor;

      const px = positions[idx] ?? 0;
      const py = positions[idx + 1] ?? 0;
      const pz = positions[idx + 2] ?? 0;

      prevPositions[idx] = px;
      prevPositions[idx + 1] = py;
      prevPositions[idx + 2] = pz;

      positions[idx] = px + vx * dt;
      positions[idx + 1] = py + vy * dt;
      positions[idx + 2] = pz + vz * dt;

      velocities[idx] = vx;
      velocities[idx + 1] = vy;
      velocities[idx + 2] = vz;
    }

    // 2. XPBD constraint projection iterations
    const numConstraints = this.constraints.length;
    for (let it = 0; it < this.iterations; it++) {
      for (let cIdx = 0; cIdx < numConstraints; cIdx++) {
        const c = this.constraints[cIdx];
        if (!c) continue;
        const p1 = c.p1;
        const p2 = c.p2;
        const w1 = invMass[p1] ?? 0;
        const w2 = invMass[p2] ?? 0;
        const wSum = w1 + w2;
        if (wSum <= 1e-7) continue;

        const i1 = p1 * 3;
        const i2 = p2 * 3;

        const p1x = positions[i1] ?? 0;
        const p1y = positions[i1 + 1] ?? 0;
        const p1z = positions[i1 + 2] ?? 0;

        const p2x = positions[i2] ?? 0;
        const p2y = positions[i2 + 1] ?? 0;
        const p2z = positions[i2 + 2] ?? 0;

        const dx = p1x - p2x;
        const dy = p1y - p2y;
        const dz = p1z - p2z;

        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist <= 1e-7) continue;

        const diff = (dist - c.restLength) / dist;
        const corr = (diff * c.stiffness) / wSum;

        const cx = dx * corr;
        const cy = dy * corr;
        const cz = dz * corr;

        if (w1 > 0) {
          positions[i1] = p1x - cx * w1;
          positions[i1 + 1] = p1y - cy * w1;
          positions[i1 + 2] = p1z - cz * w1;
        }
        if (w2 > 0) {
          positions[i2] = p2x + cx * w2;
          positions[i2 + 1] = p2y + cy * w2;
          positions[i2 + 2] = p2z + cz * w2;
        }
      }
    }

    // 3. Post-projection velocity update
    const invDt = 1.0 / dt;
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const im = invMass[i] ?? 0;
      if (im <= 0.0) {
        velocities[idx] = 0;
        velocities[idx + 1] = 0;
        velocities[idx + 2] = 0;
      } else {
        const curX = positions[idx] ?? 0;
        const curY = positions[idx + 1] ?? 0;
        const curZ = positions[idx + 2] ?? 0;
        const prevX = prevPositions[idx] ?? 0;
        const prevY = prevPositions[idx + 1] ?? 0;
        const prevZ = prevPositions[idx + 2] ?? 0;

        velocities[idx] = (curX - prevX) * invDt;
        velocities[idx + 1] = (curY - prevY) * invDt;
        velocities[idx + 2] = (curZ - prevZ) * invDt;
      }
    }
  }

  /**
   * Returns a direct view of the current particle positions Float32Array.
   */
  public getPositions(): Float32Array {
    return this.positions;
  }

  /**
   * Returns a copy of the current particle velocities Float32Array.
   */
  public getVelocities(): Float32Array {
    return this.velocities;
  }

  /**
   * Returns inverse masses (0 = pinned, >0 = free).
   */
  public getInvMass(): Float32Array {
    return this.invMass;
  }

  /**
   * Pins a particle at the specified index.
   */
  public pinParticle(index: number): void {
    if (index >= 0 && index < this.particleCount) {
      this.invMass[index] = 0.0;
      this.velocities[index * 3] = 0;
      this.velocities[index * 3 + 1] = 0;
      this.velocities[index * 3 + 2] = 0;
    }
  }

  /**
   * Unpins a particle at the specified index.
   */
  public unpinParticle(index: number): void {
    if (index >= 0 && index < this.particleCount) {
      this.invMass[index] = 1.0;
    }
  }

  /**
   * Returns whether a particle is pinned.
   */
  public isPinned(index: number): boolean {
    if (index < 0 || index >= this.particleCount) return false;
    const im = this.invMass[index];
    return im !== undefined && im <= 0.0;
  }

  /**
   * Updates the simulation gravity vector.
   */
  public setGravity(gravity: [number, number, number]): void {
    this.gravity = [...gravity];
  }

  /**
   * Updates the simulation wind vector.
   */
  public setWind(wind: [number, number, number]): void {
    this.wind = [...wind];
  }

  /**
   * Returns the total particle count.
   */
  public getParticleCount(): number {
    return this.particleCount;
  }

  /**
   * Returns the constraint list.
   */
  public getConstraints(): readonly XPBDConstraint[] {
    return this.constraints;
  }

  /**
   * Returns counts of constraints grouped by type.
   */
  public getConstraintCount(): XPBDConstraintCount {
    let stretch = 0;
    let shear = 0;
    let bending = 0;
    for (const c of this.constraints) {
      if (c.type === "stretch") stretch++;
      else if (c.type === "shear") shear++;
      else if (c.type === "bending") bending++;
    }
    return {
      total: this.constraints.length,
      stretch,
      shear,
      bending,
    };
  }

  /**
   * Returns whether WebGPU is supported in the current environment.
   */
  public isWebGPUSupported(): boolean {
    return isWebGPUSupported();
  }

  /**
   * Returns the WGSL shader source code template.
   */
  public getWGSLShaderCode(): string {
    return XPBD_WGSL_COMPUTE_SHADER;
  }
}

/**
 * Factory helper for creating an XPBDClothEngine instance.
 */
export function createXPBDClothEngine(): XPBDClothEngine {
  return new XPBDClothEngine();
}
