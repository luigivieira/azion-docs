import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  rationaleSidebar: [
    {
      type: 'doc',
      id: 'rationale',
      label: 'Rationale',
    },
  ],
  docsSidebar: [
    {
      type: 'category',
      label: 'Overview',
      link: {type: 'generated-index'},
      collapsible: true,
      collapsed: false,
      items: [
        'overview/what-are-functions',
        'overview/when-to-use-functions',
      ],
    },
    {
      type: 'category',
      label: 'Getting Started',
      link: {type: 'generated-index'},
      collapsible: true,
      collapsed: true,
      items: [
        'getting-started/prerequisites',
        'getting-started/create-function',
        'getting-started/create-application',
        'getting-started/create-workload',
        'getting-started/test-and-observe',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      link: {type: 'generated-index'},
      collapsible: true,
      collapsed: true,
      items: [
        'development/function-structure',
        'development/handling-requests-and-responses',
        'development/function-arguments-and-environment-variables',
        'development/calling-external-apis',
        'development/local-development',
        'development/complete-example-project',
      ],
    },
    {
      type: 'category',
      label: 'Platform Integration',
      link: {type: 'generated-index'},
      collapsible: true,
      collapsed: true,
      items: [
        'platform-integration/functions-in-platform-architecture',
        'platform-integration/what-is-a-function-instance',
        'platform-integration/creating-instances',
        'platform-integration/linking-instances-to-rules',
        'platform-integration/application-integration',
      ],
    },
    {
      type: 'category',
      label: 'Observability',
      link: {type: 'generated-index'},
      collapsible: true,
      collapsed: true,
      items: [
        'observability/logs',
        'observability/debugging',
        'observability/metrics',
      ],
    },
    {
      type: 'category',
      label: 'Advanced Topics',
      link: {type: 'generated-index'},
      collapsible: true,
      collapsed: true,
      items: [
        'advanced/webassembly',
        'advanced/ai-integrations',
        'advanced/performance-optimization',
      ],
    },
    'limits',
    {
      type: 'category',
      label: 'Runtime Reference',
      link: {type: 'generated-index'},
      collapsible: true,
      collapsed: true,
      items: [
        'runtime-reference/runtime-apis',
        'runtime-reference/event-handlers',
        'runtime-reference/configuration',
        'runtime-reference/execution-model',
        'runtime-reference/runtime-environment',
      ],
    },
  ],
};

export default sidebars;
