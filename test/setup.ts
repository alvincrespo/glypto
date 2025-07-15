import { vi } from 'vitest';

// Mock fetch for testing
global.fetch = vi.fn();

// Suppress console.warn during tests to avoid confusing stderr output
// This is particularly useful for expected error scenarios in provider loading
const originalConsoleWarn = console.warn;
console.warn = vi.fn();

// Setup DOM globals
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    hostname: 'localhost',
    port: '3000',
    protocol: 'http:',
  },
  writable: true,
});

// Cleanup function to restore console.warn if needed
export const restoreConsole = () => {
  console.warn = originalConsoleWarn;
};
