import React from 'react';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {useDoc} from '@docusaurus/plugin-content-docs/client';

// vi.mock is hoisted by Vitest — the mock is active before any imports below
vi.mock('@theme-original/DocBreadcrumbs', () => ({
  default: () =>
    React.createElement('nav', {'aria-label': 'breadcrumbs'}, 'Breadcrumbs'),
}));

import DocBreadcrumbsWrapper from '../DocBreadcrumbs/index';

const mockUseDoc = vi.mocked(useDoc);

beforeEach(() => {
  mockUseDoc.mockReturnValue({
    metadata: {previous: null, next: null},
  } as ReturnType<typeof useDoc>);
});

describe('DocBreadcrumbsWrapper', () => {
  it('renders the sticky header container', () => {
    const {container} = render(<DocBreadcrumbsWrapper />);
    expect(container.querySelector('.doc-sticky-header')).toBeInTheDocument();
  });

  it('renders the original DocBreadcrumbs inside the container', () => {
    render(<DocBreadcrumbsWrapper />);
    expect(
      screen.getByRole('navigation', {name: 'breadcrumbs'}),
    ).toBeInTheDocument();
  });

  it('renders DocNavStrip when there are pages to navigate to', () => {
    mockUseDoc.mockReturnValue({
      metadata: {
        previous: {permalink: '/prev', title: 'Prev'},
        next: null,
      },
    } as ReturnType<typeof useDoc>);

    render(<DocBreadcrumbsWrapper />);
    expect(
      screen.getByRole('navigation', {name: 'Doc pages navigation'}),
    ).toBeInTheDocument();
  });

  it('does not render DocNavStrip when there are no prev/next pages', () => {
    render(<DocBreadcrumbsWrapper />);
    expect(
      screen.queryByRole('navigation', {name: 'Doc pages navigation'}),
    ).not.toBeInTheDocument();
  });

  it('breadcrumbs and nav strip are both inside the sticky header', () => {
    mockUseDoc.mockReturnValue({
      metadata: {
        previous: {permalink: '/prev', title: 'Prev'},
        next: {permalink: '/next', title: 'Next'},
      },
    } as ReturnType<typeof useDoc>);

    const {container} = render(<DocBreadcrumbsWrapper />);
    const header = container.querySelector('.doc-sticky-header');

    expect(header).toContainElement(
      screen.getByRole('navigation', {name: 'breadcrumbs'}),
    );
    expect(header).toContainElement(
      screen.getByRole('navigation', {name: 'Doc pages navigation'}),
    );
  });
});
