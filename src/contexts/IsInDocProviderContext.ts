import {createContext} from 'react';

/**
 * True when rendered inside DocItem (i.e. on actual doc pages with DocProvider).
 * False on generated-index category pages, which don't have DocProvider.
 * Used to conditionally render components that call useDoc().
 */
const IsInDocProviderContext = createContext(false);

export default IsInDocProviderContext;
