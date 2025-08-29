import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    // Add timeouts to prevent hanging
    testTimeout: 30000,     // 30 seconds for individual tests
    hookTimeout: 30000,     // 30 seconds for hooks
    teardownTimeout: 30000, // 30 seconds for teardown
    // Run tests serially to avoid race conditions during development
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/build/**'
      ]
    }
  }
});
