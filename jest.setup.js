import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isLocaleDomain: false,
      isReady: true,
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-api-key';
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Mock FormData
global.FormData = class FormData {
  constructor() {
    this.data = new Map();
  }
  
  append(key, value) {
    this.data.set(key, value);
  }
  
  get(key) {
    return this.data.get(key);
  }
  
  getAll(key) {
    return [this.data.get(key)].filter(Boolean);
  }
};

// Mock File API
global.File = class File {
  constructor(fileBits, fileName, options = {}) {
    this.name = fileName;
    this.type = options.type || '';
    this.size = fileBits.length || 0;
    this.lastModified = Date.now();
  }
  
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size));
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});