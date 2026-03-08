import React, {useContext} from 'react';
import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';

// Override the @theme-original/DocItem stub to render children normally
vi.mock('@theme-original/DocItem', () => ({
  default: ({children}: {children: React.ReactNode}) => <>{children}</>,
}));

import DocItemWrapper from '../DocItem/index';
import IsInDocProviderContext from '../../contexts/IsInDocProviderContext';

function ContextProbe() {
  const value = useContext(IsInDocProviderContext);
  return <span data-testid="probe">{String(value)}</span>;
}

describe('DocItemWrapper (IsInDocProviderContext)', () => {
  it('sets IsInDocProviderContext to true for children', () => {
    render(
      <DocItemWrapper>
        <ContextProbe />
      </DocItemWrapper>,
    );
    expect(screen.getByTestId('probe').textContent).toBe('true');
  });

  it('context is false outside DocItemWrapper', () => {
    render(<ContextProbe />);
    expect(screen.getByTestId('probe').textContent).toBe('false');
  });

  it('renders its children', () => {
    render(
      <DocItemWrapper>
        <span>child content</span>
      </DocItemWrapper>,
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });
});
