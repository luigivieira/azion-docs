import React, {useContext, type ReactNode, useState, useEffect, useLayoutEffect, useRef} from 'react';
import clsx from 'clsx';
import {useSidebarBreadcrumbs} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';
import HomeBreadcrumbItem from '@theme/DocBreadcrumbs/Items/Home';
import DocBreadcrumbsStructuredData from '@theme/DocBreadcrumbs/StructuredData';
import DocNavStrip, {DocNavStripUI} from '@site/src/components/DocNavStrip';
import IsInDocProviderContext from '@site/src/contexts/IsInDocProviderContext';
import CategoryPageNavContext from '@site/src/contexts/CategoryPageNavContext';

// Matches the Docusaurus mobile breakpoint used in CSS
const MOBILE_BREAKPOINT_PX = 996;

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`).matches
      : false,
  );
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
  const [overflows, setOverflows] = useState(false);
  const ulRef = useRef<HTMLUListElement>(null);

  const canCollapse = isMobile && !!breadcrumbs && breadcrumbs.length > 2;
  // 2-item breadcrumb: no middle items to hide, but last item may still need truncation
  const canMeasure = isMobile && !!breadcrumbs && breadcrumbs.length >= 2;
  const shouldCollapse = canCollapse && !expanded && overflows;
  const shouldTruncateLast = canMeasure && !canCollapse && overflows;

  // Reset when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setExpanded(false);
      setOverflows(false);
    }
  }, [isMobile]);

  // Measure whether all items overflow their container.
  // Only runs when all items are rendered (shouldCollapse/shouldTruncateLast = false)
  // to get accurate measurements. Uses useLayoutEffect so the browser doesn't paint
  // the expanded state before potentially collapsing it.
  useLayoutEffect(() => {
    if (shouldCollapse || shouldTruncateLast) return; // display mode already determined
    if (!canMeasure) {
      setOverflows(false);
      return;
    }
    const ul = ulRef.current;
    if (!ul) return;

    const measure = () => {
      const items = Array.from(ul.children) as HTMLElement[];
      const firstTop = Math.round(items[0].getBoundingClientRect().top);
      const wraps = items.some(
        item => Math.round(item.getBoundingClientRect().top) > firstTop,
      );
      setOverflows(wraps);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(ul);
    return () => ro.disconnect();
  }, [canMeasure, shouldCollapse, shouldTruncateLast]);

  if (!breadcrumbs) {
    return null;
  }

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
        <ul ref={ulRef} className={clsx('breadcrumbs', {'breadcrumbs--collapsed': shouldCollapse || shouldTruncateLast})}>
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

type NavItem = {permalink: string; title: string};
type CategoryNav = {previous?: NavItem; next?: NavItem};

export default function DocBreadcrumbsWrapper(): React.JSX.Element {
  const isInDocProvider = useContext(IsInDocProviderContext);
  const categoryNav = useContext(CategoryPageNavContext) as CategoryNav | null;
  return (
    <div className="doc-sticky-header">
      <DocBreadcrumbs />
      {isInDocProvider && <DocNavStrip />}
      {categoryNav && <DocNavStripUI previous={categoryNav.previous} next={categoryNav.next} />}
    </div>
  );
}
