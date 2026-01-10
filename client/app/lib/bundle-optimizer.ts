// Performance Optimization: Week 3 - Bundle Analysis & Optimization
// Client-side bundle analysis and optimization utilities

interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  type: "js" | "css" | "font" | "image" | "other";
  isAsync: boolean;
  preloaded: boolean;
}

interface BundleReport {
  totalSize: number;
  totalGzippedSize: number;
  chunks: ChunkInfo[];
  recommendations: string[];
  score: number;
}

class BundleOptimizer {
  private chunks: ChunkInfo[] = [];
  private recommendations: string[] = [];

  constructor() {
    this.analyzeCurrentBundle();
  }

  private async analyzeCurrentBundle() {
    if (typeof window === "undefined") return;

    // Analyze JavaScript chunks
    await this.analyzeScripts();

    // Analyze CSS chunks
    await this.analyzeStylesheets();

    // Analyze fonts
    await this.analyzeFonts();

    // Generate recommendations
    this.generateRecommendations();
  }

  private async analyzeScripts() {
    const scripts = Array.from(document.querySelectorAll("script[src]")) as HTMLScriptElement[];

    for (const script of scripts) {
      // Skip Vite dev client - it's a virtual module that doesn't respond to HEAD requests
      if (script.src.includes("/@vite/client")) {
        continue;
      }
      if (script.src && (script.src.includes("/assets/") || script.src.includes("vite"))) {
        try {
          const info = await this.getResourceInfo(script.src, "js");
          if (info) {
            info.isAsync = script.async;
            info.preloaded = this.isPreloaded(script.src);
            this.chunks.push(info);
          }
        } catch (_e) {}
      }
    }
  }

  private async analyzeStylesheets() {
    const links = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]'),
    ) as HTMLLinkElement[];

    for (const link of links) {
      if (link.href?.includes("/assets/")) {
        try {
          const info = await this.getResourceInfo(link.href, "css");
          if (info) {
            info.preloaded = this.isPreloaded(link.href);
            this.chunks.push(info);
          }
        } catch (_e) {}
      }
    }
  }

  private async analyzeFonts() {
    const fontLinks = Array.from(
      document.querySelectorAll('link[rel="preload"][as="font"]'),
    ) as HTMLLinkElement[];

    for (const link of fontLinks) {
      try {
        const info = await this.getResourceInfo(link.href, "font");
        if (info) {
          info.preloaded = true;
          this.chunks.push(info);
        }
      } catch (_e) {}
    }
  }

  private async getResourceInfo(url: string, type: ChunkInfo["type"]): Promise<ChunkInfo | null> {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const size = parseInt(response.headers.get("content-length") || "0", 10);

      if (size === 0) return null;

      const name = url.split("/").pop()?.split("?")[0] || "unknown";
      const gzippedSize = this.estimateGzippedSize(size, type);

      return {
        name,
        size,
        gzippedSize,
        type,
        isAsync: false,
        preloaded: false,
      };
    } catch {
      return null;
    }
  }

  private estimateGzippedSize(originalSize: number, type: ChunkInfo["type"]): number {
    // Compression ratios based on content type
    const compressionRatios = {
      js: 0.35, // JavaScript compresses well
      css: 0.25, // CSS compresses very well
      font: 0.95, // Fonts are already compressed
      image: 0.9, // Images are usually already compressed
      other: 0.6,
    };

    return Math.round(originalSize * compressionRatios[type]);
  }

  private isPreloaded(url: string): boolean {
    const preloadLinks = document.querySelectorAll('link[rel="preload"]');
    return Array.from(preloadLinks).some((link) => (link as HTMLLinkElement).href === url);
  }

  private generateRecommendations() {
    const totalSize = this.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const jsSize = this.chunks
      .filter((c) => c.type === "js")
      .reduce((sum, chunk) => sum + chunk.size, 0);
    const cssSize = this.chunks
      .filter((c) => c.type === "css")
      .reduce((sum, chunk) => sum + chunk.size, 0);

    // Size-based recommendations
    if (totalSize > 2 * 1024 * 1024) {
      // 2MB
      this.recommendations.push("Consider code splitting to reduce initial bundle size");
    }

    if (jsSize > 1 * 1024 * 1024) {
      // 1MB
      this.recommendations.push(
        "JavaScript bundle is large - implement dynamic imports for non-critical features",
      );
    }

    if (cssSize > 500 * 1024) {
      // 500KB
      this.recommendations.push("CSS bundle is large - consider CSS-in-JS or split CSS by routes");
    }

    // Async loading recommendations
    const syncScripts = this.chunks.filter((c) => c.type === "js" && !c.isAsync);
    if (syncScripts.length > 3) {
      this.recommendations.push("Consider loading non-critical JavaScript asynchronously");
    }

    // Preloading recommendations
    const largeUnpreloadedChunks = this.chunks.filter((c) => c.size > 100 * 1024 && !c.preloaded);
    if (largeUnpreloadedChunks.length > 0) {
      this.recommendations.push("Consider preloading large chunks that are needed early");
    }

    // Three.js specific recommendations
    const hasThreeJS = this.chunks.some(
      (c) => c.name.includes("three") || c.name.includes("fiber"),
    );
    if (hasThreeJS) {
      this.recommendations.push(
        "Three.js detected - consider lazy loading 3D components that are below the fold",
      );
    }

    // Animation library recommendations
    const hasGSAP = this.chunks.some((c) => c.name.includes("gsap"));
    if (hasGSAP) {
      this.recommendations.push("GSAP detected - lazy load if used for non-critical animations");
    }
  }

  public generateReport(): BundleReport {
    const totalSize = this.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const totalGzippedSize = this.chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0);

    // Calculate performance score (0-100)
    let score = 100;

    // Deduct points for large bundles
    if (totalGzippedSize > 2 * 1024 * 1024)
      score -= 30; // 2MB
    else if (totalGzippedSize > 1 * 1024 * 1024)
      score -= 20; // 1MB
    else if (totalGzippedSize > 500 * 1024) score -= 10; // 500KB

    // Deduct points for number of chunks
    if (this.chunks.length > 10) score -= 15;
    else if (this.chunks.length > 5) score -= 5;

    // Deduct points for sync scripts
    const syncScripts = this.chunks.filter((c) => c.type === "js" && !c.isAsync);
    if (syncScripts.length > 3) score -= 10;

    return {
      totalSize,
      totalGzippedSize,
      chunks: this.chunks.sort((a, b) => b.size - a.size), // Sort by size descending
      recommendations: this.recommendations,
      score: Math.max(0, score),
    };
  }

  public generateDetailedReport(): string {
    const report = this.generateReport();
    const { totalSize, totalGzippedSize, chunks, recommendations, score } = report;

    let output = `
📦 Bundle Analysis Report - RUN APPAREL
======================================

Overall Score: ${score}/100 ${score >= 90 ? "🟢" : score >= 70 ? "🟡" : "🔴"}

Bundle Overview:
- Total Size: ${this.formatSize(totalSize)}
- Gzipped Size: ${this.formatSize(totalGzippedSize)}
- Number of Chunks: ${chunks.length}
- Compression Ratio: ${((1 - totalGzippedSize / totalSize) * 100).toFixed(1)}%

Chunk Breakdown:
`;

    // Group chunks by type
    const chunksByType = chunks.reduce(
      (acc, chunk) => {
        if (!acc[chunk.type]) acc[chunk.type] = [];
        acc[chunk.type]?.push(chunk);
        return acc;
      },
      {} as Record<string, ChunkInfo[]>,
    );

    Object.entries(chunksByType).forEach(([type, typeChunks]) => {
      const typeSize = typeChunks.reduce((sum, chunk) => sum + chunk.size, 0);
      const typeGzippedSize = typeChunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0);

      output += `
${type.toUpperCase()} Files (${typeChunks.length}):
- Total: ${this.formatSize(typeSize)} (${this.formatSize(typeGzippedSize)} gzipped)
`;

      // Show largest files in this category
      typeChunks.slice(0, 3).forEach((chunk) => {
        output += `  • ${chunk.name}: ${this.formatSize(chunk.size)} ${
          chunk.isAsync ? "(async)" : ""
        } ${chunk.preloaded ? "(preloaded)" : ""}\n`;
      });
    });

    if (recommendations.length > 0) {
      output += `
Optimization Recommendations:
`;
      recommendations.forEach((rec, index) => {
        output += `${index + 1}. ${rec}\n`;
      });
    }

    output += `
Performance Impact:
- LCP Impact: ${
      totalGzippedSize > 1024 * 1024 ? "High" : totalGzippedSize > 500 * 1024 ? "Medium" : "Low"
    }
- FCP Impact: ${chunks.filter((c) => c.type === "css").length > 3 ? "Medium" : "Low"}
- Bundle Parse Time: ~${Math.round(totalGzippedSize / (1024 * 50))}ms (estimated)
`;

    return output.trim();
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  }

  // Tree shaking analysis (basic)
  public analyzeTreeShaking(): Promise<string[]> {
    return new Promise((resolve) => {
      // This would need build-time analysis for accurate results
      // For now, we provide general recommendations
      const suggestions = [
        "Use ES6 imports instead of CommonJS requires",
        "Import only specific functions from large libraries",
        "Check for unused CSS classes and animations",
        "Remove unused Three.js modules",
        "Optimize GSAP imports to only needed features",
      ];

      setTimeout(() => resolve(suggestions), 100);
    });
  }

  // Code splitting opportunities
  public identifyCodeSplitOpportunities(): string[] {
    const opportunities = [];

    // Check for large chunks that could be split
    const largeChunks = this.chunks.filter((c) => c.size > 500 * 1024);
    if (largeChunks.length > 0) {
      opportunities.push("Split large chunks into smaller route-based chunks");
    }

    // Check for vendor chunks
    const hasLargeVendorCode = this.chunks.some(
      (c) => c.name.includes("vendor") || c.name.includes("node_modules"),
    );
    if (hasLargeVendorCode) {
      opportunities.push("Separate vendor dependencies into dedicated chunks");
    }

    // Three.js specific
    const hasThreeJS = this.chunks.some((c) => c.name.includes("three"));
    if (hasThreeJS) {
      opportunities.push("Lazy load Three.js components for below-the-fold 3D content");
    }

    return opportunities;
  }
}

// Global bundle optimizer instance
export const bundleOptimizer = new BundleOptimizer();

// Utility functions for bundle optimization
export const BundleUtils = {
  // Print bundle report to console
  logBundleReport: () => {},

  // Get performance score
  getPerformanceScore: (): number => {
    return bundleOptimizer.generateReport().score;
  },

  // Check if bundle is optimized
  isBundleOptimized: (): boolean => {
    const report = bundleOptimizer.generateReport();
    return report.score >= 80 && report.totalGzippedSize < 1024 * 1024; // 1MB
  },

  // Get size breakdown
  getSizeBreakdown: () => {
    const report = bundleOptimizer.generateReport();
    const breakdown = report.chunks.reduce(
      (acc, chunk) => {
        if (!acc[chunk.type]) acc[chunk.type] = 0;
        acc[chunk.type]! += chunk.gzippedSize;
        return acc;
      },
      {} as Record<string, number>,
    );

    return breakdown;
  },
};

export default BundleOptimizer;
