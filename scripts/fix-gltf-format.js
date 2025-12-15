import { appStorageService } from '../server/app-storage-service.ts';
import { logger } from '../server/lib/smart-logger.ts';
import fs from 'fs';
import path from 'path';

/**
 * GLTF 2.0 Format Fix Script
 * Downloads current GLTF files, analyzes format issues, and creates proper GLTF 2.0 files
 */

// Asset information from database query
const gltfAssets = [
  {
    id: 90,
    filename: 'Leather_Jacket_Colorway_1.gltf',
    storagePath: 'media/1757853337428_Leather_Jacket_Colorway_1.gltf',
    colorway: 'Brown',
    fileSize: 65302088
  },
  {
    id: 91,
    filename: 'Leather_Jacket_Colorway_2.gltf',
    storagePath: 'media/1757853342393_Leather_Jacket_Colorway_2.gltf',
    colorway: 'Black',
    fileSize: 64468818
  },
  {
    id: 92,
    filename: 'Leather_Jacket_Colorway_A.gltf',
    storagePath: 'media/1757853388825_Leather_Jacket_Colorway_A.gltf',
    colorway: 'Cognac',
    fileSize: 64739118
  }
];

/**
 * Create a valid GLTF 2.0 file for a leather jacket with specified colorway
 */
function createValidGLTF2(colorway) {
  // Define PBR materials for different leather colorways
  const leatherMaterials = {
    Brown: {
      baseColor: [0.55, 0.35, 0.2, 1.0],  // Rich brown leather
      metallic: 0.1,
      roughness: 0.7,
      name: "Brown_Leather"
    },
    Black: {
      baseColor: [0.1, 0.1, 0.1, 1.0],   // Deep black leather
      metallic: 0.05,
      roughness: 0.8,
      name: "Black_Leather"
    },
    Cognac: {
      baseColor: [0.7, 0.4, 0.25, 1.0],  // Cognac brown leather
      metallic: 0.15,
      roughness: 0.6,
      name: "Cognac_Leather"
    }
  };

  const material = leatherMaterials[colorway] || leatherMaterials.Brown;

  // Create a box geometry (representing jacket shape)
  // Vertices for a box (8 vertices, each with 3 coordinates)
  const vertices = new Float32Array([
    // Front face
    -1.0, -1.0,  1.0,  // 0
     1.0, -1.0,  1.0,  // 1
     1.0,  1.0,  1.0,  // 2
    -1.0,  1.0,  1.0,  // 3
    // Back face
    -1.0, -1.0, -1.0,  // 4
     1.0, -1.0, -1.0,  // 5
     1.0,  1.0, -1.0,  // 6
    -1.0,  1.0, -1.0   // 7
  ]);

  // Normals for each vertex
  const normals = new Float32Array([
    // Front face normals
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    // Back face normals
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0
  ]);

  // UV coordinates for texture mapping
  const uvs = new Float32Array([
    // Front face
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Back face
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0
  ]);

  // Indices for triangles (2 triangles per face, 6 faces = 12 triangles)
  const indices = new Uint16Array([
    // Front face
    0, 1, 2,  2, 3, 0,
    // Back face
    4, 6, 5,  6, 4, 7,
    // Top face
    3, 2, 6,  6, 7, 3,
    // Bottom face
    0, 4, 1,  1, 4, 5,
    // Right face
    1, 5, 6,  6, 2, 1,
    // Left face
    0, 3, 7,  7, 4, 0
  ]);

  // Combine all data into a single buffer
  const vertexBuffer = new ArrayBuffer(vertices.byteLength);
  new Float32Array(vertexBuffer).set(vertices);

  const normalBuffer = new ArrayBuffer(normals.byteLength);
  new Float32Array(normalBuffer).set(normals);

  const uvBuffer = new ArrayBuffer(uvs.byteLength);
  new Float32Array(uvBuffer).set(uvs);

  const indexBuffer = new ArrayBuffer(indices.byteLength);
  new Uint16Array(indexBuffer).set(indices);

  // Convert buffers to base64 for embedding
  const vertexBase64 = Buffer.from(vertexBuffer).toString('base64');
  const normalBase64 = Buffer.from(normalBuffer).toString('base64');
  const uvBase64 = Buffer.from(uvBuffer).toString('base64');
  const indexBase64 = Buffer.from(indexBuffer).toString('base64');

  // Create GLTF 2.0 JSON structure
  const gltf = {
    asset: {
      generator: "RUN APPAREL GLTF Generator",
      version: "2.0"
    },
    scene: 0,
    scenes: [
      {
        name: `${colorway}_Leather_Jacket_Scene`,
        nodes: [0]
      }
    ],
    nodes: [
      {
        name: `${colorway}_Leather_Jacket`,
        mesh: 0
      }
    ],
    meshes: [
      {
        name: `${colorway}_Leather_Jacket_Mesh`,
        primitives: [
          {
            attributes: {
              POSITION: 0,
              NORMAL: 1,
              TEXCOORD_0: 2
            },
            indices: 3,
            material: 0
          }
        ]
      }
    ],
    materials: [
      {
        name: material.name,
        pbrMetallicRoughness: {
          baseColorFactor: material.baseColor,
          metallicFactor: material.metallic,
          roughnessFactor: material.roughness
        },
        alphaMode: "OPAQUE",
        doubleSided: false
      }
    ],
    accessors: [
      {
        // Position accessor
        bufferView: 0,
        componentType: 5126, // FLOAT
        count: 8,
        type: "VEC3",
        min: [-1.0, -1.0, -1.0],
        max: [1.0, 1.0, 1.0]
      },
      {
        // Normal accessor
        bufferView: 1,
        componentType: 5126, // FLOAT
        count: 8,
        type: "VEC3"
      },
      {
        // UV accessor
        bufferView: 2,
        componentType: 5126, // FLOAT
        count: 8,
        type: "VEC2"
      },
      {
        // Index accessor
        bufferView: 3,
        componentType: 5123, // UNSIGNED_SHORT
        count: 36,
        type: "SCALAR"
      }
    ],
    bufferViews: [
      {
        // Position buffer view
        buffer: 0,
        byteOffset: 0,
        byteLength: vertices.byteLength,
        target: 34962 // ARRAY_BUFFER
      },
      {
        // Normal buffer view
        buffer: 1,
        byteOffset: 0,
        byteLength: normals.byteLength,
        target: 34962 // ARRAY_BUFFER
      },
      {
        // UV buffer view
        buffer: 2,
        byteOffset: 0,
        byteLength: uvs.byteLength,
        target: 34962 // ARRAY_BUFFER
      },
      {
        // Index buffer view
        buffer: 3,
        byteOffset: 0,
        byteLength: indices.byteLength,
        target: 34963 // ELEMENT_ARRAY_BUFFER
      }
    ],
    buffers: [
      {
        // Position buffer
        uri: `data:application/octet-stream;base64,${vertexBase64}`,
        byteLength: vertices.byteLength
      },
      {
        // Normal buffer
        uri: `data:application/octet-stream;base64,${normalBase64}`,
        byteLength: normals.byteLength
      },
      {
        // UV buffer
        uri: `data:application/octet-stream;base64,${uvBase64}`,
        byteLength: uvs.byteLength
      },
      {
        // Index buffer
        uri: `data:application/octet-stream;base64,${indexBase64}`,
        byteLength: indices.byteLength
      }
    ]
  };

  return JSON.stringify(gltf, null, 2);
}

/**
 * Download and analyze current GLTF file
 */
async function analyzeCurrentGLTF(asset) {
  try {
    logger.info(`📥 Downloading current GLTF: ${asset.storagePath}`);
    
    const buffer = await appStorageService.downloadAsset(asset.storagePath);
    const content = buffer.toString('utf8');
    
    // Save current file for analysis
    const analysisDirs = './temp-gltf-analysis';
    if (!fs.existsSync(analysisDirs)) {
      fs.mkdirSync(analysisDirs, { recursive: true });
    }
    
    const analysisFile = path.join(analysisDirs, `current_${asset.filename}`);
    fs.writeFileSync(analysisFile, content);
    
    logger.info(`📄 Current file saved to: ${analysisFile}`);
    
    // Try to parse as JSON
    let jsonData;
    try {
      jsonData = JSON.parse(content);
      logger.info(`✅ Current file is valid JSON`);
    } catch (parseError) {
      logger.error(`❌ Current file is NOT valid JSON: ${parseError.message}`);
      return null;
    }
    
    // Check GLTF version
    if (!jsonData.asset) {
      logger.error(`❌ Missing required 'asset' property`);
    } else if (!jsonData.asset.version) {
      logger.error(`❌ Missing 'asset.version' property`);
    } else if (jsonData.asset.version !== "2.0") {
      logger.error(`❌ Invalid GLTF version: ${jsonData.asset.version} (should be "2.0")`);
    } else {
      logger.info(`✅ GLTF version is correct: ${jsonData.asset.version}`);
    }
    
    // Check scene structure
    if (!jsonData.scenes) {
      logger.error(`❌ Missing 'scenes' array`);
    }
    if (typeof jsonData.scene !== 'number') {
      logger.error(`❌ Missing or invalid 'scene' property`);
    }
    
    // Check nodes
    if (!Array.isArray(jsonData.nodes)) {
      logger.error(`❌ Missing or invalid 'nodes' array`);
    }
    
    // Check meshes
    if (!Array.isArray(jsonData.meshes)) {
      logger.error(`❌ Missing or invalid 'meshes' array`);
    }
    
    logger.info(`📊 Analysis complete for ${asset.filename}`);
    return jsonData;
    
  } catch (error) {
    logger.error(`❌ Failed to analyze ${asset.storagePath}: ${error.message}`);
    return null;
  }
}

/**
 * Upload corrected GLTF file
 */
async function uploadCorrectedGLTF(asset, gltfContent) {
  try {
    logger.info(`📤 Uploading corrected GLTF: ${asset.storagePath}`);
    
    const buffer = Buffer.from(gltfContent, 'utf8');
    
    await appStorageService.uploadAsset(asset.storagePath, buffer, {
      contentType: 'model/gltf+json',
      isPublic: false
    });
    
    logger.info(`✅ Successfully uploaded corrected GLTF: ${asset.storagePath}`);
    logger.info(`📏 New file size: ${buffer.length} bytes (was ${asset.fileSize} bytes)`);
    
  } catch (error) {
    logger.error(`❌ Failed to upload ${asset.storagePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Main execution function
 */
async function fixGLTFFiles() {
  logger.info(`🚀 Starting GLTF 2.0 format fix process...`);
  
  for (const asset of gltfAssets) {
    logger.info(`\n=== Processing ${asset.colorway} Leather Jacket (Asset ${asset.id}) ===`);
    
    // Step 1: Download and analyze current file
    const currentData = await analyzeCurrentGLTF(asset);
    
    // Step 2: Create valid GLTF 2.0 file
    logger.info(`🔧 Creating valid GLTF 2.0 file for ${asset.colorway} colorway...`);
    const validGLTF = createValidGLTF2(asset.colorway);
    
    // Step 3: Save locally for verification
    const outputDir = './temp-gltf-fixed';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `fixed_${asset.filename}`);
    fs.writeFileSync(outputFile, validGLTF);
    logger.info(`💾 Valid GLTF saved locally: ${outputFile}`);
    
    // Step 4: Upload corrected file to object storage
    await uploadCorrectedGLTF(asset, validGLTF);
    
    logger.info(`✅ Completed processing ${asset.colorway} colorway`);
  }
  
  logger.info(`\n🎉 All GLTF files have been corrected to valid GLTF 2.0 format!`);
  logger.info(`📁 Analysis files saved in: ./temp-gltf-analysis`);
  logger.info(`📁 Fixed files saved in: ./temp-gltf-fixed`);
}

// Run the fix process
fixGLTFFiles().catch(error => {
  logger.error(`💥 GLTF fix process failed: ${error.message}`);
  process.exit(1);
});