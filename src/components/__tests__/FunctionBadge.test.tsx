import React from 'react';
import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {FunctionBadge, getVariantLabel, BadgeVariant} from '../FunctionBadge';

describe('FunctionBadge', () => {
  describe('rendering', () => {
    it('renders the label text', () => {
      render(<FunctionBadge label="JavaScript" />);
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });

    it('renders with role="status"', () => {
      render(<FunctionBadge label="Edge" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('uses default variant "info" when none provided', () => {
      render(<FunctionBadge label="Default" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'Info: Default');
    });

    it('renders icon when provided', () => {
      render(<FunctionBadge label="Runtime" variant="runtime" icon="⚡" />);
      expect(screen.getByText('⚡')).toBeInTheDocument();
      expect(screen.getByText('⚡')).toHaveAttribute('aria-hidden', 'true');
    });

    it('does not render icon span when icon is not provided', () => {
      render(<FunctionBadge label="No icon" />);
      const iconSpan = screen.queryByRole('img');
      expect(iconSpan).not.toBeInTheDocument();
    });
  });

  describe('variants', () => {
    const variants: BadgeVariant[] = ['runtime', 'trigger', 'limit', 'info'];

    variants.forEach((variant) => {
      it(`renders correct aria-label for variant "${variant}"`, () => {
        render(<FunctionBadge label="Test" variant={variant} />);
        const badge = screen.getByRole('status');
        const variantLabel = getVariantLabel(variant);
        expect(badge).toHaveAttribute('aria-label', `${variantLabel}: Test`);
      });
    });

    it('renders runtime variant', () => {
      render(<FunctionBadge label="V8 Isolate" variant="runtime" />);
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'Runtime: V8 Isolate',
      );
    });

    it('renders trigger variant', () => {
      render(<FunctionBadge label="HTTP Request" variant="trigger" />);
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'Trigger: HTTP Request',
      );
    });

    it('renders limit variant', () => {
      render(<FunctionBadge label="50ms" variant="limit" />);
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'Limit: 50ms',
      );
    });
  });

  describe('accessibility', () => {
    it('icon span has aria-hidden="true"', () => {
      render(<FunctionBadge label="Test" icon="🔥" />);
      const iconSpan = screen.getByText('🔥');
      expect(iconSpan).toHaveAttribute('aria-hidden', 'true');
    });

    it('label is always visible as text', () => {
      render(<FunctionBadge label="Accessible label" />);
      expect(screen.getByText('Accessible label')).toBeInTheDocument();
    });
  });
});

describe('getVariantLabel', () => {
  it('returns "Runtime" for runtime variant', () => {
    expect(getVariantLabel('runtime')).toBe('Runtime');
  });

  it('returns "Trigger" for trigger variant', () => {
    expect(getVariantLabel('trigger')).toBe('Trigger');
  });

  it('returns "Limit" for limit variant', () => {
    expect(getVariantLabel('limit')).toBe('Limit');
  });

  it('returns "Info" for info variant', () => {
    expect(getVariantLabel('info')).toBe('Info');
  });
});
