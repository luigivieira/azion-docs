import React, {useContext, type ReactNode, useState, useEffect} from 'react';
import clsx from 'clsx';
import {useSidebarBreadcrumbs} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';
import HomeBreadcrumbItem from '@theme/DocBreadcrumbs/Items/Home';
import DocBreadcrumbsStructuredData from '@theme/DocBreadcrumbs/StructuredData';
import DocNavStrip from '@site/src/components/DocNavStrip';
import IsInDocProviderContext from '@site/src/contexts/IsInDocProviderContext';

// Matches the Docusaurus mobile breakpoint used in CSS
const MOBILE_BREAKPOINT_PX = 996;

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

function BreadcrumbsItemLink({
  children,
  href,
  isLast,
}: {
  children: ReactNode;
  href: string | undefined;
  isLast: boolean;
}): ReactNode {
  const className = 'breadcrumbs__link';
  if (isLast) {
    return <span className={className}>{children}</span>;
  }
  return href ? (
    <Link className={className} href={href}>
      <span>{children}</span>
    </Link>
  ) : (
    <span className={className}>{children}</span>
  );
}

function BreadcrumbsItem({
  children,
  active,
}: {
  children: ReactNode;
  active?: boolean;
}): ReactNode {
  return (
    <li
      className={clsx('breadcrumbs__item', {
        'breadcrumbs__item--active': active,
      })}>
      {children}
    </li>
  );
}

function EllipsisItem({onExpand}: {onExpand: () => void}): ReactNode {
  return (
    <li className="breadcrumbs__item">
      <button
        type="button"
        className="breadcrumbs__link breadcrumbs__ellipsis"
        onClick={onExpand}
        aria-label={translate({
          id: 'theme.docs.breadcrumbs.expandAriaLabel',
          message: 'Show full path',
          description: 'The ARIA label for the breadcrumbs ellipsis button',
        })}>
        …
      </button>
    </li>
  );
}

function DocBreadcrumbs(): ReactNode {
  const breadcrumbs = useSidebarBreadcrumbs();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  if (!breadcrumbs) {
    return null;
  }

  const shouldCollapse = isMobile && !expanded && breadcrumbs.length > 2;
  const itemsToRender = shouldCollapse
    ? ([breadcrumbs[0], null, breadcrumbs[breadcrumbs.length - 1]] as const)
    : breadcrumbs;

  return (
    <>
      <DocBreadcrumbsStructuredData breadcrumbs={breadcrumbs} />
      <nav
        className="theme-doc-breadcrumbs"
        aria-label={translate({
          id: 'theme.docs.breadcrumbs.navAriaLabel',
          message: 'Breadcrumbs',
          description: 'The ARIA label for the breadcrumbs',
        })}>
        <ul className="breadcrumbs">
          <HomeBreadcrumbItem />
          {itemsToRender.map((item, idx) => {
            if (item === null) {
              return <EllipsisItem key="ellipsis" onExpand={() => setExpanded(true)} />;
            }
            const isLast = item === breadcrumbs[breadcrumbs.length - 1];
            const href =
              item.type === 'category' && item.linkUnlisted
                ? undefined
                : item.href;
            return (
              <BreadcrumbsItem key={idx} active={isLast}>
                <BreadcrumbsItemLink href={href} isLast={isLast}>
                  {item.label}
                </BreadcrumbsItemLink>
              </BreadcrumbsItem>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export default function DocBreadcrumbsWrapper(): React.JSX.Element {
  const isInDocProvider = useContext(IsInDocProviderContext);
  return (
    <div className="doc-sticky-header">
      <DocBreadcrumbs />
      {isInDocProvider && <DocNavStrip />}
    </div>
  );
}
