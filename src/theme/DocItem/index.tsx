import React from 'react';
import OriginalDocItem from '@theme-original/DocItem';
import type DocItemType from '@theme/DocItem';
import type {WrapperProps} from '@docusaurus/types';
import IsInDocProviderContext from '@site/src/contexts/IsInDocProviderContext';

type Props = WrapperProps<typeof DocItemType>;

export default function DocItemWrapper(props: Props): React.JSX.Element {
  return (
    <IsInDocProviderContext.Provider value={true}>
      <OriginalDocItem {...props} />
    </IsInDocProviderContext.Provider>
  );
}
