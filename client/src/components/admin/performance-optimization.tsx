import { useEffect } from 'react';

// PHASE 2: Advanced Performance Optimization - Sub-0.1 CLS Target
export function PerformanceOptimization() {
  useEffect(() => {
    // RE-ENABLED: Performance optimization with visual selection compatibility
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Performance] Optimization enabled with selection fixes');
    }
    
    // Inject critical CSS for layout stability
    const style = document.createElement('style');
    style.id = 'performance-optimization-styles';
    style.textContent = `
      /* PHASE 2: Ultimate CLS Prevention - Force all dimensions */
      
      /* CRITICAL: Force body layout stability - only for media library */
      .media-library {
        overflow-x: hidden;
      }
      
      /* Media Grid Stabilization */
      .media-grid-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
        width: 100%;
        min-height: 296px;
        /* REMOVED: contain: layout style - was creating selection barriers */
        contain: paint;
      }
      
      .media-grid-item {
        width: 280px !important;
        height: 280px !important;
        min-width: 280px !important;
        min-height: 280px !important;
        max-width: 280px !important;
        max-height: 280px !important;
        display: flex;
        flex-direction: column;
        /* REMOVED: contain: layout style - was creating selection barriers */
        contain: paint;
      }
      
      /* Media Preview Containers - Prevent Dynamic Sizing */
      .media-preview-container {
        width: 100% !important;
        height: 200px !important;
        min-height: 200px !important;
        max-height: 200px !important;
        position: relative;
        overflow: hidden;
        background: #f5f5f5;
        /* REMOVED: contain: layout style - was creating selection barriers */
        /* REMOVED: contain: paint - was creating selection barriers for visual editor */
      }
      
      .media-preview-container img,
      .media-preview-container video,
      .media-preview-container model-viewer {
        width: 100% !important;
        height: 100% !important;
        position: absolute;
        top: 0;
        left: 0;
        /* REMOVED: contain: layout style - was creating selection barriers */
        /* REMOVED: contain: paint - was creating selection barriers for visual editor */
        /* REMOVED: object-fit: cover - conflicts with SVG display, handled by global CSS */
      }
      
      /* Media Info Section - Fixed Height */
      .media-info {
        height: 80px !important;
        min-height: 80px !important;
        max-height: 80px !important;
        padding: 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        /* REMOVED: contain: layout style - was creating selection barriers */
        /* REMOVED: contain: paint - was creating selection barriers for visual editor */
      }
      
      /* List View Stabilization */
      .media-list-item {
        width: 100% !important;
        height: 64px !important;
        min-height: 64px !important;
        max-height: 64px !important;
        /* REMOVED: contain: layout style - was creating selection barriers */
        /* REMOVED: contain: paint - was creating selection barriers for visual editor */
      }
      
      /* Prevent Layout Shifts During Loading */
      .media-skeleton {
        /* REMOVED: contain: layout style - was creating selection barriers */
        /* REMOVED: contain: paint - was creating selection barriers for visual editor */
        animation: none !important;
      }
      
      /* Upload Progress - Fixed Dimensions */
      .upload-progress-container {
        min-height: 120px !important;
        max-height: 120px !important;
        /* REMOVED: contain: layout style - was creating selection barriers */
        /* REMOVED: contain: paint - was creating selection barriers for visual editor */
      }
      
      /* Drag Zone - Fixed Minimum Height */
      .drag-zone {
        min-height: 400px !important;
        /* REMOVED: contain: layout style - was creating selection barriers */
        /* REMOVED: contain: paint - was creating selection barriers for visual editor */
      }
      
      /* Prevent Three.js Model Viewer Layout Shifts */
      model-viewer {
        width: 100% !important;
        height: 100% !important;
        /* REMOVED: contain: layout style - was creating selection barriers */
        /* REMOVED: contain: paint - was creating selection barriers for visual editor */
      }
      
      /* Force Hardware Acceleration for Better Performance */
      .media-grid-item,
      .media-preview-container,
      .media-info {
        /* REMOVED: transform: translateZ(0) - was creating stacking context barriers */
        /* REMOVED: will-change: transform - was creating performance barriers */
        /* All hardware acceleration removed for visual selection compatibility */
      }
      
      /* Disable Transitions During Initial Load */
      .initial-load * {
        transition: none !important;
        animation: none !important;
      }
      
      /* CRITICAL: Prevent grid reflows that cause CLS */
      .media-grid-container > * {
        flex-shrink: 0;
      }
      
      /* CRITICAL: Force video and image dimensions - only in media library */
      .media-library video, .media-library img, .media-library model-viewer {
        max-width: 100% !important;
        height: auto !important;
      }
      
      /* CRITICAL: Prevent Three.js canvas resizing - only on categories page */
      .categories-page canvas {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      /* Critical - Prevent all dynamic height changes */
      .media-library-content {
        contain: layout style;
      }
      
      .media-library-content > div {
        contain: layout style;
      }
      
      /* Pagination - Fixed Height */
      .pagination-container {
        height: 64px !important;
        min-height: 64px !important;
        max-height: 64px !important;
        contain: layout style;
      }
      
      /* Toolbar - Fixed Height */
      .media-toolbar {
        height: 80px !important;
        min-height: 80px !important;
        max-height: 80px !important;
        contain: layout style;
      }
    `;
    
    document.head.appendChild(style);
    
    // Force layout stability on page load
    const forceLayoutStability = () => {
      const mediaContainers = document.querySelectorAll('.media-preview-container');
      mediaContainers.forEach(container => {
        (container as HTMLElement).style.height = '200px';
        (container as HTMLElement).style.minHeight = '200px';
        (container as HTMLElement).style.maxHeight = '200px';
      });
      
      const mediaItems = document.querySelectorAll('.media-grid-item');
      mediaItems.forEach(item => {
        (item as HTMLElement).style.height = '280px';
        (item as HTMLElement).style.minHeight = '280px';
        (item as HTMLElement).style.maxHeight = '280px';
      });
      
      const listItems = document.querySelectorAll('.media-list-item');
      listItems.forEach(item => {
        (item as HTMLElement).style.height = '64px';
        (item as HTMLElement).style.minHeight = '64px';
        (item as HTMLElement).style.maxHeight = '64px';
      });
    };
    
    // Apply immediately and after DOM changes
    forceLayoutStability();
    
    const observer = new MutationObserver(() => {
      forceLayoutStability();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    // DISABLED: Performance monitoring causing visual selection issues
    // const performanceObserver = new PerformanceObserver((list) => {
    //   const entries = list.getEntries();
    //   entries.forEach(entry => {
    //     if (entry.entryType === 'layout-shift') {
    //       console.log('[Performance] CLS:', (entry as any).value);
    //     }
    //     if (entry.entryType === 'largest-contentful-paint') {
    //       console.log('[Performance] LCP:', entry.startTime);
    //     }
    //     if (entry.entryType === 'first-input') {
    //       console.log('[Performance] FID:', entry.duration);
    //     }
    //   });
    // });
    
    // performanceObserver.observe({
    //   type: 'layout-shift',
    //   buffered: true
    // });
    
    // performanceObserver.observe({
    //   type: 'largest-contentful-paint',
    //   buffered: true
    // });
    
    // performanceObserver.observe({
    //   type: 'first-input',
    //   buffered: true
    // });
    
    return () => {
      observer.disconnect();
      // performanceObserver.disconnect(); // Commented out - not defined
      const existingStyle = document.getElementById('performance-optimization-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);
  
  return null;
}