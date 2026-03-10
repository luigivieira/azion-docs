---
title: Manejo de Solicitudes y Respuestas
sidebar_position: 2
description: Cómo manejar solicitudes HTTP y construir respuestas en Edge Functions.
---

# Manejo de Solicitudes y Respuestas

Las Edge Functions reciben una [`Request`](https://developer.mozilla.org/es/docs/Web/API/Request) estándar de la API Web y deben devolver una [`Response`](https://developer.mozilla.org/es/docs/Web/API/Response) estándar. Debido a que estas son interfaces estándar de la W3C, cualquier conocimiento que tenga de la API Fetch del navegador o de Cloudflare Workers se aplica directamente aquí.

---

## 1. Lectura de la Solicitud (Request)

### URL y Path (Ruta)

```js
addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  const pathname = url.pathname; // por ejemplo, "/productos"
  const search = url.search; // por ejemplo, "?page=2"
  const hostname = url.hostname; // por ejemplo, "myapp.map.azionedge.net"

  const page = url.searchParams.get("page") ?? "1";

  event.respondWith(new Response(`Página: ${page}`));
});
```

### Método

```js
addEventListener("fetch", (event) => {
  const { method } = event.request;

  if (method !== "GET" && method !== "POST") {
    event.respondWith(new Response("Método no permitido", { status: 405 }));
    return;
  }

  event.respondWith(new Response("OK"));
});
```

### Cabeceras (Headers)

```js
addEventListener("fetch", (event) => {
  const { request } = event;

  const contentType = request.headers.get("content-type") ?? "";
  const authHeader = request.headers.get("authorization") ?? "";

  // Iterar sobre todas las cabeceras
  for (const [key, value] of request.headers.entries()) {
    console.log(`${key}: ${value}`);
  }

  event.respondWith(new Response("Cabeceras leídas"));
});
```

### Lectura del Cuerpo (Body)

El cuerpo de la solicitud se consume como un flujo (stream). Puede leerlo como texto, JSON o bytes sin procesar (raw). Tenga en cuenta que el cuerpo solo puede leerse **una vez** — clone la solicitud primero si necesita leerla varias veces.

```js
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

const handleRequest = async (request) => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    return new Response(`Recibido: ${JSON.stringify(body)}`);
  }

  if (contentType.includes("text/")) {
    const text = await request.text();
    return new Response(`Texto recibido: ${text}`);
  }

  // Para datos binarios
  const buffer = await request.arrayBuffer();
  return new Response(`Binario: ${buffer.byteLength} bytes`);
};
```

:::tip Clonación de una solicitud
Si necesita inspeccionar el cuerpo **y** reenviar la solicitud original a un origen, clónela primero:

```js
const cloned = request.clone();
const body = await cloned.json();
const originResponse = await fetch(request); // la original está intacta
```

:::

---

## 2. Construcción de Respuestas

### Texto Plano

```js
new Response("¡Hola, mundo!");
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
  <body><h1>Hola desde el borde</h1></body>
</html>`;

new Response(html, {
  headers: { "Content-Type": "text/html;charset=UTF-8" },
});
```

### Códigos de Estado

```js
// 201 Created
new Response(JSON.stringify({ id: 42 }), {
  status: 201,
  headers: { "Content-Type": "application/json" },
});

// 404 Not Found
new Response("No encontrado", { status: 404 });

// 500 Internal Server Error
new Response("Error interno del servidor", { status: 500 });
```

---

## 3. Redirecciones

Use un estado `301` o `302` con una cabecera `Location` para redirigir al cliente.

```js
addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Redirigir de HTTP a HTTPS
  if (url.protocol === "http:") {
    const httpsUrl = `https://${url.host}${url.pathname}${url.search}`;
    event.respondWith(Response.redirect(httpsUrl, 301));
    return;
  }

  event.respondWith(new Response("Conexión segura"));
});
```

`Response.redirect(url, status)` es un constructor de conveniencia que establece automáticamente tanto la cabecera `Location` como el código de estado.

---

## 4. Manipulación de Cabeceras en la Respuesta

```js
const handleRequest = async (request) => {
  // Reenviar al origen
  const response = await fetch(request);

  // Crear una copia mutable de las cabeceras de respuesta
  const newHeaders = new Headers(response.headers);
  newHeaders.set("X-Edge-Processed", "true");
  newHeaders.set("Cache-Control", "public, max-age=3600");
  newHeaders.delete("X-Powered-By");

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
```

---

## 5. Reenvío de Solicitudes a un Origen (Proxy)

Un patrón común es pasar la solicitud a un backend y, opcionalmente, modificar la respuesta antes de devolverla.

```js
const handleRequest = async (request, args) => {
  const origin = args.origin ?? "https://my-origin.example.com";
  const url = new URL(request.url);

  const originRequest = new Request(`${origin}${url.pathname}${url.search}`, {
    method: request.method,
    headers: request.headers,
    body:
      request.method !== "GET" && request.method !== "HEAD"
        ? request.body
        : undefined,
  });

  const originResponse = await fetch(originRequest);

  // Pasar la respuesta sin cambios
  return originResponse;
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

---

## 6. Trabajar con Cookies

Las cookies se transmiten como cabeceras normales. Léalas desde `Cookie` en la solicitud y establézcalas mediante `Set-Cookie` en la respuesta.

```js
const getCookie = (request, name) => {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    }),
  );
  return cookies[name];
};

addEventListener("fetch", (event) => {
  const { request } = event;
  const sessionId = getCookie(request, "session_id");

  if (!sessionId) {
    const response = new Response("No autorizado", { status: 401 });
    response.headers.set(
      "Set-Cookie",
      "session_id=new-session; Path=/; HttpOnly; Secure",
    );
    event.respondWith(response);
    return;
  }

  event.respondWith(new Response(`Sesión: ${sessionId}`));
});
```
