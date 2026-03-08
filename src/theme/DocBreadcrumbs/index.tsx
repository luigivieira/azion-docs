import React from 'react';
import DocBreadcrumbs from '@theme-original/DocBreadcrumbs';
import type DocBreadcrumbsType from '@theme/DocBreadcrumbs';
import type {WrapperProps} from '@docusaurus/types';
import DocNavStrip from '@site/src/components/DocNavStrip';

type Props = WrapperProps<typeof DocBreadcrumbsType>;

export default function DocBreadcrumbsWrapper(props: Props): React.JSX.Element {
  return (
    <div className="doc-sticky-header">
      <DocBreadcrumbs {...props} />
      <DocNavStrip />
    </div>
  );
}
