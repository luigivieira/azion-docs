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

// Link renders a plain <a> for test environments.
// Exported as both a named export and the module default so that
// `import Link from '@docusaurus/Link'` and `import {Link} from '...'` both work.
export function Link({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return React.createElement('a', {href: to}, children);
}

export default Link;
