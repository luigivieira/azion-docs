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
        'build/functions/overview/what-are-functions',
        'build/functions/overview/when-to-use-functions',
      ],
    },
    {
      type: 'category',
      label: 'Getting Started',
      link: {type: 'generated-index'},
      collapsible: true,
      collapsed: true,
      items: [
        'build/functions/getting-started/prerequisites',
        'build/functions/getting-started/create-function',
        'build/functions/getting-started/create-application',
        'build/functions/getting-started/create-workload',
        'build/functions/getting-started/test-and-observe',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      link: {type: 'generated-index'},
      collapsible: true,
      collapsed: true,
      items: [
        'build/functions/development/function-structure',
        'build/functions/development/handling-requests-and-responses',
        'build/functions/development/environment-variables',
        'build/functions/development/calling-external-apis',
        'build/functions/development/local-development',
      ],
    },
    {
      type: 'category',
      label: 'Platform Integration',
      link: {type: 'generated-index'},
      collapsible: true,
      collapsed: true,
      items: [
        'build/functions/platform-integration/functions-in-platform-architecture',
        'build/functions/platform-integration/what-is-a-function-instance',
        'build/functions/platform-integration/creating-instances',
        'build/functions/platform-integration/linking-instances-to-rules',
        'build/functions/platform-integration/application-integration',
      ],
    },
    {
      type: 'category',
      label: 'Observability',
      link: {type: 'generated-index'},
      collapsible: true,
      collapsed: true,
      items: [
        'build/functions/observability/logs',
        'build/functions/observability/debugging',
        'build/functions/observability/metrics',
      ],
    },
    {
      type: 'category',
      label: 'Advanced Topics',
      link: {type: 'generated-index'},
      collapsible: true,
      collapsed: true,
      items: [
        'build/functions/advanced/webassembly',
        'build/functions/advanced/ai-integrations',
        'build/functions/advanced/performance-optimization',
      ],
    },
    'build/functions/limits',
    {
      type: 'category',
      label: 'Runtime Reference',
      link: {type: 'generated-index'},
      collapsible: true,
      collapsed: true,
      items: [
        'build/functions/runtime-reference/runtime-apis',
        'build/functions/runtime-reference/event-handlers',
        'build/functions/runtime-reference/configuration',
        'build/functions/runtime-reference/execution-model',
        'build/functions/runtime-reference/runtime-environment',
      ],
    },
  ],
};

export default sidebars;
