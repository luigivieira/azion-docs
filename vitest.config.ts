import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/__mocks__/**', 'src/pages/**'],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
      reporter: ['text', 'lcov', 'html'],
    },
  },
  resolve: {
    alias: [
      {
        find: /^@docusaurus\/.*/,
        replacement: path.resolve(__dirname, 'src/__mocks__/docusaurus.ts'),
      },
      // Docusaurus theme internals (e.g. @theme-original/DocBreadcrumbs) are
      // not resolvable outside the Docusaurus build pipeline; map them to a
      // separate stub so Vite can transform files that import them.
      // Tests override specific modules with vi.mock('...', factory).
      {
        find: /^@theme(-original)?\/.*/,
        replacement: path.resolve(__dirname, 'src/__mocks__/theme.ts'),
      },
      {
        find: '@site',
        replacement: path.resolve(__dirname, '.'),
      },
    ],
  },
});
