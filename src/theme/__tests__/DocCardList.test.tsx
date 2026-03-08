import React from 'react';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {
  useCurrentSidebarSiblings,
  filterDocCardListItems,
  findFirstSidebarItemLink,
} from '@docusaurus/plugin-content-docs/client';
import DocCardList from '../DocCardList/index';

vi.mock('@theme/DocCard', () => ({
  default: ({item}: {item: {label: string}}) =>
    React.createElement('div', {'data-testid': 'doc-card'}, item.label),
}));

const mockUseCurrentSidebarSiblings = vi.mocked(useCurrentSidebarSiblings);
const mockFilterDocCardListItems = vi.mocked(filterDocCardListItems);
vi.mocked(findFirstSidebarItemLink);

const LINK_ITEMS = [
  {type: 'link' as const, href: '/a', label: 'Alpha', docId: 'a'},
  {type: 'link' as const, href: '/b', label: 'Beta', docId: 'b'},
];

beforeEach(() => {
  mockUseCurrentSidebarSiblings.mockReturnValue([]);
  mockFilterDocCardListItems.mockImplementation((items) => items);
});

describe('DocCardList', () => {
  it('renders a card for each item in the list', () => {
    render(<DocCardList items={LINK_ITEMS} />);
    expect(screen.getAllByTestId('doc-card')).toHaveLength(2);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders an ordered list', () => {
    const {container} = render(<DocCardList items={LINK_ITEMS} />);
    expect(container.querySelector('ol')).toBeInTheDocument();
  });

  it('applies a custom className to the list', () => {
    const {container} = render(<DocCardList items={LINK_ITEMS} className="custom-class" />);
    expect(container.querySelector('ol')).toHaveClass('custom-class');
  });

  it('falls back to current sidebar siblings when no items are provided', () => {
    mockUseCurrentSidebarSiblings.mockReturnValue(LINK_ITEMS as ReturnType<typeof useCurrentSidebarSiblings>);
    render(<DocCardList />);
    expect(mockUseCurrentSidebarSiblings).toHaveBeenCalled();
    expect(screen.getAllByTestId('doc-card')).toHaveLength(2);
  });

  it('passes items through filterDocCardListItems', () => {
    mockFilterDocCardListItems.mockReturnValue([LINK_ITEMS[0]]);
    render(<DocCardList items={LINK_ITEMS} />);
    expect(mockFilterDocCardListItems).toHaveBeenCalledWith(LINK_ITEMS);
    expect(screen.getAllByTestId('doc-card')).toHaveLength(1);
  });
});
