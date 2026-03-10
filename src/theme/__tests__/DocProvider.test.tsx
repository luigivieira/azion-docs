import React, {useContext} from 'react';
import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';

// Override the @theme-original/DocItem stub to render children normally
vi.mock('@theme-original/DocItem', () => ({
  default: ({children}: {children: React.ReactNode}) => <>{children}</>,
}));

import DocItemWrapper from '../DocItem/index';
import IsInDocProviderContext from '../../contexts/IsInDocProviderContext';

// The real Props type requires `route` and `content`, but those are handled by
// the @theme-original/DocItem mock above. Cast to a children-only type for testing.
const DocItemWrapperTest = DocItemWrapper as unknown as React.ComponentType<{children: React.ReactNode}>;

function ContextProbe() {
  const value = useContext(IsInDocProviderContext);
  return <span data-testid="probe">{String(value)}</span>;
}

describe('DocItemWrapper (IsInDocProviderContext)', () => {
  it('sets IsInDocProviderContext to true for children', () => {
    render(
      <DocItemWrapperTest>
        <ContextProbe />
      </DocItemWrapperTest>,
    );
    expect(screen.getByTestId('probe').textContent).toBe('true');
  });

  it('context is false outside DocItemWrapper', () => {
    render(<ContextProbe />);
    expect(screen.getByTestId('probe').textContent).toBe('false');
  });

  it('renders its children', () => {
    render(
      <DocItemWrapperTest>
        <span>child content</span>
      </DocItemWrapperTest>,
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });
});
