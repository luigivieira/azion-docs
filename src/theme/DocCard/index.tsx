import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {
  useDocById,
  findFirstSidebarItemLink,
} from '@docusaurus/plugin-content-docs/client';
import type {Props} from '@theme/DocCard';
import type {
  PropSidebarItemCategory,
  PropSidebarItemLink,
} from '@docusaurus/plugin-content-docs';
import styles from './styles.module.css';

function formatItemCount(count: number): string {
  return count === 1 ? '1 item' : `${count} items`;
}

function TocEntry({
  href,
  label,
  meta,
  className,
}: {
  href: string;
  label: string;
  meta?: string;
  className?: string;
}): ReactNode {
  return (
    <Link href={href} className={clsx(styles.tocEntry, className)}>
      <span className={styles.tocLabel}>{label}</span>
      {meta && <span className={styles.tocMeta}>{meta}</span>}
    </Link>
  );
}

function CardCategory({item}: {item: PropSidebarItemCategory}): ReactNode {
  const href = findFirstSidebarItemLink(item);

  if (!href) {
    return null;
  }

  return (
    <TocEntry
      className={item.className}
      href={href}
      label={item.label}
      meta={item.description ?? formatItemCount(item.items.length)}
    />
  );
}

function CardLink({item}: {item: PropSidebarItemLink}): ReactNode {
  const doc = useDocById(item.docId ?? undefined);
  const meta = item.description ?? doc?.description;
  return (
    <TocEntry
      className={item.className}
      href={item.href}
      label={item.label}
      meta={meta}
    />
  );
}

export default function DocCard({item}: Props): ReactNode {
  switch (item.type) {
    case 'link':
      return <CardLink item={item} />;
    case 'category':
      return <CardCategory item={item} />;
    default:
      throw new Error(`unknown item type ${JSON.stringify(item)}`);
  }
}
