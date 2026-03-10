---
title: Llamada a APIs Externas
sidebar_position: 4
description: Cómo llamar a APIs externas desde una Azion Edge Function.
---

# Llamada a APIs Externas

Las Edge Functions tienen acceso completo a la API estándar `fetch()`, lo que significa que puede realizar solicitudes HTTP salientes a cualquier servicio externo: APIs REST, endpoints de GraphQL, bases de datos con interfaces HTTP o cualquier otro servicio accesible a través de internet.

:::info Las solicitudes salientes cuentan como subsolicitudes
Cada llamada `fetch()` realizada desde una Edge Function es una **subsolicitud (subrequest)**. Las subsolicitudes consumen tiempo de red y cuentan para los límites de subsolicitudes de su plan. Tenga cuidado al realizar múltiples solicitudes secuenciales; utilice fetchs paralelos cuando sea posible.
:::

---

## 1. Uso Básico de `fetch()`

El global `fetch()` es idéntico a la API Fetch del navegador. Una solicitud GET simple:

```js
const handleRequest = async (request) => {
  const response = await fetch("https://api.example.com/data");

  if (!response.ok) {
    return new Response("Error en el upstream", { status: 502 });
  }

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
```

---

## 2. Realización de Solicitudes Autenticadas

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

addEventListener("fetch", (event) => {
  event.respondWith(
    fetchWithAuth("https://api.example.com/protected", event.args.API_TOKEN)
      .then((res) => res.json())
      .then(
        (data) =>
          new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
          }),
      ),
  );
});
```

### Clave de API en la Cabecera

```js
const res = await fetch("https://api.example.com/v1/results", {
  headers: {
    "X-API-Key": event.args.API_KEY,
  },
});
```

### Autenticación Básica (Basic Auth)

```js
const credentials = btoa(`${event.args.USERNAME}:${event.args.PASSWORD}`);

const res = await fetch("https://api.example.com/secure", {
  headers: {
    Authorization: `Basic ${credentials}`,
  },
});
```

---

## 3. Envío de Datos (POST, PUT, PATCH)

### Cuerpo JSON

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

addEventListener("fetch", (event) => {
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

## 4. Solicitudes Paralelas

Cuando se necesitan múltiples llamadas a la API independientes, ejecútelas en paralelo con `Promise.all()` en lugar de esperar secuencialmente. Esto puede reducir significativamente la latencia total.

```js
const handleRequest = async (request, args) => {
  const base = args.API_BASE ?? "https://api.example.com";

  // Ambas solicitudes comienzan al mismo tiempo
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

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

**Secuencial (lento):** ~200ms + ~150ms = ~350ms total
**Paralelo:** ~200ms total (limitado por la solicitud más lenta)

---

## 5. Manejo de Errores

Maneje siempre los errores de los servicios externos con elegancia. Un fallo en la API de descarga no debería causar que su edge function falle o devuelva una excepción no manejada.

```js
const safeFetch = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      throw new Error(`El upstream respondió con ${res.status}`);
    }

    return { data: await res.json(), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

const handleRequest = async (request, args) => {
  const { data, error } = await safeFetch(`${args.API_BASE}/resource`);

  if (error) {
    console.error("Error en el upstream:", error);
    return new Response(JSON.stringify({ error: "Servicio no disponible" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

---

## 6. Timeouts (Tiempos de espera)

La API `fetch()` en el Azion Runtime soporta `AbortController` y `AbortSignal`, que puede usar para imponer un tiempo de espera en las solicitudes salientes.

```js
const fetchWithTimeout = async (url, options = {}, timeoutMs = 5000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(
        `La solicitud a ${url} superó el tiempo de espera después de ${timeoutMs}ms`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

addEventListener("fetch", (event) => {
  event.respondWith(
    fetchWithTimeout("https://slow-api.example.com/data", {}, 3000)
      .then((res) => res.json())
      .then(
        (data) =>
          new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
          }),
      )
      .catch((err) => new Response(err.message, { status: 504 })),
  );
});
```

---

## 7. Almacenamiento en Caché de Respuestas de APIs Externas

Si la API externa que está llamando devuelve datos que no cambian con frecuencia, almacenar la respuesta en caché en el borde reduce drásticamente la latencia y el número de subsolicitudes que realiza.

El Azion Runtime soporta la [API de Cache](https://developer.mozilla.org/es/docs/Web/API/Cache) estándar. Aquí hay un patrón simple de cache-aside:

```js
const CACHE_NAME = "external-api-cache";

const handleRequest = async (request, args) => {
  const cacheUrl = `https://cache-key.internal/weather`;
  const cache = await caches.open(CACHE_NAME);

  // Comprobar la caché primero
  const cached = await cache.match(cacheUrl);
  if (cached) {
    return cached;
  }

  // Obtener del origen
  const res = await fetch(`${args.WEATHER_API}/current?city=sao-paulo`, {
    headers: { "X-API-Key": args.WEATHER_API_KEY },
  });

  if (!res.ok) {
    return new Response("Servicio de clima no disponible", { status: 502 });
  }

  // Clonar la respuesta antes de almacenarla en caché (solo se puede consumir una vez)
  const responseToCache = res.clone();
  await cache.put(cacheUrl, responseToCache);

  return res;
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

:::tip Invalidación de caché
La API de Cache almacena entradas por nodo de borde. Cada punto de presencia mantiene su propia caché. Si necesita una invalidación global y coordinada, considere usar **Azion KV Storage** para almacenar valores en caché con TTLs explícitos.
:::
