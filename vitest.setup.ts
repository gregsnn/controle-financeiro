import '@testing-library/jest-dom/vitest';
import { beforeAll } from 'vitest';

beforeAll(() => {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0]?.toString?.() || '';
    if (message.includes('esbuild') && message.includes('deprecated') && message.includes('oxc')) {
      return;
    }
    originalWarn(...args);
  };
});
