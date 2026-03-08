import React from 'react';
import {vi} from 'vitest';

export const useColorMode = () => ({colorMode: 'light', setColorMode: () => {}});
export const useThemeConfig = () => ({});
export const useBaseUrl = (url: string) => url;
export const translate = (obj: {message: string}) => obj.message;

// useDoc is a vi.fn so tests can control its return value via vi.mocked(useDoc).mockReturnValue(...)
export const useDoc = vi.fn(() => ({
  metadata: {previous: null, next: null},
}));

export const useSidebarBreadcrumbs = vi.fn(() => null);

// Returns null sidebar by default; tests can override via vi.mocked(useDocsSidebar).mockReturnValue(...)
export const useDocsSidebar = vi.fn(() => null);

// Link renders a plain <a> for test environments.
// Exported as both a named export and the module default so that
// `import Link from '@docusaurus/Link'` and `import {Link} from '...'` both work.
export function Link({
  to,
  href,
  children,
  className,
}: {
  to?: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return React.createElement('a', {href: href ?? to, className}, children);
}

export default Link;
