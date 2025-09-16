module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/api/health',
      ],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'started on',
      settings: {
        chromeFlags: '--no-sandbox',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'interactive': ['warn', { maxNumericValue: 4000 }],
      },
    },
  },
};