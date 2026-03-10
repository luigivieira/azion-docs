---
title: Handling Requests and Responses
sidebar_position: 2
description: How to handle HTTP requests and build responses in Edge Functions.
---

# Handling Requests and Responses

Edge Functions receive a standard Web API [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) and must return a standard [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response). Because these are W3C-standard interfaces, any knowledge you have of the browser Fetch API or Cloudflare Workers applies directly here.

---

## 1. Reading the Request

### URL and Path

```js
addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  const pathname = url.pathname;   // e.g., "/products"
  const search   = url.search;     // e.g., "?page=2"
  const hostname = url.hostname;   // e.g., "myapp.map.azionedge.net"

  const page = url.searchParams.get("page") ?? "1";

  event.respondWith(new Response(`Page: ${page}`));
});
```

### Method

```js
addEventListener("fetch", event => {
  const { method } = event.request;

  if (method !== "GET" && method !== "POST") {
    event.respondWith(
      new Response("Method Not Allowed", { status: 405 })
    );
    return;
  }

  event.respondWith(new Response("OK"));
});
```

### Headers

```js
addEventListener("fetch", event => {
  const { request } = event;

  const contentType = request.headers.get("content-type") ?? "";
  const authHeader  = request.headers.get("authorization") ?? "";

  // Iterate over all headers
  for (const [key, value] of request.headers.entries()) {
    console.log(`${key}: ${value}`);
  }

  event.respondWith(new Response("Headers read"));
});
```

### Reading the Body

The request body is consumed as a stream. You can read it as text, JSON, or raw bytes. Note that the body can only be read **once** — clone the request first if you need to read it multiple times.

```js
addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

const handleRequest = async (request) => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    return new Response(`Received: ${JSON.stringify(body)}`);
  }

  if (contentType.includes("text/")) {
    const text = await request.text();
    return new Response(`Text received: ${text}`);
  }

  // For binary data
  const buffer = await request.arrayBuffer();
  return new Response(`Binary: ${buffer.byteLength} bytes`);
};
```

:::tip Cloning a request
If you need to inspect the body **and** forward the original request to an origin, clone it first:

```js
const cloned = request.clone();
const body = await cloned.json();
const originResponse = await fetch(request); // original is untouched
```
:::

---

## 2. Building Responses

### Plain Text

```js
new Response("Hello, World!");
```

### JSON

```js
const data = { status: "ok", timestamp: Date.now() };

new Response(JSON.stringify(data), {
  headers: { "Content-Type": "application/json" },
});
```

### HTML

```js
const html = `<!DOCTYPE html>
<html>
  <body><h1>Hello from the edge</h1></body>
</html>`;

new Response(html, {
  headers: { "Content-Type": "text/html;charset=UTF-8" },
});
```

### Status Codes

```js
// 201 Created
new Response(JSON.stringify({ id: 42 }), {
  status: 201,
  headers: { "Content-Type": "application/json" },
});

// 404 Not Found
new Response("Not Found", { status: 404 });

// 500 Internal Server Error
new Response("Internal Server Error", { status: 500 });
```

---

## 3. Redirects

Use a `301` or `302` status with a `Location` header to redirect the client.

```js
addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Redirect HTTP to HTTPS
  if (url.protocol === "http:") {
    const httpsUrl = `https://${url.host}${url.pathname}${url.search}`;
    event.respondWith(
      Response.redirect(httpsUrl, 301)
    );
    return;
  }

  event.respondWith(new Response("Secure connection"));
});
```

`Response.redirect(url, status)` is a convenience constructor that sets both the `Location` header and the status code automatically.

---

## 4. Manipulating Headers on the Response

```js
const handleRequest = async (request) => {
  // Forward to origin
  const response = await fetch(request);

  // Create a mutable copy of the response headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set("X-Edge-Processed", "true");
  newHeaders.set("Cache-Control", "public, max-age=3600");
  newHeaders.delete("X-Powered-By");

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});
```

---

## 5. Forwarding Requests to an Origin (Proxy)

A common pattern is to pass the request through to a backend and optionally modify the response before returning it.

```js
const handleRequest = async (request, args) => {
  const origin = args.origin ?? "https://my-origin.example.com";
  const url = new URL(request.url);

  const originRequest = new Request(`${origin}${url.pathname}${url.search}`, {
    method: request.method,
    headers: request.headers,
    body: request.method !== "GET" && request.method !== "HEAD"
      ? request.body
      : undefined,
  });

  const originResponse = await fetch(originRequest);

  // Pass the response through unchanged
  return originResponse;
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

---

## 6. Working with Cookies

Cookies are transmitted as regular headers. Read them from `Cookie` on the request and set them via `Set-Cookie` on the response.

```js
const getCookie = (request, name) => {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(c => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );
  return cookies[name];
};

addEventListener("fetch", event => {
  const { request } = event;
  const sessionId = getCookie(request, "session_id");

  if (!sessionId) {
    const response = new Response("Unauthorized", { status: 401 });
    response.headers.set("Set-Cookie", "session_id=new-session; Path=/; HttpOnly; Secure");
    event.respondWith(response);
    return;
  }

  event.respondWith(new Response(`Session: ${sessionId}`));
});
```
