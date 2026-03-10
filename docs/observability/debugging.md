---
title: Debugging
sidebar_position: 2
description: Debugging techniques for Azion Edge Functions.
---

# Debugging

Debugging Edge Functions requires a slightly different approach than debugging traditional server-side code. Functions run in a distributed, short-lived runtime — there is no persistent process to attach a debugger to, and each invocation is independent. This guide covers the tools and techniques that work well in this environment.

---

## 1. Local Debugging with the Azion CLI

The fastest debugging loop is local. The `azion dev` command starts a local development server that runs your function on your machine, where you get:

- Immediate `console.log()` output in your terminal.
- Fast reload on every file save.
- Full access to local network requests for inspection.

```bash
azion dev
```

All `console.log()`, `console.warn()`, and `console.error()` calls appear in your terminal during local development.

For a full guide to local development, see [Local Development / Preview](../development/local-development.md).

---

## 2. Inspecting Requests and Responses

A useful technique for production debugging is to echo back request details as the response body. This confirms exactly what the runtime is receiving before your business logic runs.

```js
addEventListener("fetch", event => {
  const { request } = event;

  const debugInfo = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  };

  event.respondWith(
    new Response(JSON.stringify(debugInfo, null, 2), {
      headers: { "Content-Type": "application/json" },
    })
  );
});
```

:::caution
Remove or gate debug responses behind a flag before going to production. Exposing request headers (including cookies or auth tokens) publicly is a security risk.
:::

---

## 3. Defensive Error Handling

Unhandled exceptions cause the runtime to return a `500` with no body — which makes them hard to diagnose in **Real-Time Events**. Wrap your handler in a `try/catch` to ensure errors are logged and the response is meaningful.

```js
const handleRequest = async (request, args) => {
  // ... your logic
  return new Response("OK");
};

addEventListener("fetch", event => {
  event.respondWith(
    handleRequest(event.request, event.args).catch(err => {
      console.error(JSON.stringify({
        event: "unhandled_error",
        message: err.message,
        stack: err.stack,
      }));

      return new Response("Internal Server Error", { status: 500 });
    })
  );
});
```

This ensures:

1. The error is logged with a full stack trace, visible in Real-Time Events under the **Functions Console** data source.
2. The client receives a proper HTTP response instead of a platform-level error page.
3. The function does not silently fail.

---

## 4. Common Errors and Their Causes

### `TypeError: Failed to fetch`

Usually means the URL passed to `fetch()` is malformed, or the target host is unreachable from the edge node.

```js
// Check your URL construction
const url = new URL(path, "https://api.example.com"); // ✅ Safe
const url = "https://" + path; // ❌ Breaks if path starts with "/"
```

### `TypeError: Cannot read properties of undefined`

The most common cause is accessing a property on `null` or `undefined` — often from a missing header or an API response that doesn't match the expected shape.

```js
// ❌ Throws if the header is absent
const token = request.headers.get("Authorization").split(" ")[1];

// ✅ Guard before accessing
const authHeader = request.headers.get("Authorization");
if (!authHeader) {
  return new Response("Unauthorized", { status: 401 });
}
const token = authHeader.split(" ")[1];
```

### Response body consumed twice

`Request` and `Response` bodies can only be read once. Calling `.json()`, `.text()`, or `.arrayBuffer()` a second time on the same object throws.

```js
// ❌ Throws on the second read
const data = await request.json();
const raw = await request.text();

// ✅ Clone before reading if you need it more than once
const cloned = request.clone();
const data = await request.json();
const raw = await cloned.text();
```

### `event.args` fields are undefined

`event.args` is populated from the Function Instance configuration. Missing keys return `undefined`, not an error. Always use default values.

```js
const targetOrigin = event.args.targetOrigin ?? "https://default.example.com";
```

---

## 5. Debugging in Production with Real-Time Events

When you need to investigate a production issue, **Real-Time Events** is your primary tool. Go to **Azion Console** → **Observe** → **Real-Time Events** and use the **Functions Console** data source to query recent invocations.

**What to look for:**

- `Line Source = RUNTIME` entries — these are platform-level errors not caught by your code.
- `Level = ERROR` entries — these come from `console.error()` calls in your handler.
- Invocations that appear in the **Functions** data source (metadata) but have no corresponding **Functions Console** entries — this may indicate a crash before any logging occurred.

**Enable verbose logging temporarily**

Add conditional verbose logging behind a flag in `event.args`:

```js
const verbose = event.args.DEBUG === "true";

if (verbose) {
  console.log(JSON.stringify({
    headers: Object.fromEntries(request.headers.entries()),
    args: event.args,
  }));
}
```

Set `"DEBUG": "true"` in the Function Instance Arguments. Remove it after investigation.

**Reproduce with `curl`**

Narrow down the issue by crafting a minimal reproduction request:

```bash
curl -i -X POST https://your-domain.azion.app/path \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

The `-i` flag shows response headers, which can reveal whether the function returned the expected status code or a platform-level error.

---

## 6. Debugging Async and Timing Issues

Edge Functions have an execution time limit. If your function performs many sequential `await` calls, it may time out before completing.

**Parallelize independent fetches:**

```js
// ❌ Sequential — slower and more likely to time out
const user = await fetchUser(id);
const settings = await fetchSettings(id);

// ✅ Parallel — both run concurrently
const [user, settings] = await Promise.all([fetchUser(id), fetchSettings(id)]);
```

**Set explicit timeouts on external calls:**

```js
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 3000); // 3s limit

try {
  const response = await fetch("https://api.example.com/data", {
    signal: controller.signal,
  });
  return response;
} catch (err) {
  if (err.name === "AbortError") {
    console.warn("Upstream request timed out");
    return new Response("Gateway Timeout", { status: 504 });
  }
  throw err;
} finally {
  clearTimeout(timeout);
}
```

---

## Related

- [Logs](./logs.md) — writing and accessing execution logs via Real-Time Events and Data Stream.
- [Metrics](./metrics.md) — aggregate data on errors, invocations, and latency.
- [Local Development / Preview](../development/local-development.md) — how to run and debug functions locally.
