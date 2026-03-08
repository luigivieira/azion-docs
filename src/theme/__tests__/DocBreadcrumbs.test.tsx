import React from 'react';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, fireEvent, act} from '@testing-library/react';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {useSidebarBreadcrumbs} from '@docusaurus/plugin-content-docs/client';
import IsInDocProviderContext from '../../contexts/IsInDocProviderContext';

const mockUseDoc = vi.mocked(useDoc);
const mockUseSidebarBreadcrumbs = vi.mocked(useSidebarBreadcrumbs);

// Default to desktop viewport so useIsMobile() returns false
function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {writable: true, configurable: true, value: width});
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('max-width') && width <= 996,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

import DocBreadcrumbsWrapper from '../DocBreadcrumbs/index';

// Simulates rendering inside a real DocProvider (doc pages only)
function renderInDocProvider(ui: React.ReactElement) {
  return render(
    <IsInDocProviderContext.Provider value={true}>
      {ui}
    </IsInDocProviderContext.Provider>,
  );
}

const BREADCRUMBS_3 = [
  {type: 'category', label: 'Section', href: '/section'},
  {type: 'category', label: 'Sub-section', href: '/section/sub'},
  {type: 'link', label: 'Current Page', href: '/section/sub/page'},
];

const BREADCRUMBS_2 = [
  {type: 'category', label: 'Section', href: '/section'},
  {type: 'link', label: 'Current Page', href: '/section/page'},
];

beforeEach(() => {
  setViewport(1200);
  mockUseDoc.mockReturnValue({
    metadata: {previous: null, next: null},
  } as ReturnType<typeof useDoc>);
  mockUseSidebarBreadcrumbs.mockReturnValue(null);
});

describe('DocBreadcrumbsWrapper', () => {
  it('renders the sticky header container', () => {
    const {container} = render(<DocBreadcrumbsWrapper />);
    expect(container.querySelector('.doc-sticky-header')).toBeInTheDocument();
  });

  it('renders breadcrumbs nav when breadcrumbs exist', () => {
    mockUseSidebarBreadcrumbs.mockReturnValue(BREADCRUMBS_3 as ReturnType<typeof useSidebarBreadcrumbs>);
    render(<DocBreadcrumbsWrapper />);
    expect(screen.getByRole('navigation', {name: 'Breadcrumbs'})).toBeInTheDocument();
  });

  it('renders nothing when breadcrumbs are null', () => {
    render(<DocBreadcrumbsWrapper />);
    expect(screen.queryByRole('navigation', {name: 'Breadcrumbs'})).not.toBeInTheDocument();
  });

  it('renders DocNavStrip when inside DocProvider and there are pages to navigate to', () => {
    mockUseDoc.mockReturnValue({
      metadata: {
        previous: {permalink: '/prev', title: 'Prev'},
        next: null,
      },
    } as ReturnType<typeof useDoc>);

    renderInDocProvider(<DocBreadcrumbsWrapper />);
    expect(
      screen.getByRole('navigation', {name: 'Doc pages navigation'}),
    ).toBeInTheDocument();
  });

  it('does not render DocNavStrip when there are no prev/next pages', () => {
    renderInDocProvider(<DocBreadcrumbsWrapper />);
    expect(
      screen.queryByRole('navigation', {name: 'Doc pages navigation'}),
    ).not.toBeInTheDocument();
  });

  it('does not render DocNavStrip on generated-index pages (outside DocProvider)', () => {
    mockUseDoc.mockReturnValue({
      metadata: {
        previous: {permalink: '/prev', title: 'Prev'},
        next: null,
      },
    } as ReturnType<typeof useDoc>);
    // Render without IsInDocProviderContext — simulates generated-index page
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
    mockUseSidebarBreadcrumbs.mockReturnValue(BREADCRUMBS_2 as ReturnType<typeof useSidebarBreadcrumbs>);

    const {container} = renderInDocProvider(<DocBreadcrumbsWrapper />);
    const header = container.querySelector('.doc-sticky-header');

    expect(header).toContainElement(
      screen.getByRole('navigation', {name: 'Breadcrumbs'}),
    );
    expect(header).toContainElement(
      screen.getByRole('navigation', {name: 'Doc pages navigation'}),
    );
  });
});

describe('useIsMobile viewport change', () => {
  it('updates mobile state when matchMedia fires a change event', () => {
    let capturedHandler: ((e: MediaQueryListEvent) => void) | null = null;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width'), // starts as mobile
      media: query,
      addEventListener: vi.fn().mockImplementation(
        (type: string, fn: (e: MediaQueryListEvent) => void) => {
          if (type === 'change') capturedHandler = fn;
        },
      ),
      removeEventListener: vi.fn(),
    }));

    mockUseSidebarBreadcrumbs.mockReturnValue(BREADCRUMBS_3 as ReturnType<typeof useSidebarBreadcrumbs>);
    render(<DocBreadcrumbsWrapper />);

    // Fire change event simulating a switch to desktop
    act(() => {
      capturedHandler?.({matches: false} as MediaQueryListEvent);
    });

    // On desktop isMobile=false → no ellipsis regardless of item count
    expect(screen.queryByText('…')).not.toBeInTheDocument();
  });
});

describe('breadcrumb item clickability', () => {
  it('renders intermediate items as links when they have an href', () => {
    mockUseSidebarBreadcrumbs.mockReturnValue(BREADCRUMBS_3 as ReturnType<typeof useSidebarBreadcrumbs>);
    render(<DocBreadcrumbsWrapper />);
    expect(screen.getByRole('link', {name: 'Section'})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Sub-section'})).toBeInTheDocument();
  });

  it('renders the last (active) item as plain text, not a link', () => {
    mockUseSidebarBreadcrumbs.mockReturnValue(BREADCRUMBS_3 as ReturnType<typeof useSidebarBreadcrumbs>);
    render(<DocBreadcrumbsWrapper />);
    expect(screen.queryByRole('link', {name: 'Current Page'})).not.toBeInTheDocument();
    expect(screen.getByText('Current Page')).toBeInTheDocument();
  });

  it('renders a linkUnlisted category as plain text (no link)', () => {
    const breadcrumbs = [
      {type: 'category', label: 'Unlisted', href: '/unlisted', linkUnlisted: true},
      {type: 'link', label: 'Page', href: '/page'},
    ];
    mockUseSidebarBreadcrumbs.mockReturnValue(breadcrumbs as ReturnType<typeof useSidebarBreadcrumbs>);
    render(<DocBreadcrumbsWrapper />);
    expect(screen.queryByRole('link', {name: 'Unlisted'})).not.toBeInTheDocument();
    expect(screen.getByText('Unlisted')).toBeInTheDocument();
  });

  it('renders an item as plain text when href is absent', () => {
    const breadcrumbs = [
      {type: 'category', label: 'No Link', href: undefined},
      {type: 'link', label: 'Page', href: '/page'},
    ];
    mockUseSidebarBreadcrumbs.mockReturnValue(breadcrumbs as ReturnType<typeof useSidebarBreadcrumbs>);
    render(<DocBreadcrumbsWrapper />);
    expect(screen.queryByRole('link', {name: 'No Link'})).not.toBeInTheDocument();
    expect(screen.getByText('No Link')).toBeInTheDocument();
  });
});

describe('mobile ellipsis', () => {
  let restoreBoundingRect: () => void;

  beforeEach(() => {
    setViewport(375);
    // Simulate items wrapping: first li in the ul has top=0, subsequent lis have top=20
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        const parent = this.parentElement;
        if (parent?.tagName === 'UL' && parent.children[0] !== this) {
          return {top: 20, left: 0, right: 100, bottom: 40, width: 100, height: 20} as DOMRect;
        }
        return {top: 0, left: 0, right: 100, bottom: 20, width: 100, height: 20} as DOMRect;
      },
    );
    restoreBoundingRect = () => spy.mockRestore();
  });

  afterEach(() => {
    restoreBoundingRect();
  });

  it('shows ellipsis as a clickable button when there are more than 2 items', () => {
    mockUseSidebarBreadcrumbs.mockReturnValue(BREADCRUMBS_3 as ReturnType<typeof useSidebarBreadcrumbs>);
    render(<DocBreadcrumbsWrapper />);
    expect(screen.getByRole('button', {name: 'Show full path'})).toBeInTheDocument();
  });

  it('clicking ellipsis expands to show all items', () => {
    mockUseSidebarBreadcrumbs.mockReturnValue(BREADCRUMBS_3 as ReturnType<typeof useSidebarBreadcrumbs>);
    render(<DocBreadcrumbsWrapper />);
    fireEvent.click(screen.getByRole('button', {name: 'Show full path'}));
    expect(screen.queryByRole('button', {name: 'Show full path'})).not.toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Sub-section'})).toBeInTheDocument();
  });

  it('hides intermediate items and shows only first and last on mobile', () => {
    mockUseSidebarBreadcrumbs.mockReturnValue(BREADCRUMBS_3 as ReturnType<typeof useSidebarBreadcrumbs>);
    render(<DocBreadcrumbsWrapper />);
    expect(screen.getByRole('link', {name: 'Section'})).toBeInTheDocument();
    expect(screen.getByText('Current Page')).toBeInTheDocument();
    expect(screen.queryByRole('link', {name: 'Sub-section'})).not.toBeInTheDocument();
  });

  it('does not show ellipsis on mobile with 2 or fewer items', () => {
    mockUseSidebarBreadcrumbs.mockReturnValue(BREADCRUMBS_2 as ReturnType<typeof useSidebarBreadcrumbs>);
    render(<DocBreadcrumbsWrapper />);
    expect(screen.queryByText('…')).not.toBeInTheDocument();
  });

  it('shows all items on desktop regardless of count', () => {
    setViewport(1200);
    mockUseSidebarBreadcrumbs.mockReturnValue(BREADCRUMBS_3 as ReturnType<typeof useSidebarBreadcrumbs>);
    render(<DocBreadcrumbsWrapper />);
    expect(screen.queryByText('…')).not.toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Sub-section'})).toBeInTheDocument();
  });
});
