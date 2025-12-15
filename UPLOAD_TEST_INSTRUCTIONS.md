# GLTF Upload Test Instructions

## Test File
**File:** `/public/assets/3d/cube.glb`
**Size:** 14KB (small, trusted file)
**Format:** Binary GLTF (.glb)

## Pre-Upload Setup

### Console Logs to Monitor
Open browser DevTools console. You'll see these logs in sequence:

#### 1. File Picker Opens
```
[File Picker] Opening with accepted types: .gltf,.glb,...
[File Picker] GLTF files: ✅ .gltf and .glb are included
```

#### 2. File Selected
```
[File Input] Selected 1 file(s):
  1. cube.glb (<mime-type>, 14KB)
[File Validation] GLTF file detected: cube.glb
[File Validation] → Extension: .glb ✅ (in allowed list)
[File Validation] → Size: 0MB
[File Validation] Validated: cube.glb → model/gltf-binary
```

#### 3. Upload Progress
```
[Worker Upload] Starting worker-based upload for 14KB file
[Worker Upload] Initialized: <session-id>, 1 chunks
[Worker Upload] Progress: 100%
```

#### 4. Finalization (Backend logs)
```
[Finalize Upload] Starting finalization for: cube.glb
[Finalize Upload] → MIME Type: model/gltf-binary
[Finalize Upload] → Total Size: 14336 bytes
[Finalize Upload] → Chunks: 1/1
[Finalize Upload] ✅ Assembled 1 chunks into 14336 bytes
[Finalize Upload] → Detected media type: models
[Finalize Upload] → Generated storage key: public/media/models/2025/10/<timestamp>-cube.glb
[Finalize Upload] ✅ Uploaded to storage: <storage-key>
[Finalize Upload] → File type: model
```

## Upload Steps

### Step 1: Navigate to Admin Media
1. Go to `/admin/media` in your browser
2. Open browser DevTools Console (F12)

### Step 2: Select Test File
1. Click "Select Files" or drag-and-drop area
2. Navigate to `/public/assets/3d/` in file picker
3. Select `cube.glb` (14KB)

### Step 3: Monitor Upload
Watch console for the 4 log sequences above.

### Step 4: Check for Errors

#### Frontend Errors (Browser Console)
Look for:
- ❌ `[Worker Upload] Error: Finalize failed: 500 Internal Server Error`
- ❌ `[Worker Upload] Error: Finalize failed: 415 Unsupported Media Type`
- ❌ `[Worker Upload] Error: Finalize failed: 413 Payload Too Large`

#### Backend Errors (Server Logs)
Look for:
- ❌ `Error finalizing upload:`
- ❌ `Failed to finalize upload`
- ❌ `Unsupported media type`
- ❌ `Maximum request body size exceeded`

## Success Criteria

### ✅ Upload Succeeds If:
1. **Browser Console Shows:**
   - File validation passes
   - Upload reaches 100%
   - ✅ Success response received

2. **Server Logs Show:**
   - All finalization steps complete
   - Storage key generated
   - File uploaded to storage
   - Database record created

3. **UI Shows:**
   - New media entry appears in grid
   - Thumbnail displays (or model icon)
   - File details visible in viewer

4. **Object Storage:**
   - File exists at: `public/media/models/2025/10/<timestamp>-cube.glb`

## Verification Commands

After upload, run these to verify:

### Check Database Record
```sql
SELECT id, filename, storagePath, mimeType, type, uploadedAt 
FROM media 
WHERE filename LIKE '%cube%' 
ORDER BY uploadedAt DESC 
LIMIT 1;
```

### Check Object Storage
Use the admin panel's "Media Library" to verify the file appears, or check logs for storage path.

## Error Scenarios

### Scenario 1: 415 Unsupported Media Type
**Cause:** MIME type not in allowed list
**Fix:** Already added to upload-config.ts

### Scenario 2: 500 Internal Server Error (Current Issue)
**Cause:** Finalization logic failing
**Fix:** New logging will reveal exact failure point

### Scenario 3: 413 Payload Too Large
**Cause:** File exceeds size limit
**Fix:** Already configured for 500MB (14KB << 500MB)

## Expected Storage Path

**Format:**
```
public/media/models/2025/10/<timestamp>-cube.glb
```

**Example:**
```
public/media/models/2025/10/1760270500000-cube.glb
```

## If Upload Fails

### Capture These Details:
1. **Full browser console output** (all 4 log sequences)
2. **Exact error message** from worker upload
3. **Server logs** around the timestamp of the error
4. **Last successful log** in finalization sequence

### Check Server Logs:
```bash
# Get recent logs with error context
grep -i "finalize\|cube\|gltf\|error" /tmp/logs/Start_application_*.log | tail -50

# Get specific error details
grep -A 10 "Error finalizing upload" /tmp/logs/Start_application_*.log | tail -30
```

## Test File Details

**cube.glb:**
- Size: 14KB (well within all limits)
- Format: Binary GLTF (glTF 2.0)
- Location: `/public/assets/3d/cube.glb`
- Expected MIME: `model/gltf-binary`
- Should trigger: Single chunk upload (no chunking)

## Ready to Test!

1. ✅ Frontend logging added
2. ✅ Backend logging added  
3. ✅ Test file identified
4. ✅ Monitoring instructions ready

**Now upload `cube.glb` and capture all console output!**
