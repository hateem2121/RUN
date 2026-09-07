/**
 * CRDT-01: Collaborative 3D Spatial Annotations CRDT
 *
 * Implements a state-based Conflict-free Replicated Data Type (CvRDT)
 * with Lamport logical clocks and Last-Write-Wins (LWW) conflict resolution
 * for real-time 3D pin annotations across distributed clients.
 */

export interface SpatialAnnotationPin {
  id: string;
  targetMeshId: string;
  position: [number, number, number];
  normal: [number, number, number];
  comment: string;
  author: { id: string; name: string };
  state: "open" | "resolved" | "deleted";
  timestamp: number;
  lamportClock: number;
}

export interface SpatialCRDTState {
  pins: Record<string, SpatialAnnotationPin>;
  nodeId: string;
  clock: number;
}

export class SpatialAnnotationCRDT {
  private pins: Record<string, SpatialAnnotationPin> = {};
  public readonly nodeId: string;
  private clock = 0;

  constructor(nodeId: string, initialState?: Partial<SpatialCRDTState>) {
    this.nodeId = nodeId;
    if (initialState) {
      if (initialState.pins) {
        this.pins = structuredClone(initialState.pins);
      }
      if (typeof initialState.clock === "number") {
        this.clock = initialState.clock;
      }
    }
  }

  public getClock(): number {
    return this.clock;
  }

  public getState(): SpatialCRDTState {
    return {
      pins: structuredClone(this.pins),
      nodeId: this.nodeId,
      clock: this.clock,
    };
  }

  public getPin(id: string): SpatialAnnotationPin | undefined {
    const pin = this.pins[id];
    return pin ? structuredClone(pin) : undefined;
  }

  public getActivePins(): SpatialAnnotationPin[] {
    return Object.values(this.pins)
      .filter((pin) => pin.state !== "deleted")
      .map((pin) => structuredClone(pin));
  }

  public createPin(
    data: Omit<SpatialAnnotationPin, "lamportClock" | "timestamp">,
  ): SpatialAnnotationPin {
    this.clock += 1;
    const pin: SpatialAnnotationPin = {
      ...data,
      timestamp: Date.now(),
      lamportClock: this.clock,
    };
    this.pins[pin.id] = structuredClone(pin);
    return structuredClone(pin);
  }

  public updatePin(
    id: string,
    updates: Partial<Omit<SpatialAnnotationPin, "id">>,
  ): SpatialAnnotationPin {
    const existing = this.pins[id];
    if (!existing) {
      throw new Error(`Spatial annotation pin "${id}" not found.`);
    }
    this.clock += 1;
    const updated: SpatialAnnotationPin = {
      ...existing,
      ...updates,
      id,
      timestamp: Date.now(),
      lamportClock: this.clock,
    };
    this.pins[id] = structuredClone(updated);
    return structuredClone(updated);
  }

  public deletePin(id: string): SpatialAnnotationPin {
    const existing = this.pins[id];
    if (!existing) {
      throw new Error(`Spatial annotation pin "${id}" not found.`);
    }
    this.clock += 1;
    const deleted: SpatialAnnotationPin = {
      ...existing,
      state: "deleted",
      timestamp: Date.now(),
      lamportClock: this.clock,
    };
    this.pins[id] = structuredClone(deleted);
    return structuredClone(deleted);
  }

  /**
   * Deterministically orders two pins according to LWW conflict resolution rules:
   * 1. Higher lamportClock wins.
   * 2. If lamportClock is tied, higher timestamp wins.
   * 3. If timestamp is tied, lexicographical comparison of nodeId / author.id breaks tie.
   * 4. If still tied, deterministic JSON string comparison guarantees total ordering.
   */
  public static comparePins(a: SpatialAnnotationPin, b: SpatialAnnotationPin): number {
    if (a.lamportClock !== b.lamportClock) {
      return a.lamportClock - b.lamportClock;
    }
    if (a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp;
    }

    const authorA = a.author?.id ?? "";
    const authorB = b.author?.id ?? "";
    if (authorA !== authorB) {
      return authorA.localeCompare(authorB);
    }

    const strA = JSON.stringify(a);
    const strB = JSON.stringify(b);
    return strA.localeCompare(strB);
  }

  /**
   * Merges remote state into local state with mathematical LWW conflict resolution.
   * Guarantees idempotent, commutative, and associative properties.
   */
  public merge(remoteState: SpatialCRDTState): {
    mergedState: SpatialCRDTState;
    changedPins: string[];
  } {
    const changedPinsSet = new Set<string>();

    for (const [id, remotePin] of Object.entries(remoteState.pins)) {
      const localPin = this.pins[id];
      if (!localPin) {
        this.pins[id] = structuredClone(remotePin);
        changedPinsSet.add(id);
      } else {
        const comparison = SpatialAnnotationCRDT.comparePins(remotePin, localPin);
        if (comparison > 0) {
          this.pins[id] = structuredClone(remotePin);
          changedPinsSet.add(id);
        }
      }
    }

    this.clock = Math.max(this.clock, remoteState.clock);

    return {
      mergedState: this.getState(),
      changedPins: Array.from(changedPinsSet).sort(),
    };
  }

  /**
   * Pure functional merge between two states producing a converged state.
   */
  public static mergeStates(
    stateA: SpatialCRDTState,
    stateB: SpatialCRDTState,
    targetNodeId?: string,
  ): SpatialCRDTState {
    const replica = new SpatialAnnotationCRDT(targetNodeId ?? stateA.nodeId, stateA);
    replica.merge(stateB);
    return replica.getState();
  }
}
