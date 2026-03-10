---
title: Calling External APIs
sidebar_position: 4
description: How to call external APIs from within an Azion Edge Function.
---

# Calling External APIs

Edge Functions have full access to the standard `fetch()` API, which means you can make outbound HTTP requests to any external service — REST APIs, GraphQL endpoints, databases with HTTP interfaces, or any other service reachable over the internet.

:::info Outbound requests count as subrequests
Each `fetch()` call made from within an Edge Function is a **subrequest**. Subrequests consume network time and count toward your plan's subrequest limits. Be mindful of making multiple sequential requests — use parallel fetches when possible.
:::

---

## 1. Basic `fetch()` Usage

The `fetch()` global is identical to the browser Fetch API. A simple GET request:

```js
const handleRequest = async (request) => {
  const response = await fetch("https://api.example.com/data");

  if (!response.ok) {
    return new Response("Upstream error", { status: 502 });
  }

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});
```

---

## 2. Making Authenticated Requests

### Bearer Token

```js
const fetchWithAuth = async (url, token) => {
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

addEventListener("fetch", event => {
  event.respondWith(
    fetchWithAuth("https://api.example.com/protected", event.args.API_TOKEN)
      .then(res => res.json())
      .then(data => new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      }))
  );
});
```

### API Key in Header

```js
const res = await fetch("https://api.example.com/v1/results", {
  headers: {
    "X-API-Key": event.args.API_KEY,
  },
});
```

### Basic Auth

```js
const credentials = btoa(`${event.args.USERNAME}:${event.args.PASSWORD}`);

const res = await fetch("https://api.example.com/secure", {
  headers: {
    Authorization: `Basic ${credentials}`,
  },
});
```

---

## 3. Sending Data (POST, PUT, PATCH)

### JSON Body

```js
const handleRequest = async (request, args) => {
  const payload = await request.json();

  const res = await fetch("https://api.example.com/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.API_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await res.json();

  return new Response(JSON.stringify(result), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

### Form Data

```js
const formData = new FormData();
formData.append("name", "Azion");
formData.append("type", "edge");

const res = await fetch("https://api.example.com/submit", {
  method: "POST",
  body: formData,
});
```

---

## 4. Parallel Requests

When multiple independent API calls are needed, run them in parallel with `Promise.all()` instead of awaiting them sequentially. This can significantly reduce total latency.

```js
const handleRequest = async (request, args) => {
  const base = args.API_BASE ?? "https://api.example.com";

  // Both requests start at the same time
  const [usersRes, productsRes] = await Promise.all([
    fetch(`${base}/users`),
    fetch(`${base}/products`),
  ]);

  const [users, products] = await Promise.all([
    usersRes.json(),
    productsRes.json(),
  ]);

  return new Response(JSON.stringify({ users, products }), {
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

**Sequential (slow):** ~200ms + ~150ms = ~350ms total
**Parallel:** ~200ms total (limited by the slowest request)

---

## 5. Error Handling

Always handle errors from external services gracefully. A downstream API failure should not cause your edge function to crash or return an unhandled exception.

```js
const safeFetch = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      throw new Error(`Upstream responded with ${res.status}`);
    }

    return { data: await res.json(), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

const handleRequest = async (request, args) => {
  const { data, error } = await safeFetch(`${args.API_BASE}/resource`);

  if (error) {
    console.error("Upstream error:", error);
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

---

## 6. Timeouts

The `fetch()` API in the Azion Runtime supports `AbortController` and `AbortSignal`, which you can use to enforce a timeout on outbound requests.

```js
const fetchWithTimeout = async (url, options = {}, timeoutMs = 5000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

addEventListener("fetch", event => {
  event.respondWith(
    fetchWithTimeout("https://slow-api.example.com/data", {}, 3000)
      .then(res => res.json())
      .then(data => new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      }))
      .catch(err => new Response(err.message, { status: 504 }))
  );
});
```

---

## 7. Caching Responses from External APIs

If the external API you're calling returns data that doesn't change frequently, caching the response at the edge dramatically reduces latency and the number of subrequests you make.

The Azion Runtime supports the standard [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache). Here is a simple cache-aside pattern:

```js
const CACHE_NAME = "external-api-cache";

const handleRequest = async (request, args) => {
  const cacheUrl = `https://cache-key.internal/weather`;
  const cache = await caches.open(CACHE_NAME);

  // Check the cache first
  const cached = await cache.match(cacheUrl);
  if (cached) {
    return cached;
  }

  // Fetch from origin
  const res = await fetch(`${args.WEATHER_API}/current?city=sao-paulo`, {
    headers: { "X-API-Key": args.WEATHER_API_KEY },
  });

  if (!res.ok) {
    return new Response("Weather service unavailable", { status: 502 });
  }

  // Clone the response before caching (it can only be consumed once)
  const responseToCache = res.clone();
  await cache.put(cacheUrl, responseToCache);

  return res;
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

:::tip Cache invalidation
The Cache API stores entries per edge node. Each point of presence maintains its own cache. If you need global, coordinated invalidation, consider using **Azion KV Storage** to store cached values with explicit TTLs.
:::
