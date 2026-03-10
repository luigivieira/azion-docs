---
title: Optimización del Rendimiento
sidebar_position: 3
description: Consejos y técnicas para optimizar el rendimiento de las Azion Edge Functions.
---

# Optimización del Rendimiento

Las Edge Functions están diseñadas para una ejecución de baja latencia. Sin embargo, varios patrones comunes pueden añadir una sobrecarga innecesaria — desde el tiempo de arranque en frío hasta la latencia de las subsolicitudes. Esta página cubre las optimizaciones más efectivas.

---

## 1. Minimizar el Tiempo de Arranque en Frío

Un arranque en frío (cold start) ocurre la primera vez que se invoca una función en un nodo de borde (o después de un periodo de inactividad). El runtime debe inicializar un nuevo isolate y ejecutar todo el código a nivel de módulo antes de manejar la solicitud.

**Mantenga el código a nivel de módulo mínimo y rápido:**

```js
// ✅ Rápido — inicialización simple de constantes
const ALLOWED_ORIGINS = new Set(["https://app.example.com"]);

// ❌ Lento — parsear un blob JSON grande al inicio
const HUGE_CONFIG = JSON.parse(GIANT_JSON_STRING); // posponga esto si es posible
```

**Difiera la inicialización pesada a la primera solicitud si depende de ella:**

```js
let client = null;

const getClient = (args) => {
  if (!client) {
    client = new SomeClient(args.API_KEY);
  }
  return client;
};

addEventListener("fetch", (event) => {
  const c = getClient(event.args);
  event.respondWith(c.handle(event.request));
});
```

---

## 2. Reducir el Tamaño del Código

Las funciones más grandes tardan más en parsearse y compilarse durante un arranque en frío. Mantenga el código de su función ligero:

- **Elimine el código no utilizado.** El código muerto todavía se parsea.
- **Empaquete y elimine el código muerto (tree-shaking) de las dependencias.** Si utiliza un bundler (esbuild, Rollup), habilite el tree-shaking para eliminar las exportaciones no utilizadas.
- **Evite incluir librerías enteras para casos de uso pequeños.** Implemente la utilidad de 5 líneas en lugar de importar una librería de 200 KB.

Para comprobar el tamaño de su salida compilada:

```bash
esbuild src/function.js --bundle --minify --outfile=dist/function.js
wc -c dist/function.js
```

Consulte [Límites](../limits.md) para conocer el límite de tamaño de código.

---

## 3. Paralelizar Subsolicitudes

Cada llamada `fetch()` a un servicio externo añade latencia. Cuando necesite múltiples piezas de datos independientes, obténgalas en paralelo usando `Promise.all()`:

```js
// ❌ Secuencial — tiempo total ≈ suma de todos los tiempos de solicitud
const user = await fetch(`${args.API}/user/${userId}`).then((r) => r.json());
const prefs = await fetch(`${args.API}/prefs/${userId}`).then((r) => r.json());
const cart = await fetch(`${args.API}/cart/${userId}`).then((r) => r.json());

// ✅ Paralelo — tiempo total ≈ máximo de todos los tiempos de solicitud
const [user, prefs, cart] = await Promise.all([
  fetch(`${args.API}/user/${userId}`).then((r) => r.json()),
  fetch(`${args.API}/prefs/${userId}`).then((r) => r.json()),
  fetch(`${args.API}/cart/${userId}`).then((r) => r.json()),
]);
```

Si algunas solicitudes dependen del resultado de una solicitud anterior, agrupe las independientes en lotes paralelos:

```js
// Primer lote: obtener usuario y sesión (independientes)
const [user, session] = await Promise.all([
  fetch(`${args.API}/user/${userId}`).then((r) => r.json()),
  fetch(`${args.API}/session/${sessionId}`).then((r) => r.json()),
]);

// Segundo lote: usar los resultados del primer lote
const [profile, permissions] = await Promise.all([
  fetch(`${args.API}/profile/${user.profileId}`).then((r) => r.json()),
  fetch(`${args.API}/permissions/${session.roleId}`).then((r) => r.json()),
]);
```

---

## 4. Almacenar en Caché las Respuestas de Upstream

Si una API externa devuelve datos que no cambian en cada solicitud, almacene la respuesta en caché en el borde utilizando la API de Cache. Esto elimina la latencia de las subsolicitudes para las solicitudes subsiguientes manejadas por el mismo nodo de borde.

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

:::info Ámbito de la caché
La API de Cache es por nodo de borde. La caché no se comparte entre los puntos de presencia. La primera solicitud a cada nodo seguirá llegando a su upstream — la carga de la caché ocurre por nodo.
:::

---

## 5. Transmitir Respuestas (Streaming)

Para respuestas grandes o de larga duración, la transmisión (streaming) permite al navegador comenzar a recibir y renderizar contenido antes de que el cuerpo completo esté listo — reduciendo significativamente la latencia percibida.

```js
addEventListener("fetch", (event) => {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Comenzar a transmitir la respuesta inmediatamente
  event.respondWith(
    new Response(readable, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }),
  );

  // Escribir contenido de forma asíncrona
  event.waitUntil(
    (async () => {
      const encoder = new TextEncoder();
      writer.write(encoder.encode("<html><body>"));

      const data = await fetch("https://api.example.com/items").then((r) =>
        r.json(),
      );
      for (const item of data.items) {
        writer.write(encoder.encode(`<p>${item.title}</p>`));
      }

      writer.write(encoder.encode("</body></html>"));
      writer.close();
    })(),
  );
});
```

---

## 6. Usar `event.waitUntil` para Efectos Secundarios

El envío de logs, el análisis y el calentamiento de la caché no deberían bloquear la respuesta. Use `event.waitUntil()` para ejecutar estos procesos después de enviar la respuesta:

```js
addEventListener("fetch", (event) => {
  const response = handleRequest(event.request, event.args);

  // No retrasa la respuesta
  event.waitUntil(logRequest(event.request.url, event.request.method));

  event.respondWith(response);
});
```

---

## 7. Evitar la Serialización JSON Innecesaria

Parsear y serializar JSON no es gratuito — especialmente para objetos grandes. Algunos patrones a evitar:

```js
// ❌ Viaje de ida y vuelta innecesario: parsear y luego serializar los mismos datos
const data = await fetch(url).then((r) => r.json());
return new Response(JSON.stringify(data), {
  headers: { "Content-Type": "application/json" },
});

// ✅ Pasar el cuerpo de la respuesta sin procesar si no necesita transformarlo
const upstream = await fetch(url);
return new Response(upstream.body, {
  status: upstream.status,
  headers: upstream.headers,
});
```

Solo parsee el JSON si realmente necesita leer o modificar los datos.

---

## 8. Establecer Timeouts Explícitos en las Subsolicitudes

Las subsolicitudes que se cuelgan consumen el presupuesto de tiempo de su función. Establezca siempre un tiempo de espera en las llamadas `fetch()` salientes a servicios externos:

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

Un tiempo de espera de 3 a 5 segundos es un punto de partida razonable. Ajústelo según el SLA del servicio upstream.

---

## 9. Medir Antes de Optimizar

Antes de invertir en optimización, mida a dónde va realmente el tiempo. Use `Date.now()` o `performance.now()` para instrumentar su función:

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

Revise la salida de tiempo en **Real-Time Events** para encontrar el cuello de botella real antes de cambiar el código.

---

## Relacionado

- [Modelo de Ejecución](../runtime-reference/execution-model.md) — arranques en frío, isolates calientes y presupuestos de tiempo.
- [Llamada a APIs Externas](../development/calling-external-apis.md) — patrones de caché y fetch paralelo.
- [Límites](../limits.md) — límites de tiempo de CPU y memoria.
