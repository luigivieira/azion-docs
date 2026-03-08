import React from 'react';
import Link from '@docusaurus/Link';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import styles from './styles.module.css';

export default function DocNavStrip(): React.JSX.Element | null {
  const {metadata} = useDoc();
  const {previous, next} = metadata;

  if (!previous && !next) {
    return null;
  }

  return (
    <nav className={styles.strip} aria-label="Doc pages navigation">
      <div className={styles.prev}>
        {previous && (
          <Link to={previous.permalink}>
            <span className={styles.arrow}>←</span>
            <span className={styles.label}>{previous.title}</span>
          </Link>
        )}
      </div>
      <div className={styles.next}>
        {next && (
          <Link to={next.permalink}>
            <span className={styles.label}>{next.title}</span>
            <span className={styles.arrow}>→</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
