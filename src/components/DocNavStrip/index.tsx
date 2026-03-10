import React, {useEffect, useState} from 'react';
import Link from '@docusaurus/Link';
import {useDoc, useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import type {PropSidebarItem} from '@docusaurus/plugin-content-docs';
import {useHistory} from '@docusaurus/router';
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
  const history = useHistory();
  const [modifierKey, setModifierKey] = useState('⌘');

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
      setModifierKey(isMac ? '⌘' : 'Ctrl');
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore key events originating from form inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === 'ArrowLeft') {
        if (previous) {
          event.preventDefault();
          history.push(previous.permalink);
        }
      } else if ((event.metaKey || event.ctrlKey) && event.key === 'ArrowRight') {
        if (next) {
          event.preventDefault();
          history.push(next.permalink);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previous, next, history]);

  if (!previous && !next) {
    return null;
  }

  return (
    <nav className={styles.strip} aria-label="Doc pages navigation">
      <div className={styles.prev}>
        {previous && (
          <Link to={previous.permalink}>
            <span className={styles.arrow}>←</span>
            <span className={styles.shortcut}><kbd>{modifierKey}</kbd> <kbd>←</kbd></span>
            <span className={styles.label}>{prevTitle}</span>
          </Link>
        )}
      </div>
      <div className={styles.next}>
        {next && (
          <Link to={next.permalink}>
            <span className={styles.label}>{nextTitle}</span>
            <span className={styles.shortcut}><kbd>{modifierKey}</kbd> <kbd>→</kbd></span>
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
