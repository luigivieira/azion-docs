---
title: Local Development / Preview
sidebar_position: 5
description: How to develop and preview Azion Edge Functions locally.
---

# Local Development / Preview

While the Azion Console is great for quick edits, iterating on complex logic directly in a browser editor can be limiting. The **Azion CLI** provides a local development server that runs your Edge Functions on your machine, giving you a fast feedback loop without having to deploy to the edge network on every change.

---

## 1. Prerequisites

Before you can use the local development server, make sure you have:

- **Node.js 18+** installed. You can verify with `node --version`.
- **Azion CLI** installed globally:

```bash
npm install -g azion
```

- An **Azion account** and an API token. Generate one at **Azion Console** → **Account** → **Personal Tokens**.

---

## 2. Authenticating

You can log in interactively or by providing an API token. Running `azion login` without arguments is typically the easiest method as it allows you to authenticate via your browser:

```bash
azion login
```

The CLI will prompt you:
1. `🤔 Would you like to create a new profile for this login? (Y/n)`
2. `? Choose a login method:` (Select **Log in via browser**)

Follow the link provided to authenticate in your browser. Once complete, your token is saved to your local profile.

Alternatively, you can provide a pre-generated token:

:::tip[Creating a Personal Token]
To create a token, log in to the [Azion Console](https://console.azion.com), click on your **User Menu** (top-right corner), select **Personal Token**, and click **Create Personal Token**.
:::

```bash
azion login --token YOUR_PERSONAL_TOKEN
```

---

## 3. Creating a New Project

If you are starting from scratch, the CLI can scaffold a new Edge Function project:

```bash
azion init
```

Follow the prompts to choose a starter template (JavaScript, TypeScript, or a framework-based application). This creates a local project structure with a sample function and configuration file.

---

## 4. Running the Local Dev Server

Inside your project directory, start the local development server:

```bash
azion dev
```

The CLI will:

1. Read your function source code (usually `main.js` or `src/index.ts`).
2. Bundle it with its dependencies.
3. Start a local HTTP server that emulates the Azion Runtime environment.

You will see output similar to:

```
[Azion] Starting local development server...
[Azion] Server running at http://localhost:3000
```

Open `http://localhost:3000` in your browser or use `curl` to test your function:

```bash
curl http://localhost:3000
```

Every time you save a change to your source file, the server automatically reloads.

---

## 5. Simulating `event.args`

In production, `event.args` is populated by the JSON configured in the Function Instance. During local development, you can provide a mock `args` object by creating an `azion.config.js` file (or editing the existing one) in your project root:

```js
// azion.config.js
export default {
  dev: {
    args: {
      API_KEY: "local-dev-key",
      ORIGIN_URL: "https://api.example.com",
      DEBUG: "true",
    },
  },
};
```

The CLI injects these values as `event.args` when running locally, so your code does not need any changes between local and production.

---

## 6. Building for Deployment

When you are ready to deploy, build the production bundle:

```bash
azion build
```

This compiles and optimizes your function. To deploy it to the edge network:

```bash
azion deploy
```

The CLI pushes your function to your Azion account and, if a linked Edge Application exists, updates the associated Function Instance automatically.

---

## 7. Linking to an Existing Application

If you have an existing Edge Application in your account and want to link the local project to it:

```bash
azion link
```

This stores the application and function IDs locally so that `azion deploy` knows which resources to update.

---

## 8. Known Limitations of the Local Environment

The local dev server faithfully emulates most of the Azion Runtime behavior, but some features behave differently or are unavailable:

| Feature | Local behavior |
|---|---|
| `fetch()` | Works normally — calls real external APIs. |
| `caches` (Cache API) | In-memory only. Cache is cleared on restart. |
| `Azion.env.get()` | Returns values from environment variables in your shell or from `azion.config.js`. |
| `console.log()` | Output goes to your terminal. |
| Edge network latency | Not simulated — responses are served from `localhost`. |
| GeoIP / `request.cf` | Not available locally. |
| KV Storage | Requires a real Azion account and API token; not emulated in-memory. |

:::tip Testing GeoIP logic locally
If your function branches on geographic data (country, city, etc.), add a conditional in your code that reads from `event.args` when the GeoIP data is missing:

```js
const country = event.request.cf?.country ?? args.MOCK_COUNTRY ?? "US";
```

Then set `MOCK_COUNTRY` in your local `azion.config.js` args to simulate different locations.
:::

---

## 9. Editor Integration

The Azion Runtime implements **Web Standard APIs** (Fetch, Streams, Web Crypto, Cache). For the best editor experience with TypeScript, install the Web Workers type definitions:

```bash
npm install --save-dev @cloudflare/workers-types
```

Then reference them in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"]
  }
}
```

This gives you full autocomplete and type checking for `Request`, `Response`, `FetchEvent`, and other runtime globals.

---

## Next Steps

Now that you've mastered the basics of local development, see how these patterns come together in a real-world application:

:::info[Complete Example Project]
Check out the [Complete Example Project](./complete-example-project.md) page for a deep dive into a semantic search engine built with Azion Edge Functions, featuring automated testing, multi-environment deployment, and VS Code integration.
:::
