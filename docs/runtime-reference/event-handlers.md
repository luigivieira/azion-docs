---
title: Event Handlers
sidebar_position: 2
description: Event handlers available in the Azion Edge Functions runtime.
---

# Event Handlers

Edge Functions are event-driven. Your code does not run on a server loop — it runs in response to an event emitted by the Azion Runtime when a request arrives. This page covers the event model, the available event types, and the methods they expose.

---

## 1. `addEventListener`

All Edge Functions register a listener using the global `addEventListener` function:

```js
addEventListener(type, handler)
```

| Parameter | Description |
|---|---|
| `type` | The event type string: `"fetch"` or `"firewall"` |
| `handler` | A function that receives the event object |

You can register only **one listener per event type**. Calling `addEventListener` a second time with the same type overwrites the first registration.

---

## 2. The Fetch Event

Functions deployed in an **Edge Application** respond to `fetch` events. This is the most common event type — every inbound HTTP request triggers a fetch event.

```js
addEventListener("fetch", event => {
  event.respondWith(new Response("OK"));
});
```

### `FetchEvent` members

| Member | Type | Description |
|---|---|---|
| `event.request` | `Request` | The incoming HTTP request |
| `event.args` | `object` | JSON arguments from the Function Instance configuration |
| `event.respondWith(response)` | `void` | Sets the response to return to the client |
| `event.waitUntil(promise)` | `void` | Schedules a background task that runs after the response is sent |

### `event.request`

A standard [Web API `Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) representing the incoming HTTP request. Read the URL, method, headers, and body from it.

```js
addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);
  const method = request.method;

  console.log(`${method} ${url.pathname}`);

  event.respondWith(new Response("logged"));
});
```

### `event.args`

The JSON object configured in the **Arguments** tab of the Function Instance. It is the recommended way to inject configuration into a function without hardcoding values in the code.

```js
addEventListener("fetch", event => {
  const { targetOrigin } = event.args;

  event.respondWith(
    fetch(`${targetOrigin}${new URL(event.request.url).pathname}`)
  );
});
```

### `event.respondWith(response)`

`respondWith` accepts either a `Response` object or a `Promise<Response>`. It must be called **synchronously** within the event handler — you cannot defer it across an await boundary:

```js
// ✅ Correct — respondWith called synchronously, receives a Promise
addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});

// ✅ Also correct — respondWith called directly with a Response
addEventListener("fetch", event => {
  event.respondWith(new Response("Hello"));
});
```

```js
// ❌ Incorrect — respondWith is called inside an async callback
addEventListener("fetch", async event => {
  const data = await fetch("https://api.example.com");
  event.respondWith(new Response(await data.text())); // Too late
});
```

### `event.waitUntil(promise)`

`waitUntil` schedules work to continue running after the response has been delivered to the client. Use it for fire-and-forget side effects: analytics, audit logging, cache warming.

```js
addEventListener("fetch", event => {
  const response = new Response("OK");

  event.waitUntil(
    fetch("https://logger.example.com/hit", {
      method: "POST",
      body: JSON.stringify({ url: event.request.url }),
    })
  );

  event.respondWith(response);
});
```

:::tip
`waitUntil` does not affect the response the user receives — it only extends the function's lifetime. The total time budget for background tasks is counted against the function's overall execution time limit.
:::

---

## 3. The Firewall Event

Functions deployed in an **Edge Firewall** respond to `firewall` events. These functions execute at the security layer, before the request reaches the Edge Application.

```js
addEventListener("firewall", event => {
  const ip = event.request.headers.get("X-Forwarded-For");

  if (isBannedIP(ip)) {
    event.deny();
    return;
  }

  event.continue();
});
```

### `FirewallEvent` members

| Member | Type | Description |
|---|---|---|
| `event.request` | `Request` | The incoming HTTP request |
| `event.args` | `object` | JSON arguments from the Function Instance configuration |
| `event.deny()` | `void` | Rejects the request (returns `403 Forbidden`) |
| `event.drop()` | `void` | Drops the connection without sending a response |
| `event.continue()` | `void` | Passes the request through to the next processing stage |
| `event.respondWith(response)` | `void` | Returns a custom response, bypassing the origin |
| `event.waitUntil(promise)` | `void` | Schedules a background task |

### Firewall response options

A firewall function **must** call exactly one of `deny()`, `drop()`, `continue()`, or `respondWith()` to terminate the event. Failing to do so leaves the request unresolved.

| Action | Effect |
|---|---|
| `event.deny()` | Returns HTTP `403 Forbidden` to the client |
| `event.drop()` | Closes the connection with no response |
| `event.continue()` | Passes the request downstream to the Edge Application |
| `event.respondWith(res)` | Returns a custom response — allows allow-listing, redirects, or synthetic responses |

```js
addEventListener("firewall", event => {
  const token = event.request.headers.get("X-Auth-Token");

  if (!token || !isValidToken(token, event.args.SECRET)) {
    // Return a 401 with a custom body
    event.respondWith(
      new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );
    return;
  }

  event.continue();
});
```

---

## 4. Choosing the Right Event Type

| Goal | Event type | Location |
|---|---|---|
| Handle HTTP requests, proxy traffic, transform responses | `fetch` | Edge Application |
| Redirect or rewrite URLs | `fetch` | Edge Application |
| Authenticate or authorize requests | `fetch` or `firewall` | Edge Application or Firewall |
| Block or rate-limit traffic | `firewall` | Edge Firewall |
| Bot detection and mitigation | `firewall` | Edge Firewall |
| Custom signature verification | `firewall` | Edge Firewall |

---

## Related

- [Function Structure](../development/function-structure.md) — how to write a complete function from scratch.
- [Execution Model](./execution-model.md) — how events are dispatched and executed.
- [Functions in the Platform Architecture](../platform-integration/functions-in-platform-architecture.md) — how `fetch` and `firewall` events fit into the broader platform.
