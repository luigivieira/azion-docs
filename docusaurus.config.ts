import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Azion Documentation',
  tagline: 'Run serverless JavaScript at the edge — close to your users, with zero cold starts.',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://luigivieira.github.io',
  baseUrl: '/',

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
          editUrl: 'https://github.com/luigivieira/azion-docs/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/azion-docs-social-card.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Azion Documentation',
      logo: {
        alt: 'Azion Logo',
        src: 'img/logo.svg',
        style: {height: '20px'},
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'functionsSidebar',
          position: 'left',
          label: 'Docs',
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
            {label: 'Overview', to: '/'},
            {label: 'Use Cases', to: '/use-cases'},
            {label: 'Hello World', to: '/hello-world'},
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
              label: 'Real-world example (open5e)',
              href: 'https://github.com/luigivieira/augmentedopen5e',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Luigi Vieira. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'javascript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
