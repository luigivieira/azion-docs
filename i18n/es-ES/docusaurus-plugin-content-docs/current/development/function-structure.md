---
title: Estructura de la Función
sidebar_position: 1
description: La estructura y anatomía de una Azion Edge Function.
---

# Estructura de la Función

Cada Azion Edge Function sigue un patrón consistente construido alrededor del modelo **Fetch Event**. Comprender esta estructura es la base para escribir cualquier Edge Function — desde simples redirecciones hasta integraciones complejas de API.

---

## 1. La Función Mínima

La Edge Function más pequeña posible se ve así:

```js
addEventListener("fetch", (event) => {
  event.respondWith(new Response("¡Hola, mundo!"));
});
```

Aquí están sucediendo tres cosas:

1. **`addEventListener("fetch", ...)`** — registra un listener para las solicitudes HTTP entrantes.
2. **`event.respondWith(...)`** — le indica al runtime qué respuesta enviar de vuelta al cliente.
3. **`new Response(...)`** — construye la respuesta HTTP.

---

## 2. El Objeto `FetchEvent`

Cuando llega una solicitud, el runtime llama a su listener con un objeto `FetchEvent`. Expone dos miembros clave:

| Miembro         | Tipo      | Descripción                                                  |
| --------------- | --------- | ------------------------------------------------------------ |
| `event.request` | `Request` | La solicitud HTTP entrante (URL, método, cabeceras, cuerpo). |
| `event.args`    | `object`  | Argumentos JSON configurados en la Instancia de Función.     |

### `event.request`

Este es un objeto estándar de la [API Web `Request`](https://developer.mozilla.org/es/docs/Web/API/Request). Puede leer la URL, el método, las cabeceras y el cuerpo del mismo.

```js
addEventListener("fetch", (event) => {
  const { request } = event;

  const url = new URL(request.url);
  const method = request.method;

  event.respondWith(new Response(`${method} ${url.pathname}`));
});
```

### `event.args`

`event.args` contiene el objeto JSON que configura en la pestaña **Arguments** de una Instancia de Función. Es la forma principal de pasar valores de configuración a una función sin codificarlos.

```js
addEventListener("fetch", (event) => {
  const { args } = event;

  const greeting = args.greeting ?? "Hola";
  const name = args.name ?? "Mundo";

  event.respondWith(new Response(`${greeting}, ${name}!`));
});
```

En la configuración de la Instancia de Función, establecería:

```json
{
  "greeting": "Hola",
  "name": "Azion"
}
```

---

## 3. Manejadores Asíncronos (Async Handlers)

La mayoría de las funciones del mundo real realizan operaciones asíncronas como `fetch()`. El patrón recomendado es extraer la lógica en una función manejadora `async`:

```js
const handleRequest = async (request, args) => {
  // ... su lógica aquí
  return new Response("Hecho");
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

El método `event.respondWith()` acepta un objeto `Response` o una `Promise<Response>`, por lo que pasar la promesa devuelta por una función `async` funciona correctamente.

---

## 4. Tareas en Segundo Plano con `event.waitUntil()`

A veces necesita realizar un trabajo que no debería retrasar la respuesta — como enviar telemetría, actualizar una caché o registrar en un servicio externo.

`event.waitUntil()` le permite iniciar una tarea en segundo plano que continúa ejecutándose **después** de que se haya enviado la respuesta al cliente.

```js
const logToExternalService = async (data) => {
  await fetch("https://my-logging-service.example.com/log", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", (event) => {
  const response = new Response("OK");

  // Disparar y olvidar — esto se ejecuta después de que se entrega la respuesta
  event.waitUntil(logToExternalService({ url: event.request.url }));

  event.respondWith(response);
});
```

:::tip Cuándo usar `waitUntil`
Use `waitUntil` para efectos secundarios que no cambian la respuesta: análisis, calentamiento de caché, logs de auditoría. Evítelo para la lógica que el usuario necesita ver en la respuesta.
:::

---

## 5. TypeScript

Las funciones también se pueden escribir en TypeScript. El runtime de Azion no ejecuta TypeScript directamente — debe transpilarlo a JavaScript antes de guardarlo a través de la consola o desplegarlo a través de la CLI.

Una versión tipada de la función mínima:

```ts
interface Args {
  greeting?: string;
}

const handleRequest = async (
  request: Request,
  args: Args,
): Promise<Response> => {
  const greeting = args.greeting ?? "Hola";
  return new Response(`${greeting} desde el borde!`);
};

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(handleRequest(event.request, (event as any).args));
});
```

---

## 6. Poniéndolo Todo Junto

Aquí hay un ejemplo completo que combina todos los conceptos anteriores:

```js
const handleRequest = async (request, args) => {
  const url = new URL(request.url);
  const target = args.targetOrigin ?? "https://example.com";

  // Proxy de la solicitud al origen configurado
  const originResponse = await fetch(`${target}${url.pathname}${url.search}`);

  return new Response(originResponse.body, {
    status: originResponse.status,
    headers: originResponse.headers,
  });
};

addEventListener("fetch", (event) => {
  // En segundo plano: registrar cada solicitud
  event.waitUntil(
    fetch("https://logger.example.com/hit", {
      method: "POST",
      body: JSON.stringify({ path: new URL(event.request.url).pathname }),
    }),
  );

  event.respondWith(handleRequest(event.request, event.args));
});
```
