// src/setupTests.ts
import '@testing-library/jest-dom/vitest';           // registers jest-dom matchers with Vitest
import { cleanup } from '@testing-library/react';

// auto-cleanup after each test (like RTL does with Jest)
import { afterEach } from 'vitest';
afterEach(() => {
  cleanup();
});
