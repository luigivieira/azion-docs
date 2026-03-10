---
title: Function Structure
sidebar_position: 1
description: The structure and anatomy of an Azion Edge Function.
---

# Function Structure

Every Azion Edge Function follows a consistent pattern built around the **Fetch Event** model. Understanding this structure is the foundation for writing any Edge Function — from simple redirects to complex API integrations.

---

## 1. The Minimal Function

The smallest possible Edge Function looks like this:

```js
addEventListener("fetch", event => {
  event.respondWith(new Response("Hello, World!"));
});
```

Three things are happening here:

1. **`addEventListener("fetch", ...)`** — registers a listener for incoming HTTP requests.
2. **`event.respondWith(...)`** — tells the runtime what response to send back to the client.
3. **`new Response(...)`** — constructs the HTTP response.

---

## 2. The `FetchEvent` Object

When a request arrives, the runtime calls your listener with a `FetchEvent` object. It exposes two key members:

| Member | Type | Description |
|---|---|---|
| `event.request` | `Request` | The incoming HTTP request (URL, method, headers, body). |
| `event.args` | `object` | JSON arguments configured in the Function Instance. |

### `event.request`

This is a standard [Web API `Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object. You can read the URL, method, headers, and body from it.

```js
addEventListener("fetch", event => {
  const { request } = event;

  const url = new URL(request.url);
  const method = request.method;

  event.respondWith(new Response(`${method} ${url.pathname}`));
});
```

### `event.args`

`event.args` contains the JSON object you configure in the **Arguments** tab of a Function Instance. It is the primary way to pass configuration values to a function without hardcoding them.

```js
addEventListener("fetch", event => {
  const { args } = event;

  const greeting = args.greeting ?? "Hello";
  const name = args.name ?? "World";

  event.respondWith(new Response(`${greeting}, ${name}!`));
});
```

In the Function Instance configuration, you would set:

```json
{
  "greeting": "Hi",
  "name": "Azion"
}
```

---

## 3. Async Handlers

Most real-world functions perform asynchronous operations like `fetch()`. The recommended pattern is to extract the logic into an `async` handler function:

```js
const handleRequest = async (request, args) => {
  // ... your logic here

  return new Response("Done");
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

The `event.respondWith()` method accepts either a `Response` object or a `Promise<Response>`, so passing the promise returned by an `async` function works correctly.

---

## 4. Background Tasks with `event.waitUntil()`

Sometimes you need to perform work that should not delay the response — like sending telemetry, updating a cache, or logging to an external service.

`event.waitUntil()` lets you start a background task that continues to execute **after** the response has been sent to the client.

```js
const logToExternalService = async (data) => {
  await fetch("https://my-logging-service.example.com/log", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", event => {
  const response = new Response("OK");

  // Fire and forget — this runs after the response is delivered
  event.waitUntil(logToExternalService({ url: event.request.url }));

  event.respondWith(response);
});
```

:::tip When to use `waitUntil`
Use `waitUntil` for side-effects that don't change the response: analytics, cache warming, audit logging. Avoid it for logic the user needs to see in the response.
:::

---

## 5. TypeScript

Functions can also be written in TypeScript. The Azion runtime does not execute TypeScript directly — you must transpile it to JavaScript before saving it through the console or deploying via CLI.

A typed version of the minimal function:

```ts
interface Args {
  greeting?: string;
}

const handleRequest = async (request: Request, args: Args): Promise<Response> => {
  const greeting = args.greeting ?? "Hello";
  return new Response(`${greeting} from the edge!`);
};

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(handleRequest(event.request, (event as any).args));
});
```

---

## 6. Putting It All Together

Here is a complete example combining all the concepts above:

```js
const handleRequest = async (request, args) => {
  const url = new URL(request.url);
  const target = args.targetOrigin ?? "https://example.com";

  // Proxy the request to the configured origin
  const originResponse = await fetch(`${target}${url.pathname}${url.search}`);

  return new Response(originResponse.body, {
    status: originResponse.status,
    headers: originResponse.headers,
  });
};

addEventListener("fetch", event => {
  // Background: log every request
  event.waitUntil(
    fetch("https://logger.example.com/hit", {
      method: "POST",
      body: JSON.stringify({ path: new URL(event.request.url).pathname }),
    })
  );

  event.respondWith(handleRequest(event.request, event.args));
});
```
