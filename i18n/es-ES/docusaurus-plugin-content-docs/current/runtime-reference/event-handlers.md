---
title: Manejadores de Eventos
sidebar_position: 2
description: Manejadores de eventos disponibles en el runtime de Azion Edge Functions.
---

# Manejadores de Eventos

Las Edge Functions se basan en eventos. Su código no se ejecuta en un bucle de servidor — se ejecuta en respuesta a un evento emitido por el Runtime de Azion cuando llega una solicitud. Esta página cubre el modelo de eventos, los tipos de eventos disponibles y los métodos que exponen.

---

## 1. `addEventListener`

Todas las Edge Functions registran un listener utilizando la función global `addEventListener`:

```js
addEventListener(type, handler);
```

| Parámetro | Descripción                                            |
| --------- | ------------------------------------------------------ |
| `type`    | La cadena del tipo de evento: `"fetch"` o `"firewall"` |
| `handler` | Una función que recibe el objeto del evento            |

Solo puede registrar **un listener por cada tipo de evento**. Llamar a `addEventListener` una segunda vez con el mismo tipo sobrescribe el primer registro.

---

## 2. El Evento Fetch

Las funciones desplegadas en una **Edge Application** responden a eventos `fetch`. Este es el tipo de evento más común — cada solicitud HTTP entrante activa un evento fetch.

```js
addEventListener("fetch", (event) => {
  event.respondWith(new Response("OK"));
});
```

### Miembros de `FetchEvent`

| Miembro                       | Tipo      | Descripción                                                                      |
| ----------------------------- | --------- | -------------------------------------------------------------------------------- |
| `event.request`               | `Request` | La solicitud HTTP entrante                                                       |
| `event.args`                  | `object`  | Argumentos JSON de la configuración de la Instancia de Función                   |
| `event.respondWith(response)` | `void`    | Establece la respuesta que se devolverá al cliente                               |
| `event.waitUntil(promise)`    | `void`    | Programa una tarea en segundo plano que se ejecuta tras el envío de la respuesta |

### `event.request`

Un objeto estándar [`Request` de la API Web](https://developer.mozilla.org/es/docs/Web/API/Request) que representa la solicitud HTTP entrante. Puede leer la URL, el método, las cabeceras y el cuerpo del mismo.

```js
addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const method = request.method;

  console.log(`${method} ${url.pathname}`);

  event.respondWith(new Response("registrado"));
});
```

### `event.args`

El objeto JSON configurado en la pestaña **Arguments** de la Instancia de Función. Es el método recomendado para inyectar configuración en una función sin codificar valores en el código.

```js
addEventListener("fetch", (event) => {
  const { targetOrigin } = event.args;

  event.respondWith(
    fetch(`${targetOrigin}${new URL(event.request.url).pathname}`),
  );
});
```

### `event.respondWith(response)`

`respondWith` acepta tanto un objeto `Response` como una `Promise<Response>`. Debe llamarse **síncronamente** dentro del manejador de eventos — no puede posponerse tras un límite de `await`:

```js
// ✅ Correcto — respondWith se llama de forma síncrona, recibe una Promise
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});

// ✅ También correcto — respondWith se llama directamente con una Response
addEventListener("fetch", (event) => {
  event.respondWith(new Response("Hola"));
});
```

```js
// ❌ Incorrecto — respondWith se llama dentro de un callback asíncrono
addEventListener("fetch", async (event) => {
  const data = await fetch("https://api.example.com");
  event.respondWith(new Response(await data.text())); // Demasiado tarde
});
```

### `event.waitUntil(promise)`

`waitUntil` programa tareas para que sigan ejecutándose después de que la respuesta haya sido entregada al cliente. Utilícelo para efectos secundarios de tipo "disparar y olvidar": analítica, registro de auditoría, calentamiento de caché.

```js
addEventListener("fetch", (event) => {
  const response = new Response("OK");

  event.waitUntil(
    fetch("https://logger.example.com/hit", {
      method: "POST",
      body: JSON.stringify({ url: event.request.url }),
    }),
  );

  event.respondWith(response);
});
```

:::tip
`waitUntil` no afecta a la respuesta que recibe el usuario — solo extiende la vida útil de la función. El presupuesto de tiempo total para las tareas en segundo plano se contabiliza dentro del límite total de tiempo de ejecución de la función.
:::

---

## 3. El Evento Firewall

Las funciones desplegadas en un **Edge Firewall** responden a eventos `firewall`. Estas funciones se ejecutan en la capa de seguridad, antes de que la solicitud llegue a la Edge Application.

```js
addEventListener("firewall", (event) => {
  const ip = event.request.headers.get("X-Forwarded-For");

  if (isBannedIP(ip)) {
    event.deny();
    return;
  }

  event.continue();
});
```

### Miembros de `FirewallEvent`

| Miembro                       | Tipo      | Descripción                                                    |
| ----------------------------- | --------- | -------------------------------------------------------------- |
| `event.request`               | `Request` | La solicitud HTTP entrante                                     |
| `event.args`                  | `object`  | Argumentos JSON de la configuración de la Instancia de Función |
| `event.deny()`                | `void`    | Rechaza la solicitud (devuelve `403 Forbidden`)                |
| `event.drop()`                | `void`    | Corta la conexión sin enviar respuesta                         |
| `event.continue()`            | `void`    | Pasa la solicitud a la siguiente etapa de procesamiento        |
| `event.respondWith(response)` | `void`    | Devuelve una respuesta personalizada, omitiendo el origen      |
| `event.waitUntil(promise)`    | `void`    | Programa una tarea en segundo plano                            |

### Opciones de respuesta de Firewall

Una función de firewall **debe** llamar exactamente a uno de los métodos `deny()`, `drop()`, `continue()` o `respondWith()` para finalizar el evento. No hacerlo deja la solicitud sin resolver.

| Acción                   | Efecto                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `event.deny()`           | Devuelve HTTP `403 Forbidden` al cliente                                                             |
| `event.drop()`           | Cierra la conexión sin respuesta                                                                     |
| `event.continue()`       | Pasa la solicitud a la Edge Application                                                              |
| `event.respondWith(res)` | Devuelve una respuesta personalizada — permite listas blancas, redirecciones o respuestas sintéticas |

```js
addEventListener("firewall", (event) => {
  const token = event.request.headers.get("X-Auth-Token");

  if (!token || !isValidToken(token, event.args.SECRET)) {
    // Devolver un 401 con un cuerpo personalizado
    event.respondWith(
      new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );
    return;
  }

  event.continue();
});
```

---

## 4. Elección del Tipo de Evento Adecuado

| Objetivo                                                           | Tipo de evento       | Ubicación                   |
| ------------------------------------------------------------------ | -------------------- | --------------------------- |
| Manejar solicitudes HTTP, tráfico de proxy, transformar respuestas | `fetch`              | Edge Application            |
| Redirigir o reescribir URLs                                        | `fetch`              | Edge Application            |
| Autenticar o autorizar solicitudes                                 | `fetch` o `firewall` | Edge Application o Firewall |
| Bloquear o limitar el tráfico                                      | `firewall`           | Edge Firewall               |
| Detección y mitigación de bots                                     | `firewall`           | Edge Firewall               |
| Verificación de firmas personalizadas                              | `firewall`           | Edge Firewall               |

---

## Relacionado

- [Estructura de la Función](../development/function-structure.md) — cómo escribir una función completa desde cero.
- [Modelo de Ejecución](./execution-model.md) — cómo se despachan y ejecutan los eventos.
- [Las Funciones en la Arquitectura de la Plataforma](../platform-integration/functions-in-platform-architecture.md) — cómo encajan los eventos `fetch` y `firewall` en la plataforma.
