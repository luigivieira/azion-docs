// Generic stub for @theme/* and @theme-original/* imports in the test environment.
// Vite needs to be able to resolve these paths during transformation.
// Individual tests override specific modules with vi.mock('...', factory).
export default () => null;
