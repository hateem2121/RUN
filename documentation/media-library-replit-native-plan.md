# Media Library Rebuild Plan - Replit Native Edition

## Executive Summary

A streamlined 2-week plan to rebuild the media library using only Replit's native tooling and infrastructure. This approach eliminates external dependencies while maintaining zero-crash reliability and sub-500ms performance.

### Key Simplifications
- **No external services**: Everything runs within Replit's ecosystem
- **Single architecture**: Express server + React Context (no Zustand)
- **Native storage**: Replit Object Storage for files, existing Postgres for metadata
- **Compressed timeline**: 2 weeks instead of 4
- **Essential features only**: Core functionality without enterprise extras

## Pre-Implementation (1 day)

### Environment Setup
```
1. Create new directory: /client/src/components/media-v2/
2. Set up Playwright tests in /tests/media/
3. Configure Sharp for image processing (already in package.json)
4. Document existing media assets for migration
```

### Architecture Decisions
- **State Management**: React Context (not Redux/Zustand)
- **File Storage**: Replit Object Storage
- **Database**: Existing Postgres with current schema
- **CDN**: Automatic via Replit Edge Network
- **Testing**: Playwright + React Testing Library

## Week 1: Core Implementation (Days 1-5)

### Day 1-2: Foundation & API

#### Database Schema Extension
```typescript
// Add to existing MediaAsset table
interface MediaAssetExtensions {
  blurhash?: string;        // For progressive loading
  thumbnailKey?: string;    // Object storage key for thumbnail
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;      // For videos
  };
}
```

#### Core API Endpoints
```typescript
// Simple Express routes in server/routes.ts
app.post('/api/v2/media/upload', uploadMiddleware, async (req, res) => {
  // 1. Validate file
  // 2. Upload to Replit Object Storage
  // 3. Generate blurhash with Sharp
  // 4. Create database record
  // 5. Return asset data
});

app.get('/api/v2/media', async (req, res) => {
  // Paginated list with filters
  // Include blurhash for instant previews
});

app.delete('/api/v2/media/:id', async (req, res) => {
  // 1. Delete from database
  // 2. Delete from object storage
  // 3. Delete thumbnail if exists
});

app.patch('/api/v2/media/:id', async (req, res) => {
  // Update metadata only
  // Filename/storage keys are immutable
});
```

#### React Context Setup
```typescript
// MediaContext.tsx - Simplified state management
interface MediaState {
  assets: MediaAsset[];
  loading: boolean;
  error: string | null;
  selection: Set<number>;
  filters: {
    search: string;
    type: string;
    folderId: number | null;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface MediaContextValue extends MediaState {
  // Actions
  uploadFile: (file: File) => Promise<void>;
  deleteAsset: (id: number) => Promise<void>;
  updateAsset: (id: number, data: Partial<MediaAsset>) => Promise<void>;
  selectAsset: (id: number, multi?: boolean) => void;
  setFilters: (filters: Partial<MediaState['filters']>) => void;
  refreshAssets: () => Promise<void>;
}
```

### Day 3: Upload System

#### Components
```typescript
// MediaUploadButton.tsx
export function MediaUploadButton() {
  const { uploadFile } = useMedia();
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      await uploadFile(file);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Button disabled={uploading}>
      <input type="file" onChange={handleUpload} hidden />
      {uploading ? 'Uploading...' : 'Upload File'}
    </Button>
  );
}

// MediaDropzone.tsx
export function MediaDropzone() {
  const { uploadFile } = useMedia();
  const [dragActive, setDragActive] = useState(false);
  
  // Drag and drop handlers
  // File validation
  // Progress tracking
}
```

#### Server Upload Handler
```typescript
// Replit Object Storage integration
import { Storage } from '@replit/object-storage';
import sharp from 'sharp';
import { encode } from 'blurhash';

async function handleUpload(file: Express.Multer.File) {
  const storage = new Storage();
  
  // 1. Generate unique key
  const key = `media/${Date.now()}-${file.originalname}`;
  
  // 2. Process image if applicable
  let blurhash = null;
  let metadata = {};
  
  if (file.mimetype.startsWith('image/')) {
    const image = sharp(file.buffer);
    const { width, height } = await image.metadata();
    
    // Generate blurhash
    const { data, info } = await image
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true });
    
    blurhash = encode(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      4,
      4
    );
    
    // Generate thumbnail
    const thumbnail = await image
      .resize(300, 300, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    await storage.set(`${key}-thumb`, thumbnail);
    metadata = { width, height };
  }
  
  // 3. Upload original file
  await storage.set(key, file.buffer);
  
  // 4. Create database record
  const asset = await db.insert(mediaAssets).values({
    filename: key,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    blurhash,
    thumbnailKey: `${key}-thumb`,
    metadata,
    uploadedAt: new Date()
  }).returning();
  
  return asset[0];
}
```

### Day 4: Display System

#### Virtual Grid Implementation
```typescript
// MediaVirtualGrid.tsx
import { FixedSizeGrid } from 'react-window';

export function MediaVirtualGrid() {
  const { assets, selection, selectAsset } = useMedia();
  const [columns, setColumns] = useState(4);
  
  // Calculate responsive columns
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      setColumns(width < 640 ? 2 : width < 1024 ? 3 : 4);
    };
    
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);
  
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columns + columnIndex;
    const asset = assets[index];
    
    if (!asset) return null;
    
    return (
      <div style={style} className="p-2">
        <MediaCard
          asset={asset}
          selected={selection.has(asset.id)}
          onSelect={() => selectAsset(asset.id)}
        />
      </div>
    );
  };
  
  return (
    <FixedSizeGrid
      columnCount={columns}
      columnWidth={window.innerWidth / columns}
      height={600}
      rowCount={Math.ceil(assets.length / columns)}
      rowHeight={200}
      width={window.innerWidth}
    >
      {Cell}
    </FixedSizeGrid>
  );
}

// MediaCard.tsx with Blurhash
export function MediaCard({ asset, selected, onSelect }) {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div 
      className={`media-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      {/* Blurhash placeholder */}
      {asset.blurhash && !loaded && (
        <Blurhash
          hash={asset.blurhash}
          width="100%"
          height="100%"
          className="absolute inset-0"
        />
      )}
      
      {/* Actual image */}
      <img
        src={`/api/media/proxy/${asset.id}`}
        alt={asset.altText || asset.originalName}
        onLoad={() => setLoaded(true)}
        className={`transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      
      <div className="media-info">
        <span>{asset.originalName}</span>
        <span>{formatFileSize(asset.size)}</span>
      </div>
    </div>
  );
}
```

### Day 5: Search, Filters & Folders

#### Search Implementation
```typescript
// MediaSearch.tsx
export function MediaSearch() {
  const { filters, setFilters } = useMedia();
  const [query, setQuery] = useState(filters.search);
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: query });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query]);
  
  return (
    <Input
      placeholder="Search media..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

// Server-side search
app.get('/api/v2/media', async (req, res) => {
  const { search, type, folderId, page = 1, limit = 20 } = req.query;
  
  let query = db.select().from(mediaAssets);
  
  if (search) {
    query = query.where(
      sql`${mediaAssets.originalName} ILIKE ${`%${search}%`} 
          OR ${mediaAssets.altText} ILIKE ${`%${search}%`}`
    );
  }
  
  if (type) {
    query = query.where(eq(mediaAssets.mimeType, type));
  }
  
  if (folderId) {
    query = query.where(eq(mediaAssets.folderId, folderId));
  }
  
  const assets = await query
    .limit(limit)
    .offset((page - 1) * limit);
    
  return res.json({
    data: assets,
    pagination: { page, limit, total: await getCount(query) }
  });
});
```

## Week 1 Testing (Concurrent with Development)

### Unit Tests (Jest)
```typescript
describe('Media Upload', () => {
  it('validates file types', async () => {
    const invalidFile = new File([''], 'test.exe', { type: 'application/exe' });
    await expect(uploadFile(invalidFile)).rejects.toThrow('Invalid file type');
  });
  
  it('generates blurhash for images', async () => {
    const imageFile = new File([imageBuffer], 'test.jpg', { type: 'image/jpeg' });
    const result = await uploadFile(imageFile);
    expect(result.blurhash).toBeDefined();
  });
});
```

### Integration Tests (Playwright)
```typescript
test('upload flow', async ({ page }) => {
  await page.goto('/admin/media');
  
  // Upload file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setFiles('tests/fixtures/test-image.jpg');
  
  // Wait for upload
  await page.waitForSelector('.media-card');
  
  // Verify blurhash loads first
  const blurhash = page.locator('.blurhash');
  await expect(blurhash).toBeVisible();
  
  // Verify image loads
  const img = page.locator('.media-card img');
  await expect(img).toHaveAttribute('src', /\/api\/media\/proxy/);
});
```

## Week 2: Integration & Migration (Days 6-10)

### Day 6-7: Admin Integration

#### Universal Media Picker
```typescript
// UnifiedMediaPicker.tsx
interface MediaPickerProps {
  value?: number | number[];
  onChange: (value: number | number[]) => void;
  multiple?: boolean;
  accept?: string[];
}

export function UnifiedMediaPicker({ value, onChange, multiple, accept }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Select Media ({Array.isArray(value) ? value.length : value ? 1 : 0})
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <MediaProvider>
            <MediaLibraryEmbed
              onSelect={(assets) => {
                onChange(multiple ? assets : assets[0]);
                setOpen(false);
              }}
              multiple={multiple}
              accept={accept}
            />
          </MediaProvider>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

#### Integration Points
```typescript
// Product page integration
<FormField
  control={form.control}
  name="images"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Product Images</FormLabel>
      <UnifiedMediaPicker
        value={field.value}
        onChange={field.onChange}
        multiple
        accept={['image/*']}
      />
    </FormItem>
  )}
/>

// Category page integration
<FormField
  control={form.control}
  name="heroImage"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Hero Image</FormLabel>
      <UnifiedMediaPicker
        value={field.value}
        onChange={field.onChange}
        accept={['image/*', 'video/*']}
      />
    </FormItem>
  )}
/>
```

### Day 8: Migration Script

```typescript
// scripts/migrate-media.ts
import { Storage } from '@replit/object-storage';

async function migrateMedia() {
  console.log('Starting media migration...');
  
  // 1. Get existing assets
  const existingAssets = await db.select().from(mediaAssets);
  console.log(`Found ${existingAssets.length} assets to migrate`);
  
  // 2. Process each asset
  const storage = new Storage();
  let migrated = 0;
  let failed = 0;
  
  for (const asset of existingAssets) {
    try {
      // Check if already migrated
      if (asset.blurhash) {
        console.log(`Skipping ${asset.filename} - already migrated`);
        continue;
      }
      
      // Get file from storage
      const fileData = await storage.get(asset.filename);
      if (!fileData) {
        console.error(`File not found: ${asset.filename}`);
        failed++;
        continue;
      }
      
      // Generate blurhash if image
      let blurhash = null;
      if (asset.mimeType?.startsWith('image/')) {
        blurhash = await generateBlurhash(Buffer.from(fileData));
      }
      
      // Update database
      await db.update(mediaAssets)
        .set({ blurhash })
        .where(eq(mediaAssets.id, asset.id));
      
      migrated++;
      console.log(`Migrated ${asset.filename} (${migrated}/${existingAssets.length})`);
    } catch (error) {
      console.error(`Failed to migrate ${asset.filename}:`, error);
      failed++;
    }
  }
  
  console.log(`Migration complete: ${migrated} success, ${failed} failed`);
}

// Run migration
migrateMedia().catch(console.error);
```

### Day 9: Polish & Optimization

#### Performance Optimizations
```typescript
// Lazy loading with Intersection Observer
export function LazyMediaCard({ asset }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={ref}>
      {isVisible ? (
        <MediaCard asset={asset} />
      ) : (
        <div className="media-placeholder" />
      )}
    </div>
  );
}

// Request debouncing
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    setFilters({ search: query });
  }, 300),
  []
);
```

### Day 10: Documentation & Launch

#### Component Documentation
```markdown
# Media Library Components

## MediaProvider
Wraps the media library and provides context.

## MediaUploadButton
Simple file upload button with progress tracking.

## MediaDropzone
Drag-and-drop upload area with file validation.

## MediaVirtualGrid
Virtualized grid for displaying thousands of assets efficiently.

## UnifiedMediaPicker
Universal media selection component for admin pages.

### Usage Examples
```typescript
// Basic upload
<MediaProvider>
  <MediaUploadButton onUpload={handleUpload} />
</MediaProvider>

// Media picker in form
<UnifiedMediaPicker
  value={selectedIds}
  onChange={setSelectedIds}
  multiple
/>
```

## Testing

### Running Tests
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Test Coverage Goals
- API endpoints: 100%
- Core components: 90%
- Utils/helpers: 100%
- Integration flows: 80%

## Performance Metrics

### Target Performance
- Page load: <500ms
- Upload start: <100ms
- Search results: <100ms
- Grid render: <16ms (60fps)

### Monitoring
```typescript
// Built-in performance tracking
export function trackPerformance(metric: string, value: number) {
  if (window.performance && window.performance.measure) {
    performance.mark(`${metric}-end`);
    performance.measure(metric, `${metric}-start`, `${metric}-end`);
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Performance: ${metric} = ${value}ms`);
  }
}
```

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Migration script tested
- [ ] Performance metrics met
- [ ] Documentation complete

### Deployment Steps
1. Run migration script in dry-run mode
2. Backup existing data
3. Deploy new code
4. Run migration script
5. Verify all admin pages working
6. Monitor error logs

### Rollback Plan
1. Revert code deployment
2. Restore from backup if needed
3. Investigate issues
4. Fix and redeploy

## Success Criteria

### Quantitative
- Zero crashes in production
- <500ms page load time
- 100% migration success
- 90%+ test coverage

### Qualitative
- Simplified codebase
- Easy to maintain
- Intuitive UI
- Reliable uploads

## Conclusion

This 2-week plan delivers a production-ready media library using only Replit's native tooling. By focusing on essentials and leveraging Replit's infrastructure, we achieve:

- **Simplicity**: Single Express server, React Context, minimal dependencies
- **Reliability**: Comprehensive testing, proper error handling
- **Performance**: Blurhash previews, virtual scrolling, lazy loading
- **Integration**: Seamless admin page integration with migration path

The system is designed to be maintainable, performant, and reliable for years to come.