---
title: Performance Optimization
sidebar_position: 3
description: Tips and techniques for optimizing Azion Edge Functions performance.
---

# Performance Optimization

Edge Functions are built for low-latency execution. But several common patterns can add unnecessary overhead — from cold start time to subrequest latency. This page covers the most effective optimizations.

---

## 1. Minimize Cold Start Time

A cold start occurs the first time a function is invoked on an edge node (or after a period of inactivity). The runtime must initialize a new isolate and execute all module-level code before handling the request.

**Keep module-level code minimal and fast:**

```js
// ✅ Fast — simple constant initialization
const ALLOWED_ORIGINS = new Set(["https://app.example.com"]);

// ❌ Slow — parsing a large JSON blob at startup
const HUGE_CONFIG = JSON.parse(GIANT_JSON_STRING); // defer this if possible
```

**Defer heavy initialization to the first request if it's request-dependent:**

```js
let client = null;

const getClient = (args) => {
  if (!client) {
    client = new SomeClient(args.API_KEY);
  }
  return client;
};

addEventListener("fetch", event => {
  const c = getClient(event.args);
  event.respondWith(c.handle(event.request));
});
```

---

## 2. Reduce Code Size

Larger functions take longer to parse and compile during a cold start. Keep your function code lean:

- **Remove unused code.** Dead code still gets parsed.
- **Bundle and tree-shake dependencies.** If you use a bundler (esbuild, Rollup), enable tree-shaking to eliminate unused exports.
- **Avoid shipping entire libraries for small use cases.** Implement the 5-line utility instead of importing a 200 KB library.

To check the size of your compiled output:

```bash
esbuild src/function.js --bundle --minify --outfile=dist/function.js
wc -c dist/function.js
```

See [Limits](../limits.md) for the code size ceiling.

---

## 3. Parallelize Subrequests

Every `fetch()` call to an external service adds latency. When you need multiple independent pieces of data, fetch them in parallel using `Promise.all()`:

```js
// ❌ Sequential — total time ≈ sum of all request times
const user = await fetch(`${args.API}/user/${userId}`).then(r => r.json());
const prefs = await fetch(`${args.API}/prefs/${userId}`).then(r => r.json());
const cart = await fetch(`${args.API}/cart/${userId}`).then(r => r.json());

// ✅ Parallel — total time ≈ max of all request times
const [user, prefs, cart] = await Promise.all([
  fetch(`${args.API}/user/${userId}`).then(r => r.json()),
  fetch(`${args.API}/prefs/${userId}`).then(r => r.json()),
  fetch(`${args.API}/cart/${userId}`).then(r => r.json()),
]);
```

If some requests depend on the result of a previous request, group independent ones into parallel batches:

```js
// First batch: get user and session (independent)
const [user, session] = await Promise.all([
  fetch(`${args.API}/user/${userId}`).then(r => r.json()),
  fetch(`${args.API}/session/${sessionId}`).then(r => r.json()),
]);

// Second batch: use results from first batch
const [profile, permissions] = await Promise.all([
  fetch(`${args.API}/profile/${user.profileId}`).then(r => r.json()),
  fetch(`${args.API}/permissions/${session.roleId}`).then(r => r.json()),
]);
```

---

## 4. Cache Upstream Responses

If an external API returns data that doesn't change on every request, cache the response at the edge using the Cache API. This eliminates subrequest latency for subsequent requests handled by the same edge node.

```js
const CACHE_NAME = "api-cache-v1";

const fetchWithCache = async (url, ttlSeconds = 60) => {
  const cache = await caches.open(CACHE_NAME);
  const cacheKey = new Request(url);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const fresh = await fetch(url);

  if (fresh.ok) {
    const toCache = new Response(fresh.clone().body, {
      status: fresh.status,
      headers: {
        ...Object.fromEntries(fresh.headers.entries()),
        "Cache-Control": `max-age=${ttlSeconds}`,
      },
    });
    await cache.put(cacheKey, toCache);
  }

  return fresh;
};
```

:::info Cache scope
The Cache API is per edge node. The cache is not shared across points of presence. The first request to each node will still hit your upstream — warming happens per-node.
:::

---

## 5. Stream Responses

For large or long-running responses, streaming allows the browser to start receiving and rendering content before the full body is ready — reducing perceived latency significantly.

```js
addEventListener("fetch", event => {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Start streaming the response immediately
  event.respondWith(new Response(readable, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  }));

  // Write content asynchronously
  event.waitUntil((async () => {
    const encoder = new TextEncoder();
    writer.write(encoder.encode("<html><body>"));

    const data = await fetch("https://api.example.com/items").then(r => r.json());
    for (const item of data.items) {
      writer.write(encoder.encode(`<p>${item.title}</p>`));
    }

    writer.write(encoder.encode("</body></html>"));
    writer.close();
  })());
});
```

---

## 6. Use `event.waitUntil` for Side Effects

Log shipping, analytics, and cache warming should not block the response. Use `event.waitUntil()` to run these after the response is sent:

```js
addEventListener("fetch", event => {
  const response = handleRequest(event.request, event.args);

  // Does not delay the response
  event.waitUntil(
    logRequest(event.request.url, event.request.method)
  );

  event.respondWith(response);
});
```

---

## 7. Avoid Unnecessary JSON Serialization

Parsing and serializing JSON is not free — especially for large objects. A few patterns to avoid:

```js
// ❌ Unnecessary round-trip: parse then serialize the same data
const data = await fetch(url).then(r => r.json());
return new Response(JSON.stringify(data), {
  headers: { "Content-Type": "application/json" },
});

// ✅ Pipe the raw response body if you don't need to transform it
const upstream = await fetch(url);
return new Response(upstream.body, {
  status: upstream.status,
  headers: upstream.headers,
});
```

Only parse the JSON if you actually need to read or modify the data.

---

## 8. Set Explicit Timeouts on Subrequests

Subrequests that hang consume your function's wall-clock time budget. Always set a timeout on outbound `fetch()` calls to external services:

```js
const fetchWithTimeout = async (url, timeoutMs = 3000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};
```

A 3–5 second timeout is a reasonable starting point. Adjust based on the SLA of the upstream service.

---

## 9. Measure Before Optimizing

Before investing in optimization, measure where the time is actually going. Use `Date.now()` or `performance.now()` to instrument your function:

```js
const handleRequest = async (request, args) => {
  const t0 = Date.now();

  const data = await fetchWithCache(`${args.API}/resource`);

  const t1 = Date.now();
  console.log(JSON.stringify({ stage: "fetch", ms: t1 - t0 }));

  const body = await data.json();

  const t2 = Date.now();
  console.log(JSON.stringify({ stage: "parse", ms: t2 - t1 }));

  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
};
```

Review the timing output in **Real-Time Events** to find the actual bottleneck before changing code.

---

## Related

- [Execution Model](../runtime-reference/execution-model.md) — cold starts, warm isolates, and time budgets.
- [Calling External APIs](../development/calling-external-apis.md) — caching and parallel fetch patterns.
- [Limits](../limits.md) — CPU time and memory limits.
