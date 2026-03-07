import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  functionsSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Overview',
    },
    {
      type: 'doc',
      id: 'how-it-works',
      label: 'How It Works',
    },
    {
      type: 'doc',
      id: 'use-cases',
      label: 'Use Cases',
    },
    {
      type: 'doc',
      id: 'caveats',
      label: 'Caveats & Gotchas',
    },
    {
      type: 'doc',
      id: 'hello-world',
      label: 'Hello World',
    },
  ],
};

export default sidebars;
