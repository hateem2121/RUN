import { Document } from "@gltf-transform/core";
import { KHRTextureBasisu } from "@gltf-transform/extensions";
import { join, weld } from "@gltf-transform/functions";
import { describe, expect, it } from "vitest";
import { getGLTFProcessor } from "../../../lib/integrations/gltf-processor.js";

/**
 * Helper to construct a test GLTF document with multiple garment submesh primitives
 */
function createGarmentDocument() {
  const doc = new Document();
  const buffer = doc.createBuffer("default");

  // Create materials: 1 shared garment fabric, 1 trim material
  const fabricMaterial = doc.createMaterial("fabric_polyester_recycled");
  const trimMaterial = doc.createMaterial("trim_zipper_metal");

  // Panel 1: Front panel triangle (0,0,0) - (1,0,0) - (0,1,0)
  const pos1 = doc
    .createAccessor("pos_front")
    .setType("VEC3")
    .setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]))
    .setBuffer(buffer);
  const ind1 = doc
    .createAccessor("ind_front")
    .setType("SCALAR")
    .setArray(new Uint16Array([0, 1, 2]))
    .setBuffer(buffer);
  const prim1 = doc
    .createPrimitive()
    .setAttribute("POSITION", pos1)
    .setIndices(ind1)
    .setMaterial(fabricMaterial);

  // Panel 2: Back panel triangle sharing edge with Panel 1: (1,0,0) - (1,1,0) - (0,1,0)
  // Note: (1,0,0) and (0,1,0) are duplicate seam vertices with Panel 1
  const pos2 = doc
    .createAccessor("pos_back")
    .setType("VEC3")
    .setArray(new Float32Array([1, 0, 0, 1, 1, 0, 0, 1, 0]))
    .setBuffer(buffer);
  const ind2 = doc
    .createAccessor("ind_back")
    .setType("SCALAR")
    .setArray(new Uint16Array([0, 1, 2]))
    .setBuffer(buffer);
  const prim2 = doc
    .createPrimitive()
    .setAttribute("POSITION", pos2)
    .setIndices(ind2)
    .setMaterial(fabricMaterial);

  // Panel 3: Sleeve panel triangle also using fabricMaterial: (2,0,0) - (3,0,0) - (2,1,0)
  const pos3 = doc
    .createAccessor("pos_sleeve")
    .setType("VEC3")
    .setArray(new Float32Array([2, 0, 0, 3, 0, 0, 2, 1, 0]))
    .setBuffer(buffer);
  const ind3 = doc
    .createAccessor("ind_sleeve")
    .setType("SCALAR")
    .setArray(new Uint16Array([0, 1, 2]))
    .setBuffer(buffer);
  const prim3 = doc
    .createPrimitive()
    .setAttribute("POSITION", pos3)
    .setIndices(ind3)
    .setMaterial(fabricMaterial);

  // Panel 4: Zipper trim triangle using distinct trimMaterial: (0,2,0) - (1,2,0) - (0,3,0)
  const pos4 = doc
    .createAccessor("pos_trim")
    .setType("VEC3")
    .setArray(new Float32Array([0, 2, 0, 1, 2, 0, 0, 3, 0]))
    .setBuffer(buffer);
  const ind4 = doc
    .createAccessor("ind_trim")
    .setType("SCALAR")
    .setArray(new Uint16Array([0, 1, 2]))
    .setBuffer(buffer);
  const prim4 = doc
    .createPrimitive()
    .setAttribute("POSITION", pos4)
    .setIndices(ind4)
    .setMaterial(trimMaterial);

  const mesh = doc
    .createMesh("garment_mesh")
    .addPrimitive(prim1)
    .addPrimitive(prim2)
    .addPrimitive(prim3)
    .addPrimitive(prim4);

  const node = doc.createNode("garment_node").setMesh(mesh);
  doc.createScene("default_scene").addChild(node);

  return { doc, mesh, fabricMaterial, trimMaterial };
}

describe("Task 3D-03 & 3D-04: Garment Submesh Batching, Weld & KTX2 Optimization", () => {
  describe("3D-03: KTX2 / Basis Universal Support", () => {
    it("registers KHRTextureBasisu extension on processor NodeIO", () => {
      const processor = getGLTFProcessor();
      const io = processor.getIO();
      const registeredExtensions = Array.from((io as any)._extensions || []).map(
        (ext: any) => ext.EXTENSION_NAME,
      );

      expect(registeredExtensions).toContain(KHRTextureBasisu.EXTENSION_NAME);
      expect(registeredExtensions).toContain("KHR_texture_basisu");
    });
  });

  describe("3D-04: Submesh Batching (join)", () => {
    it("asserts that join() reduces garment submesh primitive count by material", async () => {
      const { doc, mesh } = createGarmentDocument();

      // Initial state: 4 primitives (3 fabric, 1 trim)
      expect(mesh.listPrimitives()).toHaveLength(4);

      // Execute join() transform
      await doc.transform(join());

      // Joined state: 3 fabric primitives merged into 1 + 1 trim primitive = 2 total
      const updatedMeshes = doc.getRoot().listMeshes();
      const joinedMesh = updatedMeshes[0];
      expect(joinedMesh).toBeDefined();

      const primitives = joinedMesh.listPrimitives();
      expect(primitives).toHaveLength(2);

      // Verify materials are preserved
      const materials = primitives.map((p) => p.getMaterial()?.getName());
      expect(materials).toContain("fabric_polyester_recycled");
      expect(materials).toContain("trim_zipper_metal");
    });
  });

  describe("3D-04: Vertex Deduplication (weld)", () => {
    it("asserts that weld() deduplicates shared seam vertex indices", async () => {
      const { doc } = createGarmentDocument();

      // First join primitives sharing identical material
      await doc.transform(join());

      const mesh = doc.getRoot().listMeshes()[0];
      const fabricPrim = mesh
        .listPrimitives()
        .find((p) => p.getMaterial()?.getName() === "fabric_polyester_recycled");

      expect(fabricPrim).toBeDefined();

      // Before weld: 3 panels * 3 vertices = 9 vertices in the combined fabric primitive
      const vertexCountBefore = fabricPrim!.getAttribute("POSITION")!.getCount();
      expect(vertexCountBefore).toBe(9);

      // Apply weld({ tolerance: 0.0001 }) to merge duplicate seam vertices
      await doc.transform(weld({ tolerance: 0.0001 }));

      // After weld: Panel 1 and Panel 2 shared 2 duplicate seam vertices (1,0,0) and (0,1,0)
      // Therefore, 9 vertices - 2 duplicates = 7 unique vertices
      const vertexCountAfter = fabricPrim!.getAttribute("POSITION")!.getCount();
      expect(vertexCountAfter).toBe(7);

      // Verify that vertex indices accessor reuses vertex index for duplicate positions
      const indices = fabricPrim!.getIndices();
      expect(indices).toBeDefined();
      expect(indices!.getCount()).toBe(9); // Triangle draw call count preserved (3 triangles * 3 = 9 indices)

      const indicesArray = Array.from(indices!.getArray() as Uint16Array);
      // Panel 1 uses indices [0, 1, 2]
      // Panel 2 reuses indices 1 and 2 for shared vertices, creating index reuse
      const uniqueIndices = new Set(indicesArray);
      expect(uniqueIndices.size).toBe(7);
      expect(indicesArray.length).toBe(9);
    });
  });

  describe("End-to-End Batching & Validation Integration", () => {
    it("batches submeshes and passes document validation through compressDocument", async () => {
      const processor = getGLTFProcessor();
      const { doc } = createGarmentDocument();

      // Run full compression pipeline (join -> weld -> prune -> dedup -> draco)
      await processor.compressDocument(doc);

      // Verify primitive count reduction
      const meshes = doc.getRoot().listMeshes();
      expect(meshes[0].listPrimitives()).toHaveLength(2);

      // Assert document validation passes
      const validation = await processor.validateProcessedDocument(doc);
      expect(validation.isValid).toBe(true);
      expect(validation.hasExternalReferences).toBe(false);
      expect(validation.externalReferences).toHaveLength(0);
      expect(validation.triangleCount).toBe(4); // 3 fabric triangles + 1 trim triangle = 4
    });

    it("serializes and passes validateGLTF on GLB binary buffer", async () => {
      const processor = getGLTFProcessor();
      const { doc } = createGarmentDocument();

      // Apply batching and weld
      await doc.transform(join(), weld({ tolerance: 0.0001 }));

      const io = processor.getIO();
      const glb = await io.writeBinary(doc);
      const buffer = Buffer.from(glb);

      const validation = await processor.validateGLTF(buffer);
      expect(validation.isValid).toBe(true);
      expect(validation.hasExternalReferences).toBe(false);
      expect(validation.triangleCount).toBe(4);
    });
  });
});
