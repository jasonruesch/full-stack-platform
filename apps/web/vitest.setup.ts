import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';
import * as matchers from 'vitest-axe/matchers';
import { useSessionStore } from './src/stores/session.store';

expect.extend(matchers);

afterEach(() => {
  cleanup();
  useSessionStore.getState().clear();
  localStorage.clear();
});
