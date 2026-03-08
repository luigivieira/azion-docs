import React, {useContext} from 'react';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import CategoryPageNavContext from '../../contexts/CategoryPageNavContext';

// The mock component reads CategoryPageNavContext so we can verify the provider value
vi.mock('@theme-original/DocCategoryGeneratedIndexPage', () => ({
  default: function MockPage() {
    const nav = useContext(CategoryPageNavContext) as {
      previous: {permalink: string; title: string} | null;
      next: {permalink: string; title: string} | null;
    } | null;
    return React.createElement('div', {'data-testid': 'original-page'}, JSON.stringify(nav));
  },
}));

import DocCategoryGeneratedIndexPageWrapper from '../DocCategoryGeneratedIndexPage/index';

const makeProps = (
  previous: {permalink: string; title: string} | null = null,
  next: {permalink: string; title: string} | null = null,
) =>
  ({
    categoryGeneratedIndex: {
      navigation: {previous, next},
      title: 'Test',
      slug: '/test',
      permalink: '/test',
      items: [],
    },
  }) as Parameters<typeof DocCategoryGeneratedIndexPageWrapper>[0];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DocCategoryGeneratedIndexPageWrapper', () => {
  it('renders the original page component', () => {
    render(<DocCategoryGeneratedIndexPageWrapper {...makeProps()} />);
    expect(screen.getByTestId('original-page')).toBeInTheDocument();
  });

  it('provides previous and next navigation via CategoryPageNavContext', () => {
    const previous = {permalink: '/prev', title: 'Prev'};
    const next = {permalink: '/next', title: 'Next'};

    render(<DocCategoryGeneratedIndexPageWrapper {...makeProps(previous, next)} />);

    const content = screen.getByTestId('original-page').textContent ?? '';
    expect(content).toContain('/prev');
    expect(content).toContain('/next');
  });

  it('provides null navigation values when not present', () => {
    render(<DocCategoryGeneratedIndexPageWrapper {...makeProps()} />);

    const content = screen.getByTestId('original-page').textContent ?? '';
    expect(content).toContain('"previous":null');
    expect(content).toContain('"next":null');
  });
});
