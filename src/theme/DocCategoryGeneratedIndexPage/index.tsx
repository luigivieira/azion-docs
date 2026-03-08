import React from 'react';
import OriginalDocCategoryGeneratedIndexPage from '@theme-original/DocCategoryGeneratedIndexPage';
import type DocCategoryGeneratedIndexPageType from '@theme/DocCategoryGeneratedIndexPage';
import type {WrapperProps} from '@docusaurus/types';
import CategoryPageNavContext from '@site/src/contexts/CategoryPageNavContext';

type Props = WrapperProps<typeof DocCategoryGeneratedIndexPageType>;

export default function DocCategoryGeneratedIndexPageWrapper(
  props: Props,
): React.JSX.Element {
  const {previous, next} = props.categoryGeneratedIndex.navigation;
  return (
    <CategoryPageNavContext.Provider value={{previous, next}}>
      <OriginalDocCategoryGeneratedIndexPage {...props} />
    </CategoryPageNavContext.Provider>
  );
}
