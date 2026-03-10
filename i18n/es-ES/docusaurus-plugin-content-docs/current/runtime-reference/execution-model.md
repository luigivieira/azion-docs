---
title: Modelo de Ejecución
sidebar_position: 4
description: Cómo se ejecutan las Azion Edge Functions en la red de borde (edge network).
---

# Modelo de Ejecución

Entender cómo el runtime ejecuta su función le ayuda a escribir código que sea eficiente, predecible y libre de errores comunes relacionados con la concurrencia, el estado y los tiempos.

---

## 1. Ejecución Impulsada por Solicitudes (Request-Driven)

Las Edge Functions no son servidores de larga duración. Se ejecutan **bajo demanda**, una vez por cada solicitud coincidente, y se espera que devuelvan una respuesta dentro de un presupuesto de tiempo limitado.

El ciclo de vida de una sola invocación es:

1. Llega una solicitud a un nodo de borde de Azion.
2. El Rules Engine evalúa los criterios y determina que debe ejecutarse una Instancia de Función.
3. El runtime despacha un evento `fetch` (o `firewall`) a su listener.
4. Su manejador se ejecuta y llama a `event.respondWith(...)`.
5. Se devuelve la respuesta al cliente.
6. Cualquier tarea programada vía `event.waitUntil(...)` continúa ejecutándose hasta que finaliza o se agota el presupuesto de tiempo.

---

## 2. Concurrencia

El Runtime de Azion maneja solicitudes concurrentes utilizando **V8 isolates** — contextos de ejecución ligeros que están aislados entre sí. Un solo nodo de borde puede ejecutar muchos isolates simultáneamente, pero cada isolate maneja **un evento a la vez**.

Dentro del código de su función, la concurrencia es cooperativa y se basa en el modelo asíncrono de un solo hilo de JavaScript:

- `await` cede el control al bucle de eventos (event loop), permitiendo que procedan otras microtareas.
- Se pueden realizar múltiples llamadas `fetch()` concurrentemente usando `Promise.all()`.
- No hay hilos (threads), hilos de trabajo (worker threads) ni memoria compartida entre invocaciones.

```js
// Subsolicitudes concurrentes — ambas llamadas fetch comienzan simultáneamente
const [usersRes, statsRes] = await Promise.all([
  fetch("https://api.example.com/users"),
  fetch("https://api.example.com/stats"),
]);
```

---

## 3. Arranques en Frío e Isolates Calientes

Cuando se invoca una función en un nodo de borde por primera vez, el runtime debe inicializar un nuevo isolate, compilar el código de la función y ejecutar cualquier código de configuración a nivel de módulo. Esto se denomina **arranque en frío (cold start)**.

Después de la primera invocación, el runtime puede **reutilizar el mismo isolate** para solicitudes posteriores. Esta es una ejecución en caliente (warm execution) — no hay sobrecarga de inicialización y las variables a nivel de módulo conservan sus valores de la invocación anterior.

Consecuencias prácticas:

- **La inicialización a nivel de módulo se ejecuta una sola vez**, no en cada solicitud. Utilice esto para trabajos que sean costosos de repetir — parseo de configuración, creación de tablas de búsqueda, etc.
- **El estado mutable a nivel de módulo persiste entre solicitudes** dentro del mismo isolate caliente. Evite almacenar datos específicos de una solicitud en variables globales.
- **La latencia del arranque en frío** es proporcional al tamaño y la complejidad de su código. Mantenga su función pequeña y evite rutinas de inicialización extensas.

```js
// Esto se ejecuta una vez por vida útil de isolate, no por solicitud
const config = JSON.parse(JSON.stringify(hardcodedDefaults));

addEventListener("fetch", (event) => {
  // Esto se ejecuta una vez por solicitud
  event.respondWith(handle(event.request, event.args, config));
});
```

---

## 4. Ejecución Asíncrona y el Bucle de Eventos

Las Edge Functions utilizan un bucle de eventos (event loop) estándar de JavaScript. Las operaciones asíncronas — `fetch()`, `crypto.subtle`, temporizadores — son no bloqueantes. El runtime las programa y reanuda su manejador cuando los resultados están listos.

El propio manejador de la función puede ser `async`, y `event.respondWith()` puede recibir una `Promise<Response>`:

```js
const handleRequest = async (request, args) => {
  const data = await fetch("https://api.example.com/resource").then((r) =>
    r.json(),
  );
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

`event.respondWith()` debe llamarse **síncronamente** en el manejador de eventos — no puede llamarse después de un `await`. El patrón anterior funciona porque se pasa una `Promise`, no porque se llame a `respondWith` tras una espera.

---

## 5. Tareas en Segundo Plano

`event.waitUntil(promise)` extiende el tiempo de ejecución de la función para permitir que se complete el trabajo en segundo plano después de que se haya enviado la respuesta. El runtime no terminará el isolate hasta que todas las promesas de `waitUntil` se hayan resuelto (o se alcance el límite de tiempo de ejecución).

```js
addEventListener("fetch", (event) => {
  const response = handleRequest(event.request, event.args);

  // Esto se ejecuta después de que se entrega la respuesta
  event.waitUntil(
    fetch("https://analytics.example.com/collect", {
      method: "POST",
      body: JSON.stringify({ url: event.request.url, ts: Date.now() }),
    }),
  );

  event.respondWith(response);
});
```

Las tareas en segundo plano consumen tiempo del presupuesto general de ejecución de la función. Si una tarea en segundo plano tarda demasiado, es terminada por el runtime.

---

## 6. Manejo de Errores

Si su función lanza una excepción no controlada, el runtime la captura y devuelve una respuesta HTTP `500` al cliente. Los detalles del error se capturan y aparecen en **Real-Time Events** bajo la fuente de datos **Functions Console** con un `LINE_SOURCE` de `RUNTIME`.

La mejor práctica es envolver la lógica de su manejador en un bloque try/catch y devolver una respuesta de error significativa:

```js
const handleRequest = async (request, args) => {
  try {
    const res = await fetch(`${args.API_BASE}/resource`);

    if (!res.ok) throw new Error(`Error del upstream: ${res.status}`);

    return new Response(await res.text());
  } catch (err) {
    console.error("Error del manejador:", err.message);
    return new Response("Internal Server Error", { status: 500 });
  }
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

---

## 7. Tiempo de Ejecución

Cada invocación de función tiene un **presupuesto de tiempo de CPU** — la cantidad de tiempo de computación real que la función puede consumir. El tiempo de espera para respuestas de `fetch()`, temporizadores u otra E/S no computa contra el presupuesto de CPU, pero el **tiempo de reloj total** (tiempo transcurrido desde el inicio de la invocación hasta la respuesta) también está limitado.

Si su función excede sus límites de tiempo:

- Se termina la invocación.
- El cliente recibe una respuesta de error.
- La terminación se registra y es visible en Real-Time Events.

Consulte [Límites](../limits.md) para conocer los presupuestos de tiempo específicos que se aplican a su plan.

---

## Relacionado

- [Entorno de Runtime](./runtime-environment.md) — modelo de isolate, globales y estado.
- [Límites](../limits.md) — límites de tiempo de CPU, memoria y subsolicitudes.
- [Optimización del Rendimiento](../advanced/performance-optimization.md) — técnicas para reducir el tiempo de arranque en frío y la sobrecarga de ejecución.
