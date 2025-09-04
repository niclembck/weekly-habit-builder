// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true,
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules','dist','.storybook','src/stories/**'],
    coverage: {
      reporter: ['text', 'html', 'lcov'], // console + /coverage html + CI lcov
      reportsDirectory: 'coverage',
      // optional thresholds to keep quality high:
      // lines: 70, functions: 70, branches: 60, statements: 70,
    },
  },
})
