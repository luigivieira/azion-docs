---
title: Tratando Requisições e Respostas
sidebar_position: 2
description: Como tratar requisições HTTP e construir respostas em Edge Functions.
---

# Tratando Requisições e Respostas

Edge Functions recebem uma [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) padrão da Web API e devem retornar uma [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) padrão. Por serem interfaces do padrão W3C, qualquer conhecimento que você tenha da Fetch API do navegador ou do Cloudflare Workers se aplica diretamente aqui.

---

## 1. Lendo a Requisição

### URL e Path

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

### Método

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

### Lendo o Body

O body da requisição é consumido como um stream. Você pode lê-lo como texto, JSON ou bytes brutos. Note que o body só pode ser lido **uma vez** — clone a requisição primeiro se precisar lê-lo mais de uma vez.

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

:::tip Clonando uma requisição
Se você precisar inspecionar o body **e** encaminhar a requisição original para uma origem, clone-a primeiro:

```js
const cloned = request.clone();
const body = await cloned.json();
const originResponse = await fetch(request); // original is untouched
```
:::

---

## 2. Construindo Respostas

### Texto Simples

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

### Códigos de Status

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

## 3. Redirecionamentos

Use o status `301` ou `302` com um header `Location` para redirecionar o cliente.

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

`Response.redirect(url, status)` é um construtor de conveniência que define automaticamente o header `Location` e o código de status.

---

## 4. Manipulando Headers na Resposta

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

## 5. Encaminhando Requisições para uma Origem (Proxy)

Um padrão comum é passar a requisição para um backend e, opcionalmente, modificar a resposta antes de retorná-la.

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

## 6. Trabalhando com Cookies

Cookies são transmitidos como headers comuns. Leia-os a partir do header `Cookie` na requisição e defina-os via `Set-Cookie` na resposta.

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
