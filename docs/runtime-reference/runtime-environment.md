---
title: Runtime Environment
sidebar_position: 5
description: The runtime environment for Azion Edge Functions.
---

# Runtime Environment

Understanding the environment your function runs in helps you write code that is correct, efficient, and free of assumptions inherited from Node.js or browser environments.

---

## 1. What the Azion Runtime Is

The Azion Runtime is a **JavaScript engine** based on V8 — the same engine that powers Chrome and Node.js. However, it is not Node.js. The runtime exposes a subset of the [Web APIs standard](https://developer.mozilla.org/en-US/docs/Web/API), not the Node.js standard library.

This means:

- You write standard JavaScript (ES2020+) or TypeScript (compiled to JS before deployment).
- Browser-style APIs like `fetch`, `Request`, `Response`, `URL`, `TextEncoder`, and `crypto` are available.
- Node.js APIs like `fs`, `path`, `net`, `process`, `Buffer`, and `require()` are **not** available.
- The DOM is not available — there is no `document`, `window`, or `navigator`.

The design goal is **portability across edge environments** and compatibility with the emerging [WinterCG](https://wintercg.org/) standard for server-side JavaScript runtimes.

---

## 2. JavaScript Support

The runtime supports modern JavaScript. You can use:

- `async` / `await`
- `Promise`, `Promise.all`, `Promise.allSettled`
- Destructuring, spread operators, optional chaining (`?.`), nullish coalescing (`??`)
- `class` syntax
- Template literals
- ES modules syntax (`import` / `export`) — when the function is bundled correctly

:::info TypeScript
TypeScript is not executed directly. You must compile your TypeScript to JavaScript before saving it to the Azion Console or deploying via the CLI. The Azion CLI handles this compilation automatically.
:::

---

## 3. Globals Available

The following globals are injected by the runtime and available without imports:

| Global | Description |
|---|---|
| `addEventListener` | Registers event listeners (`fetch`, `firewall`) |
| `fetch` | Makes outbound HTTP requests |
| `Request` | HTTP request constructor |
| `Response` | HTTP response constructor |
| `Headers` | HTTP headers constructor |
| `URL` | URL parser and constructor |
| `URLSearchParams` | Query string parser |
| `TextEncoder` | Encodes strings to `Uint8Array` |
| `TextDecoder` | Decodes `Uint8Array` to strings |
| `ReadableStream` | Readable byte stream |
| `WritableStream` | Writable byte stream |
| `TransformStream` | Transform pipeline stage |
| `caches` | Cache API storage |
| `crypto` | Web Crypto API (including `crypto.subtle`) |
| `console` | Log output (captured by the runtime) |
| `setTimeout` / `clearTimeout` | Deferred execution |
| `setInterval` / `clearInterval` | Repeated execution |
| `AbortController` / `AbortSignal` | Cancellation tokens for `fetch` |
| `atob` / `btoa` | Base64 encoding |
| `FormData` | Multipart form data |
| `Blob` | Binary large object |
| `structuredClone` | Deep-clone a value |
| `queueMicrotask` | Schedule a microtask |

---

## 4. Isolation

Each function invocation runs in its **own isolate** — a lightweight, sandboxed execution context within the V8 engine. Isolates provide:

- **Memory isolation**: One function cannot access another function's memory.
- **State isolation**: Global variables do not persist between requests within the same isolate (in most cases — see section 5).
- **Security**: A malformed or crashing function cannot affect other requests being handled by the same edge node.

Isolates are much cheaper to create than full OS processes or even threads. This makes the Azion Runtime highly efficient at handling large volumes of concurrent requests with low overhead.

---

## 5. Global Scope and State

Variables declared at the **module level** (outside of your event handler) may persist across multiple invocations handled by the same isolate instance. This is an optimization — the runtime can reuse an already-warmed isolate to avoid the overhead of initialization for every request.

This has two implications:

**You can use module-level constants for shared, immutable data:**

```js
// Initialized once per isolate lifetime
const ALLOWED_ORIGINS = new Set(["https://app.example.com", "https://admin.example.com"]);

addEventListener("fetch", event => {
  const origin = event.request.headers.get("Origin") ?? "";

  if (!ALLOWED_ORIGINS.has(origin)) {
    event.respondWith(new Response("Forbidden", { status: 403 }));
    return;
  }

  event.respondWith(new Response("OK"));
});
```

**You must not store mutable per-request state at module level:**

```js
// ❌ Dangerous — this counter may accumulate across multiple requests
let requestCount = 0;

addEventListener("fetch", event => {
  requestCount++; // Not isolated to this request
  event.respondWith(new Response(`Count: ${requestCount}`));
});
```

If you need per-request state, keep it inside the event handler or the async functions it calls.

---

## 6. Environment Variables

The Azion Runtime does not expose `process.env`. Environment-specific configuration is passed to functions through the **Function Instance Arguments** — a JSON object available at `event.args`.

```js
addEventListener("fetch", event => {
  const apiKey = event.args.API_KEY;
  const region = event.args.REGION ?? "us-east";

  // use apiKey and region...
});
```

Arguments are configured per Function Instance, which means the same function code can behave differently depending on where it is instantiated. See [Function Arguments and Environment Variables](../development/function-arguments-and-environment-variables.md) for the full pattern.

---

## 7. Networking

Edge Functions run on the Azion Edge Network, distributed across many points of presence globally. Each function invocation runs at the edge node that is closest to the user who made the request.

Outbound `fetch()` calls from within a function are made from that same edge node. This means:

- **Latency to your origin or external APIs** depends on the geographic proximity of the edge node to the upstream service.
- **IP addresses** of outbound requests vary per node. If your upstream service uses IP allowlisting, you may need to configure it to allow all Azion edge node IPs.
- **DNS resolution** is performed by the runtime. The same hostname may resolve differently across nodes or over time.

---

## 8. File System

There is no writable file system. Edge Functions cannot read from or write to disk. All data must be:

- Passed in via `event.args` at configuration time.
- Received from the incoming request.
- Fetched from an external service using `fetch()`.
- Retrieved from the Cache API.

---

## Related

- [Runtime APIs](./runtime-apis.md) — complete list of available APIs.
- [Execution Model](./execution-model.md) — how invocations are scheduled and what limits apply.
- [Function Arguments and Environment Variables](../development/function-arguments-and-environment-variables.md) — how to pass configuration to functions.
