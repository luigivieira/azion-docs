import React from 'react';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {useDoc, useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import {useHistory} from '@docusaurus/router';
import DocNavStrip, {DocNavStripUI} from '../DocNavStrip';

vi.mock('@docusaurus/router', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useHistory: vi.fn(() => ({ push: vi.fn() }))
  };
});

const mockUseDoc = vi.mocked(useDoc);
const mockUseDocsSidebar = vi.mocked(useDocsSidebar);
const mockUseHistory = vi.mocked(useHistory);

const PREV = {permalink: '/docs/prev-page', title: 'Previous Page'};
const NEXT = {permalink: '/docs/next-page', title: 'Next Page'};

let mockPush: any;

beforeEach(() => {
  mockPush = vi.fn();
  mockUseHistory.mockReturnValue({ push: mockPush } as any);
  mockUseDoc.mockReturnValue({metadata: {previous: null, next: null}} as ReturnType<typeof useDoc>);
  mockUseDocsSidebar.mockReturnValue(null);
});

describe('DocNavStrip', () => {
  describe('when there is no navigation', () => {
    it('renders nothing when both previous and next are absent', () => {
      const {container} = render(<DocNavStrip />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('when previous exists', () => {
    beforeEach(() => {
      mockUseDoc.mockReturnValue({metadata: {previous: PREV, next: null}} as ReturnType<typeof useDoc>);
    });

    it('renders the nav element', () => {
      render(<DocNavStrip />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('has the correct aria-label', () => {
      render(<DocNavStrip />);
      expect(screen.getByRole('navigation')).toHaveAttribute(
        'aria-label',
        'Doc pages navigation',
      );
    });

    it('renders the previous link with correct href', () => {
      render(<DocNavStrip />);
      expect(screen.getByRole('link', {name: /Previous Page/})).toHaveAttribute(
        'href',
        '/docs/prev-page',
      );
    });

    it('renders the previous arrow (←)', () => {
      render(<DocNavStrip />);
      expect(screen.getAllByText('←').length).toBeGreaterThan(0);
    });

    it('renders the previous page title', () => {
      render(<DocNavStrip />);
      expect(screen.getByText('Previous Page')).toBeInTheDocument();
    });

    it('does not render a next link', () => {
      render(<DocNavStrip />);
      expect(screen.queryByText('→')).not.toBeInTheDocument();
    });
  });

  describe('when next exists', () => {
    beforeEach(() => {
      mockUseDoc.mockReturnValue({metadata: {previous: null, next: NEXT}} as ReturnType<typeof useDoc>);
    });

    it('renders the nav element', () => {
      render(<DocNavStrip />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('renders the next link with correct href', () => {
      render(<DocNavStrip />);
      expect(screen.getByRole('link', {name: /Next Page/})).toHaveAttribute(
        'href',
        '/docs/next-page',
      );
    });

    it('renders the next arrow (→)', () => {
      render(<DocNavStrip />);
      expect(screen.getAllByText('→').length).toBeGreaterThan(0);
    });

    it('renders the next page title', () => {
      render(<DocNavStrip />);
      expect(screen.getByText('Next Page')).toBeInTheDocument();
    });

    it('does not render a previous link', () => {
      render(<DocNavStrip />);
      expect(screen.queryByText('←')).not.toBeInTheDocument();
    });
  });

  describe('when both previous and next exist', () => {
    beforeEach(() => {
      mockUseDoc.mockReturnValue({metadata: {previous: PREV, next: NEXT}} as ReturnType<typeof useDoc>);
    });

    it('renders two links', () => {
      render(<DocNavStrip />);
      expect(screen.getAllByRole('link')).toHaveLength(2);
    });

    it('renders the previous arrow before previous title', () => {
      render(<DocNavStrip />);
      const prevLink = screen.getByRole('link', {name: /Previous Page/});
      const arrow = prevLink.querySelector('span:first-child');
      expect(arrow?.textContent).toBe('←');
    });

    it('renders the next arrow after next title', () => {
      render(<DocNavStrip />);
      const nextLink = screen.getByRole('link', {name: /Next Page/});
      const arrow = nextLink.querySelector('span:last-child');
      expect(arrow?.textContent).toBe('→');
    });

    it('previous link points to the correct permalink', () => {
      render(<DocNavStrip />);
      expect(screen.getByRole('link', {name: /Previous Page/})).toHaveAttribute(
        'href',
        '/docs/prev-page',
      );
    });

    it('next link points to the correct permalink', () => {
      render(<DocNavStrip />);
      expect(screen.getByRole('link', {name: /Next Page/})).toHaveAttribute(
        'href',
        '/docs/next-page',
      );
    });
  });

  describe('sidebar label resolution', () => {
    it('uses sidebar label for previous when sidebar has a matching link item', () => {
      mockUseDoc.mockReturnValue({metadata: {previous: PREV, next: null}} as ReturnType<typeof useDoc>);
      mockUseDocsSidebar.mockReturnValue({
        name: 'default',
        items: [{type: 'link', href: '/docs/prev-page', label: 'Sidebar Prev Label', docId: 'prev'}],
      } as ReturnType<typeof useDocsSidebar>);
      render(<DocNavStrip />);
      expect(screen.getByText('Sidebar Prev Label')).toBeInTheDocument();
    });

    it('uses sidebar label for previous when sidebar has a matching category by href', () => {
      mockUseDoc.mockReturnValue({metadata: {previous: PREV, next: null}} as ReturnType<typeof useDoc>);
      mockUseDocsSidebar.mockReturnValue({
        name: 'default',
        items: [{
          type: 'category',
          href: '/docs/prev-page',
          label: 'Cat Prev Label',
          items: [],
          collapsible: true,
          collapsed: false,
        }],
      } as ReturnType<typeof useDocsSidebar>);
      render(<DocNavStrip />);
      expect(screen.getByText('Cat Prev Label')).toBeInTheDocument();
    });

    it('finds label recursively inside nested category items', () => {
      mockUseDoc.mockReturnValue({metadata: {previous: PREV, next: null}} as ReturnType<typeof useDoc>);
      mockUseDocsSidebar.mockReturnValue({
        name: 'default',
        items: [{
          type: 'category',
          href: '/docs/other',
          label: 'Parent Cat',
          collapsible: true,
          collapsed: false,
          items: [{type: 'link', href: '/docs/prev-page', label: 'Nested Label', docId: 'prev'}],
        }],
      } as ReturnType<typeof useDocsSidebar>);
      render(<DocNavStrip />);
      expect(screen.getByText('Nested Label')).toBeInTheDocument();
    });

    it('falls back to metadata title when permalink is not found in sidebar', () => {
      mockUseDoc.mockReturnValue({metadata: {previous: PREV, next: null}} as ReturnType<typeof useDoc>);
      mockUseDocsSidebar.mockReturnValue({
        name: 'default',
        items: [{type: 'link', href: '/docs/other-page', label: 'Other Label', docId: 'other'}],
      } as ReturnType<typeof useDocsSidebar>);
      render(<DocNavStrip />);
      expect(screen.getByText('Previous Page')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('nav has role navigation', () => {
      mockUseDoc.mockReturnValue({metadata: {previous: PREV, next: null}} as ReturnType<typeof useDoc>);
      render(<DocNavStrip />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('links are accessible via their visible label text', () => {
      mockUseDoc.mockReturnValue({metadata: {previous: PREV, next: NEXT}} as ReturnType<typeof useDoc>);
      render(<DocNavStrip />);
      expect(screen.getByRole('link', {name: /Previous Page/})).toBeInTheDocument();
      expect(screen.getByRole('link', {name: /Next Page/})).toBeInTheDocument();
    });
  });

  describe('keyboard shortcuts', () => {
    beforeEach(() => {
      mockUseDoc.mockReturnValue({metadata: {previous: PREV, next: NEXT}} as ReturnType<typeof useDoc>);
    });

    it('navigates to previous page on CMD/CTRL + Left Arrow', () => {
      render(<DocNavStrip />);
      fireEvent.keyDown(window, { key: 'ArrowLeft', metaKey: true });
      expect(mockPush).toHaveBeenCalledWith('/docs/prev-page');
    });

    it('navigates to next page on CMD/CTRL + Right Arrow', () => {
      render(<DocNavStrip />);
      fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true });
      expect(mockPush).toHaveBeenCalledWith('/docs/next-page');
    });

    it('does not navigate on Arrow alone without modifier', () => {
      render(<DocNavStrip />);
      fireEvent.keyDown(window, { key: 'ArrowRight', metaKey: false, ctrlKey: false });
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('ignores events from inputs', () => {
      render(
        <div>
          <DocNavStrip />
          <input data-testid="input" />
        </div>
      );
      const input = screen.getByTestId('input');
      fireEvent.keyDown(input, { key: 'ArrowRight', metaKey: true });
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
