import { describe, expect, it } from "vitest";
import {
  SpatialAnnotationCRDT,
  type SpatialAnnotationPin,
  type SpatialCRDTState,
} from "../utils/spatial-crdt.js";

describe("CRDT-01: Collaborative 3D Spatial Annotations CRDT", () => {
  const baseAuthorA = { id: "user-alpha", name: "Alice Designer" };
  const baseAuthorB = { id: "user-beta", name: "Bob Engineer" };
  const baseAuthorC = { id: "user-gamma", name: "Charlie QA" };

  describe("Single Node Basic Operations", () => {
    it("should initialize with default state or provided state", () => {
      const crdt = new SpatialAnnotationCRDT("node-1");
      expect(crdt.nodeId).toBe("node-1");
      expect(crdt.getClock()).toBe(0);
      expect(crdt.getActivePins()).toEqual([]);
      expect(crdt.getState()).toEqual({
        pins: {},
        nodeId: "node-1",
        clock: 0,
      });

      const presetPin: SpatialAnnotationPin = {
        id: "pin-100",
        targetMeshId: "mesh-jersey-front",
        position: [0.1, 1.2, -0.4],
        normal: [0, 1, 0],
        comment: "Initial seam tension check",
        author: baseAuthorA,
        state: "open",
        timestamp: 1000,
        lamportClock: 1,
      };

      const crdtWithInit = new SpatialAnnotationCRDT("node-preset", {
        pins: { [presetPin.id]: presetPin },
        clock: 1,
      });

      expect(crdtWithInit.getClock()).toBe(1);
      expect(crdtWithInit.getPin("pin-100")).toEqual(presetPin);
      expect(crdtWithInit.getActivePins()).toHaveLength(1);
    });

    it("should create pin and increment Lamport clock", () => {
      const crdt = new SpatialAnnotationCRDT("node-1");
      const pin = crdt.createPin({
        id: "pin-1",
        targetMeshId: "mesh-sleeve-left",
        position: [0.5, 0.2, 0.1],
        normal: [0, 0, 1],
        comment: "Reinforce ergonomic raglan seam",
        author: baseAuthorA,
        state: "open",
      });

      expect(pin.id).toBe("pin-1");
      expect(pin.lamportClock).toBe(1);
      expect(pin.timestamp).toBeGreaterThan(0);
      expect(crdt.getClock()).toBe(1);
      expect(crdt.getActivePins()).toHaveLength(1);
      expect(crdt.getPin("pin-1")?.comment).toBe("Reinforce ergonomic raglan seam");
    });

    it("should update pin and increment Lamport clock", () => {
      const crdt = new SpatialAnnotationCRDT("node-1");
      crdt.createPin({
        id: "pin-1",
        targetMeshId: "mesh-collar",
        position: [0, 1.5, 0],
        normal: [0, 1, 0],
        comment: "Check collar ribbing",
        author: baseAuthorA,
        state: "open",
      });

      const updated = crdt.updatePin("pin-1", {
        comment: "Collar ribbing approved with 2x2 elastane",
        state: "resolved",
      });

      expect(updated.lamportClock).toBe(2);
      expect(updated.comment).toBe("Collar ribbing approved with 2x2 elastane");
      expect(updated.state).toBe("resolved");
      expect(crdt.getClock()).toBe(2);
      expect(crdt.getActivePins()).toHaveLength(1);
    });

    it("should throw when updating or deleting a non-existent pin", () => {
      const crdt = new SpatialAnnotationCRDT("node-1");
      expect(() => crdt.updatePin("non-existent", { comment: "foo" })).toThrow(/not found/);
      expect(() => crdt.deletePin("non-existent")).toThrow(/not found/);
    });

    it("should delete pin using tombstone pattern and exclude from getActivePins", () => {
      const crdt = new SpatialAnnotationCRDT("node-1");
      crdt.createPin({
        id: "pin-1",
        targetMeshId: "mesh-hem",
        position: [0, 0.1, 0],
        normal: [0, -1, 0],
        comment: "Double stitch lower hem",
        author: baseAuthorA,
        state: "open",
      });

      expect(crdt.getActivePins()).toHaveLength(1);

      const deleted = crdt.deletePin("pin-1");
      expect(deleted.state).toBe("deleted");
      expect(deleted.lamportClock).toBe(2);
      expect(crdt.getActivePins()).toHaveLength(0);

      // Pin remains in internal state as tombstone
      expect(crdt.getPin("pin-1")).toBeDefined();
      expect(crdt.getPin("pin-1")?.state).toBe("deleted");
    });
  });

  describe("Concurrent Edits & Lamport Tie-Breaking", () => {
    it("higher Lamport clock wins regardless of arrival order", () => {
      const nodeA = new SpatialAnnotationCRDT("node-A");
      const nodeB = new SpatialAnnotationCRDT("node-B");

      // Shared initial pin
      const initialPin = nodeA.createPin({
        id: "pin-cuff",
        targetMeshId: "mesh-cuff-right",
        position: [0.8, 0.4, 0.1],
        normal: [1, 0, 0],
        comment: "Initial cuff width 8cm",
        author: baseAuthorA,
        state: "open",
      });

      // Sync initial state to Node B
      nodeB.merge(nodeA.getState());

      // Node A does 1 update (clock: 2)
      nodeA.updatePin("pin-cuff", {
        comment: "Node A update: Cuff width 8.5cm",
      });

      // Node B does 2 updates (clock: 2, then clock: 3)
      nodeB.updatePin("pin-cuff", {
        comment: "Node B intermediate: Cuff width 9cm",
      });
      nodeB.updatePin("pin-cuff", {
        comment: "Node B final: Cuff width 9.5cm with bonded edge",
      });

      // Node A merges Node B's state (higher clock 3 wins over clock 2)
      const mergeResultA = nodeA.merge(nodeB.getState());
      expect(mergeResultA.changedPins).toContain("pin-cuff");
      expect(nodeA.getPin("pin-cuff")?.comment).toBe(
        "Node B final: Cuff width 9.5cm with bonded edge",
      );
      expect(nodeA.getPin("pin-cuff")?.lamportClock).toBe(3);

      // Node B merges Node A's earlier state (clock 2 loses to clock 3, no changes)
      const mergeResultB = nodeB.merge(nodeA.getState());
      expect(mergeResultB.changedPins).not.toContain("pin-cuff");
      expect(nodeB.getPin("pin-cuff")?.comment).toBe(
        "Node B final: Cuff width 9.5cm with bonded edge",
      );
    });

    it("tie-breaks by timestamp when Lamport clocks are equal", () => {
      const pinA: SpatialAnnotationPin = {
        id: "pin-split",
        targetMeshId: "mesh-back-panel",
        position: [0, 1.0, -0.2],
        normal: [0, 0, -1],
        comment: "Alice edit at t=1000",
        author: baseAuthorA,
        state: "open",
        timestamp: 1000,
        lamportClock: 2,
      };

      const pinB: SpatialAnnotationPin = {
        id: "pin-split",
        targetMeshId: "mesh-back-panel",
        position: [0, 1.0, -0.2],
        normal: [0, 0, -1],
        comment: "Bob edit at t=2000",
        author: baseAuthorB,
        state: "open",
        timestamp: 2000,
        lamportClock: 2,
      };

      const stateA: SpatialCRDTState = {
        pins: { "pin-split": pinA },
        nodeId: "node-A",
        clock: 2,
      };

      const stateB: SpatialCRDTState = {
        pins: { "pin-split": pinB },
        nodeId: "node-B",
        clock: 2,
      };

      const replica = new SpatialAnnotationCRDT("node-C", stateA);
      const { changedPins } = replica.merge(stateB);

      expect(changedPins).toContain("pin-split");
      // pinB wins because timestamp 2000 > 1000
      expect(replica.getPin("pin-split")?.comment).toBe("Bob edit at t=2000");
    });

    it("tie-breaks by author.id lexicographically when clocks and timestamps are equal", () => {
      // author A: "user-alpha" vs author B: "user-beta" -> "user-beta" > "user-alpha"
      const pinAlpha: SpatialAnnotationPin = {
        id: "pin-tie",
        targetMeshId: "mesh-neck",
        position: [0, 1.8, 0],
        normal: [0, 1, 0],
        comment: "Alpha's suggestion",
        author: { id: "user-alpha", name: "Alpha" },
        state: "open",
        timestamp: 5000,
        lamportClock: 4,
      };

      const pinBeta: SpatialAnnotationPin = {
        id: "pin-tie",
        targetMeshId: "mesh-neck",
        position: [0, 1.8, 0],
        normal: [0, 1, 0],
        comment: "Beta's suggestion",
        author: { id: "user-beta", name: "Beta" },
        state: "open",
        timestamp: 5000,
        lamportClock: 4,
      };

      expect(SpatialAnnotationCRDT.comparePins(pinBeta, pinAlpha)).toBeGreaterThan(0);
      expect(SpatialAnnotationCRDT.comparePins(pinAlpha, pinBeta)).toBeLessThan(0);

      const node1 = new SpatialAnnotationCRDT("node-1", {
        pins: { "pin-tie": pinAlpha },
        clock: 4,
      });

      node1.merge({
        pins: { "pin-tie": pinBeta },
        nodeId: "node-2",
        clock: 4,
      });

      expect(node1.getPin("pin-tie")?.comment).toBe("Beta's suggestion");
    });
  });

  describe("Tombstone Pattern", () => {
    it("delete tombstone overrides earlier updates", () => {
      const nodeA = new SpatialAnnotationCRDT("node-A");
      const nodeB = new SpatialAnnotationCRDT("node-B");

      const pin = nodeA.createPin({
        id: "pin-pocket",
        targetMeshId: "mesh-pocket-zipper",
        position: [0.3, 0.6, 0.05],
        normal: [0, 0, 1],
        comment: "Waterproof zipper tape",
        author: baseAuthorA,
        state: "open",
      });

      nodeB.merge(nodeA.getState());

      // Node A updates the pin at clock 2
      nodeA.updatePin("pin-pocket", {
        comment: "Use YKK Aquaguard #3",
      });

      // Node B deletes the pin at clock 2 then updates local clock, or deletes at clock 2
      // Let's create an edit then delete on B: clock becomes 3
      nodeB.deletePin("pin-pocket"); // lamportClock: 2

      // Even if clocks match, if B's timestamp or clock is higher:
      // Let's advance B's clock
      const stateB = nodeB.getState();
      stateB.pins["pin-pocket"].lamportClock = 5;

      const result = nodeA.merge(stateB);
      expect(result.changedPins).toContain("pin-pocket");
      expect(nodeA.getPin("pin-pocket")?.state).toBe("deleted");
      expect(nodeA.getActivePins()).toHaveLength(0);
    });

    it("subsequent update with higher Lamport clock can resurrect or update a deleted pin", () => {
      const nodeA = new SpatialAnnotationCRDT("node-A");
      nodeA.createPin({
        id: "pin-logo",
        targetMeshId: "mesh-chest-logo",
        position: [0.1, 1.1, 0.05],
        normal: [0, 0, 1],
        comment: "Silicone heat transfer logo",
        author: baseAuthorA,
        state: "open",
      });

      nodeA.deletePin("pin-logo"); // clock 2, deleted
      expect(nodeA.getActivePins()).toHaveLength(0);

      // Re-opening or editing with higher clock
      nodeA.updatePin("pin-logo", {
        state: "open",
        comment: "Re-opened: Reflective iridescent silicone requested by client",
      }); // clock 3, open

      expect(nodeA.getActivePins()).toHaveLength(1);
      expect(nodeA.getPin("pin-logo")?.state).toBe("open");
      expect(nodeA.getPin("pin-logo")?.comment).toContain("Reflective iridescent");
    });
  });

  describe("Mathematical CRDT Invariants", () => {
    it("guarantees idempotency: merge(A, A) === A", () => {
      const node = new SpatialAnnotationCRDT("node-1");
      node.createPin({
        id: "pin-1",
        targetMeshId: "mesh-hood",
        position: [0, 1.9, -0.1],
        normal: [0, 1, 0],
        comment: "Adjust hood cord lock positioning",
        author: baseAuthorA,
        state: "open",
      });
      node.createPin({
        id: "pin-2",
        targetMeshId: "mesh-waist",
        position: [0, 0.5, 0],
        normal: [0, 0, 1],
        comment: "Elastic drawcord channel",
        author: baseAuthorB,
        state: "resolved",
      });

      const originalState = node.getState();
      const { mergedState, changedPins } = node.merge(originalState);

      expect(changedPins).toHaveLength(0);
      expect(mergedState).toEqual(originalState);
    });

    it("guarantees commutative property: merge(A, B) === merge(B, A)", () => {
      // Prepare state A
      const nodeA = new SpatialAnnotationCRDT("node-A");
      nodeA.createPin({
        id: "pin-common",
        targetMeshId: "mesh-sleeve",
        position: [0.4, 0.8, 0],
        normal: [1, 0, 0],
        comment: "Version A from Alice",
        author: baseAuthorA,
        state: "open",
      });
      nodeA.createPin({
        id: "pin-a-only",
        targetMeshId: "mesh-shoulder",
        position: [0.2, 1.4, 0],
        normal: [0, 1, 0],
        comment: "Seam tape width",
        author: baseAuthorA,
        state: "open",
      });

      // Prepare state B with concurrent conflict on pin-common
      const nodeB = new SpatialAnnotationCRDT("node-B");
      nodeB.createPin({
        id: "pin-common",
        targetMeshId: "mesh-sleeve",
        position: [0.45, 0.82, 0.01],
        normal: [1, 0, 0],
        comment: "Version B from Bob with higher clock",
        author: baseAuthorB,
        state: "resolved",
      });
      nodeB.updatePin("pin-common", {
        comment: "Version B updated again",
      });
      nodeB.createPin({
        id: "pin-b-only",
        targetMeshId: "mesh-zipper",
        position: [0, 1.0, 0.1],
        normal: [0, 0, 1],
        comment: "Chin guard fabric",
        author: baseAuthorB,
        state: "open",
      });

      const stateA = nodeA.getState();
      const stateB = nodeB.getState();

      // Replica 1: starts as A, merges B
      const replicaAB = new SpatialAnnotationCRDT("merged-AB", stateA);
      replicaAB.merge(stateB);

      // Replica 2: starts as B, merges A
      const replicaBA = new SpatialAnnotationCRDT("merged-BA", stateB);
      replicaBA.merge(stateA);

      // Compare pins and clock
      expect(replicaAB.getState().pins).toEqual(replicaBA.getState().pins);
      expect(replicaAB.getClock()).toBe(replicaBA.getClock());

      // Also verify through pure mergeStates helper
      const merged1 = SpatialAnnotationCRDT.mergeStates(stateA, stateB);
      const merged2 = SpatialAnnotationCRDT.mergeStates(stateB, stateA);
      expect(merged1.pins).toEqual(merged2.pins);
      expect(merged1.clock).toBe(merged2.clock);
    });

    it("guarantees associative property: merge(merge(A, B), C) === merge(A, merge(B, C))", () => {
      const nodeA = new SpatialAnnotationCRDT("node-A");
      nodeA.createPin({
        id: "pin-1",
        targetMeshId: "mesh-1",
        position: [1, 0, 0],
        normal: [0, 1, 0],
        comment: "Pin 1 on Node A",
        author: baseAuthorA,
        state: "open",
      });

      const nodeB = new SpatialAnnotationCRDT("node-B");
      nodeB.createPin({
        id: "pin-1",
        targetMeshId: "mesh-1",
        position: [1.1, 0, 0],
        normal: [0, 1, 0],
        comment: "Pin 1 edit on Node B",
        author: baseAuthorB,
        state: "resolved",
      });
      nodeB.createPin({
        id: "pin-2",
        targetMeshId: "mesh-2",
        position: [2, 0, 0],
        normal: [0, 1, 0],
        comment: "Pin 2 on Node B",
        author: baseAuthorB,
        state: "open",
      });

      const nodeC = new SpatialAnnotationCRDT("node-C");
      nodeC.createPin({
        id: "pin-2",
        targetMeshId: "mesh-2",
        position: [2.2, 0, 0],
        normal: [0, 1, 0],
        comment: "Pin 2 edit on Node C",
        author: baseAuthorC,
        state: "resolved",
      });
      nodeC.createPin({
        id: "pin-3",
        targetMeshId: "mesh-3",
        position: [3, 0, 0],
        normal: [0, 1, 0],
        comment: "Pin 3 on Node C",
        author: baseAuthorC,
        state: "open",
      });

      const stateA = nodeA.getState();
      const stateB = nodeB.getState();
      const stateC = nodeC.getState();

      // (A merge B) merge C
      const mergeAB = SpatialAnnotationCRDT.mergeStates(stateA, stateB, "canonical");
      const mergeABC = SpatialAnnotationCRDT.mergeStates(mergeAB, stateC, "canonical");

      // A merge (B merge C)
      const mergeBC = SpatialAnnotationCRDT.mergeStates(stateB, stateC, "canonical");
      const mergeA_BC = SpatialAnnotationCRDT.mergeStates(stateA, mergeBC, "canonical");

      expect(mergeABC.pins).toEqual(mergeA_BC.pins);
      expect(mergeABC.clock).toBe(mergeA_BC.clock);
    });
  });
});
