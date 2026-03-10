import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Azion Documentation',
  tagline: 'Run serverless JavaScript at the edge — close to your users, with zero cold starts.',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  url: 'https://luigivieira.github.io',
  baseUrl: '/azion-docs/',

  organizationName: 'luigivieira',
  projectName: 'azion-docs',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt-BR', 'es-ES'],
    localeConfigs: {
      en: {
        label: 'English',
        direction: 'ltr',
        htmlLang: 'en-US',
      },
      'pt-BR': {
        label: 'Português (Brasil)',
        direction: 'ltr',
        htmlLang: 'pt-BR',
      },
      'es-ES': {
        label: 'Español (España)',
        direction: 'ltr',
        htmlLang: 'es-ES',
      },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      require.resolve('docusaurus-plugin-search-local'),
      {
        hashed: true,
        docsRouteBasePath: '/',
      },
    ],
  ],

  themeConfig: {
    image: 'img/azion-docs-social-card.png',
    colorMode: {
      defaultMode: 'light',
    },
    navbar: {
      title: 'Challenge DevRel',
      logo: {
        alt: 'Azion Logo',
        src: 'img/logo.svg',
        style: {height: '20px'},
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'rationaleSidebar',
          position: 'left',
          label: 'Rationale',
        },
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/luigivieira/azion-docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Overview', to: '/category/overview'},
            {label: 'Getting Started', to: '/category/getting-started'},
            {label: 'Development', to: '/category/development'},
            {label: 'Platform Integration', to: '/category/platform-integration'},
          ],
        },
        {
          title: 'Azion',
          items: [
            {
              label: 'Azion Console',
              href: 'https://console.azion.com',
            },
            {
              label: 'Official Docs',
              href: 'https://www.azion.com/en/documentation/',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/luigivieira/azion-docs',
            },
            {
              label: 'Toy Example (D&D Spells Translated by AI)',
              href: 'https://github.com/luigivieira/augmentedopen5e',
            },
          ],
        },
      ],
      copyright: `Created with love by Luiz Carlos Vieira, with Docusaurus`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ['bash', 'json', 'typescript', 'javascript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
