import React from 'react';
import Link from '@docusaurus/Link';
import {useDoc, useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import type {PropSidebarItem} from '@docusaurus/plugin-content-docs';
import styles from './styles.module.css';

interface NavItem {
  permalink: string;
  title: string;
}

function findLabelByPermalink(
  items: PropSidebarItem[],
  permalink: string,
): string | undefined {
  for (const item of items) {
    if (item.type === 'link' && item.href === permalink) {
      return item.label;
    }
    if (item.type === 'category') {
      if (item.href === permalink) {
        return item.label;
      }
      const found = findLabelByPermalink(item.items, permalink);
      if (found) return found;
    }
  }
  return undefined;
}

function useTranslatedTitle(navItem: NavItem | undefined): string | undefined {
  const sidebar = useDocsSidebar();
  if (!navItem) return undefined;
  const sidebarLabel =
    sidebar && findLabelByPermalink(sidebar.items, navItem.permalink);
  return sidebarLabel ?? navItem.title;
}

export function DocNavStripUI({
  previous,
  next,
}: {
  previous?: NavItem;
  next?: NavItem;
}): React.JSX.Element | null {
  const prevTitle = useTranslatedTitle(previous);
  const nextTitle = useTranslatedTitle(next);

  if (!previous && !next) {
    return null;
  }

  return (
    <nav className={styles.strip} aria-label="Doc pages navigation">
      <div className={styles.prev}>
        {previous && (
          <Link to={previous.permalink}>
            <span className={styles.arrow}>←</span>
            <span className={styles.label}>{prevTitle}</span>
          </Link>
        )}
      </div>
      <div className={styles.next}>
        {next && (
          <Link to={next.permalink}>
            <span className={styles.label}>{nextTitle}</span>
            <span className={styles.arrow}>→</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

export default function DocNavStrip(): React.JSX.Element | null {
  const {metadata} = useDoc();
  const {previous, next} = metadata;
  return <DocNavStripUI previous={previous} next={next} />;
}
