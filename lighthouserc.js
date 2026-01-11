module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:5001/', 'http://localhost:5001/products'],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Server running on port',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        // Performance
        'categories:performance': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Accessibility
        'categories:accessibility': ['error', { minScore: 0.9 }],
        
        // Best Practices
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        
        // SEO
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
