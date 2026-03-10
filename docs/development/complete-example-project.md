---
title: Complete Example Project
sidebar_position: 6
description: A deep dive into a real-world Azion Edge Functions project.
---

# Complete Example Project

To see Azion Edge Functions in a production-grade context, explore the **Augmented Open5e** project. This project implements a semantic search engine for D&D 5e spells, using AI to translate and augment content from the Open5e API.

Repository: [luigivieira/augmentedopen5e](https://github.com/luigivieira/augmentedopen5e)

---

## Key Features

- **Semantic Search**: Uses the Groq API for AI-powered processing.
- **Multilingual Support**: Supports caching translations in multiple locales.
- **Edge Native**: Built specifically for the Azion Edge Runtime.
- **High Performance**: Optimized with aggressive caching strategies using **Azion KV Storage** for centralized and persistent state.

---

## Project Organization

The project follows a modern TypeScript structure:

- `src/`: Core logic and event handlers.
- `src/lib/`: Reusable utilities and API clients.
- `src/api/`: Endpoint definitions (e.g., `/spells`, `/languages`).
- `test/`: Comprehensive unit tests using Vitest.
- `azion/`: Environment-specific state files (`azion.json`).

---

## Technical Implementation

The project leverages advanced Azion Runtime features to achieve high performance and low latency:

### How it Works

When a request arrives at the edge function (e.g., `GET /api/spell`), the platform executes the following flow:

1. **Validation & Index Lookup**: The edge checks for required parameters (`slug` and `locale`) and verifies the slug against a KV-cached index of all valid Open5e spells. If invalid, it returns a `400` or `404` response.
2. **Cache Lookup**: The edge checks **Azion KV Storage** for the requested `slug + locale` pair.
   - **Cache Hit**: Returns a `200 OK` with the translated spell immediately, making no external calls.
3. **Cache Miss & Background Processing**: If the requested locale format is not cached, the response returns a `202 Accepted` immediately, and the edge platform securely initiates a background process (worker) using `event.waitUntil()`.
   - The background worker fetches the spell from the Open5e API.
   - It translates the content using the Groq AI API.
   - It caches the resulting translated spell in Azion KV Storage.
4. **Client Polling**: The client receives a `202 Accepted` status with a `progress` field indicating the background task is running, and should retry the request shortly until a `200 OK` is received.

![Example Project Architecture](https://github.com/luigivieira/azion-docs/releases/download/media-v1/example-architecture.jpg)

### 1. Centralized State with KV Storage
The project uses **Azion KV Storage** as a centralized database. This infrastructure is fully managed by the Azion platform:
- **Local Reads**: The platform automatically replicates data to the edge nodes closest to users.
- **Global Writes**: The code simply writes to the store; Azion handles the propagation across the network with **eventual consistency**.

```javascript
// Reading from centralized KV (Fast local read)
const cachedResult = await Azion.kv.get(cacheKey);

// Writing to centralized KV (Global replication)
await Azion.kv.put(cacheKey, JSON.stringify(data));
```

### 2. Asynchronous Processing with `waitUntil`
The Azion platform allows functions to continue processing after a response has been sent to the client using `event.waitUntil()`. This is essential for maintaining a snappy user experience while performing maintenance tasks:

```javascript
async function handleRequest(event) {
  // 1. Logic for fast response
  const response = await fetchFromOrigin();

  // 2. Offload maintenance to the platform
  event.waitUntil(updateCacheAndLogs(event));

  // 3. Respond immediately
  return response;
}
```
- **Platform Managed**: The edge runtime keeps the execution context alive until the asynchronous tasks finish.
- **Edge Efficiency**: Processing happens on the edge, avoiding unnecessary complexity in central origins.

---

## Development Workflow

### 1. Modern Package Management
The project uses **pnpm** for fast, deterministic dependency management.

```bash
pnpm install
```

### 2. Local Emulation
Instead of deploying to the edge for every change, the project uses the Azion CLI's local server:

```bash
pnpm emulate
```

**Local KV Persistence**: When emulating locally, KV data is stored in `.edge/storage/` within the project root, allowing you to persist data across restarts without remote costs.

### 3. Environment Handling
Sensitive keys (like the **Groq API Key**) are handled via a `.env.local` file, which is automatically ignored by Git.

---

## Deployment Strategy

The project uses a dual-environment configuration (Staging and Production) defined in `azion.config.ts`.

- **Staging**: `pnpm deploy:staging` (creates resources with a `-staging` suffix).
- **Production**: `pnpm deploy:prod` (automated via CI/CD).

The `azion.json` state files are **committed to the repository**, ensuring that the CLI always knows which specific resources to update, regardless of which developer or CI runner is executing the deploy.

---

## CI/CD Pipeline

The project includes GitHub Actions workflows for:

- **Linting & Formatting**: Ensuring code consistency.
- **Automated Testing**: Running unit tests with Vitest.
- **Coverage Validation**: Requiring a minimum of **90% test coverage** before allowing a deployment.
- **Automated Deployment**: Automatically pushing to staging on PRs and to production on merges to `main`.

---

## VS Code Integration

The project is optimized for VS Code, including:
- **Preconfigured Linting**: ESLint and Prettier for "format on save" support.
- **TypeScript Integration**: Full type safety for the Azion Runtime environment.
- **Custom Scripts**: Quick access to common CLI tasks via the `package.json` scripts.
