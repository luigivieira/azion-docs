---
title: Runtime APIs
sidebar_position: 1
description: Web APIs available in the Azion Edge Functions runtime.
---

# Runtime APIs

The Azion Runtime is a JavaScript environment based on the **Web APIs standard**. It does not expose Node.js built-ins, but it implements a broad set of browser-compatible APIs that cover the vast majority of use cases at the edge.

This page is a reference for the APIs available in your functions.

---

## Fetch API

The Fetch API is the primary mechanism for making HTTP requests — both to respond to incoming requests and to make outbound subrequests.

### `fetch(input, init?)`

Makes an outbound HTTP request. Returns a `Promise<Response>`.

```js
const res = await fetch("https://api.example.com/data", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ key: "value" }),
});

const data = await res.json();
```

### `Request`

Represents an HTTP request. Constructed manually or received via `event.request`.

```js
const req = new Request("https://example.com/path", {
  method: "GET",
  headers: new Headers({ Accept: "application/json" }),
});
```

Key properties and methods:

| Member | Type | Description |
|---|---|---|
| `request.url` | `string` | Full URL of the request |
| `request.method` | `string` | HTTP method (`GET`, `POST`, etc.) |
| `request.headers` | `Headers` | Request headers |
| `request.body` | `ReadableStream \| null` | Request body as a stream |
| `request.json()` | `Promise<any>` | Parse body as JSON |
| `request.text()` | `Promise<string>` | Parse body as text |
| `request.arrayBuffer()` | `Promise<ArrayBuffer>` | Parse body as binary |
| `request.formData()` | `Promise<FormData>` | Parse body as form data |
| `request.clone()` | `Request` | Create a copy (body can only be read once) |

### `Response`

Represents an HTTP response.

```js
// Plain text response
new Response("Hello", { status: 200 })

// JSON response
new Response(JSON.stringify({ ok: true }), {
  status: 200,
  headers: { "Content-Type": "application/json" },
})

// Redirect
Response.redirect("https://new.example.com/path", 301)
```

Key static methods:

| Method | Description |
|---|---|
| `Response.redirect(url, status)` | Creates a redirect response |
| `Response.error()` | Creates a network error response |
| `Response.json(data, init?)` | Creates a JSON response (sets `Content-Type` automatically) |

### `Headers`

A mutable, case-insensitive map of HTTP headers.

```js
const headers = new Headers({
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
});

headers.set("X-Custom", "value");
headers.get("content-type"); // "application/json"
headers.has("X-Custom");     // true
headers.delete("Cache-Control");
```

---

## URL API

### `URL`

Parses and constructs URLs. Preferred over string manipulation for URL handling.

```js
const url = new URL(event.request.url);

url.pathname;                   // "/api/items"
url.searchParams.get("page");   // "2"
url.origin;                     // "https://example.com"
```

### `URLSearchParams`

Handles URL query strings.

```js
const params = new URLSearchParams("page=2&limit=10");
params.get("page");    // "2"
params.set("limit", "20");
params.toString();     // "page=2&limit=20"
```

---

## Encoding APIs

### `TextEncoder` / `TextDecoder`

Convert between strings and `Uint8Array` (UTF-8).

```js
const encoder = new TextEncoder();
const bytes = encoder.encode("Hello, edge!");
// Uint8Array

const decoder = new TextDecoder();
const text = decoder.decode(bytes);
// "Hello, edge!"
```

### `atob()` / `btoa()`

Base64 encode and decode strings.

```js
const encoded = btoa("user:password");  // "dXNlcjpwYXNzd29yZA=="
const decoded = atob(encoded);          // "user:password"
```

:::tip Binary data
For arbitrary binary data, use `TextEncoder` and `Uint8Array`. `atob`/`btoa` are limited to Latin-1 characters and will throw on values outside that range.
:::

---

## Streams API

The Streams API enables handling large or streaming responses without buffering the entire body into memory.

### `ReadableStream`

```js
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode("chunk 1"));
    controller.enqueue(new TextEncoder().encode("chunk 2"));
    controller.close();
  },
});

return new Response(stream, {
  headers: { "Content-Type": "text/plain" },
});
```

### `TransformStream`

Transforms data as it flows through a pipe chain. Useful for modifying a response body on the fly without buffering the full content.

```js
const { readable, writable } = new TransformStream({
  transform(chunk, controller) {
    const text = new TextDecoder().decode(chunk);
    controller.enqueue(new TextEncoder().encode(text.toUpperCase()));
  },
});

const upstream = await fetch("https://origin.example.com/text");
upstream.body.pipeTo(writable);

return new Response(readable);
```

---

## Cache API

The Cache API stores and retrieves `Request`/`Response` pairs at the edge node level.

```js
const cache = await caches.open("my-cache");

// Store a response
await cache.put(request, response.clone());

// Retrieve a cached response
const cached = await cache.match(request);
if (cached) return cached;

// Delete a cached entry
await cache.delete(request);
```

:::info Node-local cache
Each edge node maintains its own cache. Entries are not replicated across points of presence. For globally consistent or long-lived shared state, use **Azion KV Storage**.
:::

---

## Web Crypto API

Cryptographic operations via the `crypto` global.

### Generating random values

```js
const buffer = new Uint8Array(16);
crypto.getRandomValues(buffer);
// buffer is filled with cryptographically secure random bytes
```

### `crypto.randomUUID()`

```js
const id = crypto.randomUUID();
// "550e8400-e29b-41d4-a716-446655440000"
```

### `crypto.subtle`

For HMAC signatures, AES encryption, SHA hashing, and key derivation:

```js
// SHA-256 hash of a string
const msgBuffer = new TextEncoder().encode("hello");
const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
```

```js
// Verify an HMAC-SHA256 signature from a request header
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(event.args.SECRET_KEY),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["verify"]
);

const signatureHex = event.request.headers.get("X-Signature") ?? "";
const signatureBytes = new Uint8Array(
  signatureHex.match(/.{2}/g).map(b => parseInt(b, 16))
);
const body = await event.request.arrayBuffer();

const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, body);
```

---

## Timers

Standard timer globals are available.

```js
// Pause execution for a fixed duration
await new Promise(resolve => setTimeout(resolve, 100));

// Execute logic after a delay
const id = setTimeout(() => console.log("fired"), 500);
clearTimeout(id);
```

`setInterval` is available but rarely useful in a request-response context since execution ends when the response is delivered.

---

## `AbortController` / `AbortSignal`

Used to cancel in-flight `fetch()` calls — most commonly to enforce request timeouts.

```js
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 5000);

try {
  const res = await fetch("https://slow-api.example.com", {
    signal: controller.signal,
  });
  return res;
} catch (err) {
  if (err.name === "AbortError") {
    return new Response("Gateway Timeout", { status: 504 });
  }
  throw err;
} finally {
  clearTimeout(timer);
}
```

---

## `console`

All four standard log levels are supported and captured by the runtime:

```js
console.log("general output");
console.info("significant event");
console.warn("non-fatal anomaly");
console.error("failure condition");
```

Output is available in **Real-Time Events** under the **Functions Console** data source. See [Logs](../observability/logs.md) for details.

---

## APIs Not Available

The following are **not** available in the Azion Runtime:

| Not available | Alternative |
|---|---|
| Node.js built-ins (`fs`, `path`, `net`, `os`, …) | Use Web APIs or external HTTP services |
| `require()` / CommonJS modules | Bundle your code or use native ES module syntax |
| `process.env` | Use `event.args` for configuration values |
| `WebSocket` (server-initiated) | Not currently supported |
| `XMLHttpRequest` | Use `fetch()` |
| `document`, `window`, DOM APIs | Not applicable in a server-side runtime |

---

## Related

- [Runtime Environment](./runtime-environment.md) — the full context your function runs in.
- [Event Handlers](./event-handlers.md) — how `addEventListener` and the event model work.
- [Calling External APIs](../development/calling-external-apis.md) — practical guide to outbound `fetch()`.
