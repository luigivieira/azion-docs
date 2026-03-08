import React from 'react';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {
  useDocById,
  findFirstSidebarItemLink,
} from '@docusaurus/plugin-content-docs/client';
import DocCard from '../DocCard/index';

const mockUseDocById = vi.mocked(useDocById);
const mockFindFirstSidebarItemLink = vi.mocked(findFirstSidebarItemLink);

beforeEach(() => {
  mockUseDocById.mockReturnValue(null);
  mockFindFirstSidebarItemLink.mockReturnValue(null);
});

describe('DocCard — link type', () => {
  const linkItem = {
    type: 'link' as const,
    href: '/docs/page',
    label: 'My Page',
    docId: 'page',
  };

  it('renders a link with the item label', () => {
    render(<DocCard item={linkItem} />);
    expect(screen.getByRole('link', {name: /My Page/})).toHaveAttribute('href', '/docs/page');
  });

  it('shows description from item when provided', () => {
    const item = {...linkItem, description: 'Item desc'};
    render(<DocCard item={item} />);
    expect(screen.getByText('Item desc')).toBeInTheDocument();
  });

  it('falls back to doc description from useDocById when item has no description', () => {
    mockUseDocById.mockReturnValue({description: 'Doc desc'} as ReturnType<typeof useDocById>);
    render(<DocCard item={linkItem} />);
    expect(screen.getByText('Doc desc')).toBeInTheDocument();
  });

  it('renders no meta when neither item nor doc has a description', () => {
    const {container} = render(<DocCard item={linkItem} />);
    // Only the label span, no meta span
    expect(container.querySelectorAll('span')).toHaveLength(1);
  });
});

describe('DocCard — category type', () => {
  const categoryItem = {
    type: 'category' as const,
    href: '/docs/section',
    label: 'Section',
    items: [{type: 'link'}, {type: 'link'}],
    collapsible: true,
    collapsed: false,
  };

  it('renders a link when findFirstSidebarItemLink returns an href', () => {
    mockFindFirstSidebarItemLink.mockReturnValue('/docs/section/first');
    render(<DocCard item={categoryItem as Parameters<typeof DocCard>[0]['item']} />);
    expect(screen.getByRole('link', {name: /Section/})).toBeInTheDocument();
  });

  it('returns null when findFirstSidebarItemLink returns null', () => {
    const {container} = render(
      <DocCard item={categoryItem as Parameters<typeof DocCard>[0]['item']} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows item count as meta when no description', () => {
    mockFindFirstSidebarItemLink.mockReturnValue('/docs/section/first');
    render(<DocCard item={categoryItem as Parameters<typeof DocCard>[0]['item']} />);
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });

  it('formats singular item count correctly', () => {
    mockFindFirstSidebarItemLink.mockReturnValue('/docs/section/first');
    const item = {...categoryItem, items: [{type: 'link'}]};
    render(<DocCard item={item as Parameters<typeof DocCard>[0]['item']} />);
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('shows item description when provided', () => {
    mockFindFirstSidebarItemLink.mockReturnValue('/docs/section/first');
    const item = {...categoryItem, description: 'Cat desc'};
    render(<DocCard item={item as Parameters<typeof DocCard>[0]['item']} />);
    expect(screen.getByText('Cat desc')).toBeInTheDocument();
  });
});

describe('DocCard — unknown type', () => {
  it('throws for unknown item types', () => {
    const badItem = {type: 'unknown'} as unknown as Parameters<typeof DocCard>[0]['item'];
    expect(() => render(<DocCard item={badItem} />)).toThrow();
  });
});
