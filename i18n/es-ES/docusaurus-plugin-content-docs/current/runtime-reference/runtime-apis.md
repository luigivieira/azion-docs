---
title: APIs del Runtime
sidebar_position: 1
description: APIs Web disponibles en el runtime de Azion Edge Functions.
---

# APIs del Runtime

El Runtime de Azion es un entorno JavaScript basado en el **estándar de las APIs Web**. No expone las funciones integradas de Node.js, pero implementa un amplio conjunto de APIs compatibles con el navegador que cubren la gran mayoría de los casos de uso en el borde (edge).

Esta página es una referencia de las APIs disponibles para sus funciones.

---

## Fetch API

La API Fetch es el mecanismo principal para realizar solicitudes HTTP — tanto para responder a solicitudes entrantes como para realizar subsolicitudes salientes.

### `fetch(input, init?)`

Realiza una solicitud HTTP saliente. Devuelve una `Promise<Response>`.

```js
const res = await fetch("https://api.example.com/data", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ key: "value" }),
});

const data = await res.json();
```

### `Request`

Representa una solicitud HTTP. Se construye manualmente o se recibe a través de `event.request`.

```js
const req = new Request("https://example.com/path", {
  method: "GET",
  headers: new Headers({ Accept: "application/json" }),
});
```

Propiedades y métodos clave:

| Miembro                 | Tipo                     | Descripción                                           |
| ----------------------- | ------------------------ | ----------------------------------------------------- |
| `request.url`           | `string`                 | URL completa de la solicitud                          |
| `request.method`        | `string`                 | Método HTTP (`GET`, `POST`, etc.)                     |
| `request.headers`       | `Headers`                | Cabeceras de la solicitud                             |
| `request.body`          | `ReadableStream \| null` | Cuerpo de la solicitud como un flujo (stream)         |
| `request.json()`        | `Promise<any>`           | Parsea el cuerpo como JSON                            |
| `request.text()`        | `Promise<string>`        | Parsea el cuerpo como texto                           |
| `request.arrayBuffer()` | `Promise<ArrayBuffer>`   | Parsea el cuerpo como binario                         |
| `request.formData()`    | `Promise<FormData>`      | Parsea el cuerpo como datos de formulario             |
| `request.clone()`       | `Request`                | Crea una copia (el cuerpo solo se puede leer una vez) |

### `Response`

Representa una respuesta HTTP.

```js
// Respuesta de texto plano
new Response("Hola", { status: 200 });

// Respuesta JSON
new Response(JSON.stringify({ ok: true }), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});

// Redirección
Response.redirect("https://new.example.com/path", 301);
```

Métodos estáticos clave:

| Método                           | Descripción                                                        |
| -------------------------------- | ------------------------------------------------------------------ |
| `Response.redirect(url, status)` | Crea una respuesta de redirección                                  |
| `Response.error()`               | Crea una respuesta de error de red                                 |
| `Response.json(data, init?)`     | Crea una respuesta JSON (establece `Content-Type` automáticamente) |

### `Headers`

Un mapa mutable e insesible a mayúsculas/minúsculas de cabeceras HTTP.

```js
const headers = new Headers({
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
});

headers.set("X-Custom", "valor");
headers.get("content-type"); // "application/json"
headers.has("X-Custom"); // true
headers.delete("Cache-Control");
```

---

## URL API

### `URL`

Parsea y construye URLs. Se prefiere al manejo de URLs mediante manipulación de cadenas.

```js
const url = new URL(event.request.url);

url.pathname; // "/api/items"
url.searchParams.get("page"); // "2"
url.origin; // "https://example.com"
```

### `URLSearchParams`

Maneja las cadenas de consulta (query strings) de las URLs.

```js
const params = new URLSearchParams("page=2&limit=10");
params.get("page"); // "2"
params.set("limit", "20");
params.toString(); // "page=2&limit=20"
```

---

## Encoding APIs

### `TextEncoder` / `TextDecoder`

Convierten entre cadenas y `Uint8Array` (UTF-8).

```js
const encoder = new TextEncoder();
const bytes = encoder.encode("¡Hola, edge!");
// Uint8Array

const decoder = new TextDecoder();
const text = decoder.decode(bytes);
// "¡Hola, edge!"
```

### `atob()` / `btoa()`

Codifican y decodifican cadenas en Base64.

```js
const encoded = btoa("usuario:contraseña"); // "dXN1YXJpbzpjb250cmFzZcOxYQ=="
const decoded = atob(encoded); // "usuario:contraseña"
```

:::tip Datos binarios
Para datos binarios arbitrarios, use `TextEncoder` y `Uint8Array`. `atob`/`btoa` están limitados a caracteres Latin-1 y lanzarán un error con valores fuera de ese rango.
:::

---

## Streams API

La API de Streams permite manejar respuestas grandes o en streaming sin cargar todo el cuerpo en memoria.

### `ReadableStream`

```js
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode("bloque 1"));
    controller.enqueue(new TextEncoder().encode("bloque 2"));
    controller.close();
  },
});

return new Response(stream, {
  headers: { "Content-Type": "text/plain" },
});
```

### `TransformStream`

Transforma los datos mientras fluyen a través de una cadena de tuberías (pipe chain). Útil para modificar un cuerpo de respuesta sobre la marcha sin almacenar el contenido completo en un buffer.

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

La API Cache almacena y recupera pares `Request`/`Response` a nivel de nodo de borde.

```js
const cache = await caches.open("mi-cache");

// Almacenar una respuesta
await cache.put(request, response.clone());

// Recuperar una respuesta cacheada
const cached = await cache.match(request);
if (cached) return cached;

// Eliminar una entrada de la caché
await cache.delete(request);
```

:::info Caché local al nodo
Cada nodo de borde mantiene su propia caché. Las entradas no se replican entre los distintos puntos de presencia. Para un estado compartido globalmente consistente o de larga duración, use **Azion KV Storage**.
:::

---

## Web Crypto API

Operaciones criptográficas a través del global `crypto`.

### Generación de valores aleatorios

```js
const buffer = new Uint8Array(16);
crypto.getRandomValues(buffer);
// el buffer se llena con bytes aleatorios criptográficamente seguros
```

### `crypto.randomUUID()`

```js
const id = crypto.randomUUID();
// "550e8400-e29b-41d4-a716-446655440000"
```

### `crypto.subtle`

Para firmas HMAC, cifrado AES, hashing SHA y derivación de claves:

```js
// Hash SHA-256 de una cadena
const msgBuffer = new TextEncoder().encode("hola");
const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
```

```js
// Verificar una firma HMAC-SHA256 de una cabecera de solicitud
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(event.args.SECRET_KEY),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["verify"],
);

const signatureHex = event.request.headers.get("X-Signature") ?? "";
const signatureBytes = new Uint8Array(
  signatureHex.match(/.{2}/g).map((b) => parseInt(b, 16)),
);
const body = await event.request.arrayBuffer();

const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, body);
```

---

## Temporizadores

Los globales de temporizadores estándar están disponibles.

```js
// Pausar la ejecución durante un tiempo determinado
await new Promise((resolve) => setTimeout(resolve, 100));

// Ejecutar lógica después de un retraso
const id = setTimeout(() => console.log("disparado"), 500);
clearTimeout(id);
```

`setInterval` está disponible pero raramente es útil en un contexto de solicitud-respuesta, ya que la ejecución finaliza cuando se entrega la respuesta.

---

## `AbortController` / `AbortSignal`

Se utiliza para cancelar llamadas `fetch()` en curso — lo más común es para forzar tiempos de espera (timeouts) de solicitud.

```js
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 5000);

try {
  const res = await fetch("https://api-lenta.example.com", {
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

Los cuatro niveles de log estándar están soportados y son capturados por el runtime:

```js
console.log("salida general");
console.info("evento significativo");
console.warn("anomalía no fatal");
console.error("condición de fallo");
```

La salida está disponible en **Real-Time Events** bajo la fuente de datos **Functions Console**. Consulte [Logs](../observability/logs.md) para más detalles.

---

## APIs No Disponibles

Las siguientes **no** están disponibles en el Runtime de Azion:

| No disponible                                        | Alternativa                                             |
| ---------------------------------------------------- | ------------------------------------------------------- |
| Integrados de Node.js (`fs`, `path`, `net`, `os`, …) | Use APIs Web o servicios HTTP externos                  |
| `require()` / Módulos CommonJS                       | Empaquete su código o use sintaxis nativa de módulos ES |
| `process.env`                                        | Use `event.args` for configuration values               |
| `WebSocket` (iniciado por servidor)                  | No soportado actualmente                                |
| `XMLHttpRequest`                                     | Use `fetch()`                                           |
| `document`, `window`, APIs del DOM                   | No aplicables en un runtime de lado del servidor        |

---

## Relacionado

- [Entorno de Runtime](./runtime-environment.md) — el contexto completo en el que se ejecuta su función.
- [Manejadores de Eventos](./event-handlers.md) — cómo funcionan `addEventListener` y el modelo de eventos.
- [Llamada a APIs Externas](../development/calling-external-apis.md) — guía práctica para `fetch()` saliente.
