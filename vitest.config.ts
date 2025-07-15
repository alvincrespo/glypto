import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', 'src'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'bin/',
        // Interface-only files (no executable code to test)
        'src/types.ts',
        // CLI entry points (covered by integration testing if needed)
        'src/index.ts',
        // Export aggregation files (just re-exports)
        'src/exports.ts'
      ]
    }
  }
});