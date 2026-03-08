import {createContext} from 'react';

interface NavItem {
  permalink: string;
  title: string;
}

interface CategoryPageNav {
  previous?: NavItem;
  next?: NavItem;
}

/**
 * Provides previous/next navigation data for category (generated-index) pages.
 * Null when not inside a category page.
 */
const CategoryPageNavContext = createContext<CategoryPageNav | null>(null);

export default CategoryPageNavContext;
