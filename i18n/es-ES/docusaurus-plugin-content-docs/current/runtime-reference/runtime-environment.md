---
title: Entorno de Runtime
sidebar_position: 5
description: El entorno de ejecución para Azion Edge Functions.
---

# Entorno de Runtime

Entender el entorno en el que se ejecuta su función le ayuda a escribir código que sea correcto, eficiente y libre de suposiciones heredadas de los entornos Node.js o del navegador.

---

## 1. Qué es el Runtime de Azion

El Runtime de Azion es un **motor JavaScript** basado en V8 — el mismo motor que impulsa Chrome y Node.js. Sin embargo, no es Node.js. El runtime expone un subconjunto del [estándar de las APIs Web](https://developer.mozilla.org/es/docs/Web/API), no la biblioteca estándar de Node.js.

Esto significa que:

- Usted escribe JavaScript estándar (ES2020+) o TypeScript (compilado a JS antes del despliegue).
- APIs de estilo navegador como `fetch`, `Request`, `Response`, `URL`, `TextEncoder` y `crypto` están disponibles.
- APIs de Node.js como `fs`, `path`, `net`, `process`, `Buffer` y `require()` **no** están disponibles.
- El DOM no está disponible — no existe `document`, `window` o `navigator`.

El objetivo del diseño es la **portabilidad entre entornos de borde** y la compatibilidad con el estándar emergente [WinterCG](https://wintercg.org/) para runtimes JavaScript de lado del servidor.

---

## 2. Soporte de JavaScript

El runtime soporta JavaScript moderno. Puede usar:

- `async` / `await`
- `Promise`, `Promise.all`, `Promise.allSettled`
- Desestructuración, operadores spread, encadenamiento opcional (`?.`), coalescencia nula (`??`)
- Sintaxis `class`
- Literales de plantilla
- Sintaxis de módulos ES (`import` / `export`) — cuando la función está empaquetada correctamente

:::info TypeScript
TypeScript no se ejecuta directamente. Debe compilar su TypeScript a JavaScript antes de guardarlo en la Consola de Azion o desplegarlo mediante la CLI. La CLI de Azion gestiona esta compilación automáticamente.
:::

---

## 3. Globales Disponibles

Los siguientes globales son inyectados por el runtime y están disponibles sin necesidad de importaciones:

| Global                            | Descripción                                         |
| --------------------------------- | --------------------------------------------------- |
| `addEventListener`                | Registra listeners de eventos (`fetch`, `firewall`) |
| `fetch`                           | Realiza solicitudes HTTP salientes                  |
| `Request`                         | Constructor de solicitud HTTP                       |
| `Response`                        | Constructor de respuesta HTTP                       |
| `Headers`                         | Constructor de cabeceras HTTP                       |
| `URL`                             | Parsea y construye URLs                             |
| `URLSearchParams`                 | Parsea cadenas de consulta (query strings)          |
| `TextEncoder`                     | Codifica cadenas en `Uint8Array`                    |
| `TextDecoder`                     | Decodifica `Uint8Array` en cadenas                  |
| `ReadableStream`                  | Flujo de bytes de lectura                           |
| `WritableStream`                  | Flujo de bytes de escritura                         |
| `TransformStream`                 | Etapa de tubería de transformación                  |
| `caches`                          | Almacenamiento de la API Cache                      |
| `crypto`                          | API Web Crypto (incluyendo `crypto.subtle`)         |
| `console`                         | Salida de logs (capturada por el runtime)           |
| `setTimeout` / `clearTimeout`     | Ejecución diferida                                  |
| `setInterval` / `clearInterval`   | Ejecución repetida                                  |
| `AbortController` / `AbortSignal` | Tokens de cancelación para `fetch`                  |
| `atob` / `btoa`                   | Codificación Base64                                 |
| `FormData`                        | Datos de formulario multipart                       |
| `Blob`                            | Objeto binario grande (Binary Large Object)         |
| `structuredClone`                 | Clonación profunda de un valor                      |
| `queueMicrotask`                  | Programa una microtarea                             |

---

## 4. Aislamiento (Isolation)

Cada invocación de función se ejecuta en su **propio isolate** — un contexto de ejecución ligero y aislado (sandboxed) dentro del motor V8. Los isolates proporcionan:

- **Aislamiento de memoria**: Una función no puede acceder a la memoria de otra función.
- **Aislamiento de estado**: Las variables globales no persisten entre solicitudes dentro del mismo isolate (en la mayoría de los casos; vea la sección 5).
- **Seguridad**: Una función mal formada o que falle no puede afectar a otras solicitudes que estén siendo manejadas por el mismo nodo de borde.

Los isolates son mucho más económicos de crear que los procesos de sistema operativo completos o incluso los hilos (threads). Esto hace que el Runtime de Azion sea altamente eficiente al manejar grandes volúmenes de solicitudes concurrentes con una sobrecarga baja.

---

## 5. Ámbito Global y Estado

Las variables declaradas a **nivel de módulo** (fuera de su manejador de eventos) pueden persistir a través de múltiples invocaciones manejadas por la misma instancia de isolate. Esto es una optimización — el runtime puede reutilizar un isolate ya caliente para evitar la sobrecarga de inicialización en cada solicitud.

Esto tiene dos implicaciones:

**Puede usar constantes a nivel de módulo para datos compartidos e inmutables:**

```js
// Inicializado una vez por vida útil del isolate
const ORIGENES_PERMITIDOS = new Set([
  "https://app.example.com",
  "https://admin.example.com",
]);

addEventListener("fetch", (event) => {
  const origin = event.request.headers.get("Origin") ?? "";

  if (!ORIGENES_PERMITIDOS.has(origin)) {
    event.respondWith(new Response("Prohibido", { status: 403 }));
    return;
  }

  event.respondWith(new Response("OK"));
});
```

**No debe almacenar estado mutable por solicitud a nivel de módulo:**

```js
// ❌ Peligroso — este contador puede acumularse a través de múltiples solicitudes
let recuentoSolicitudes = 0;

addEventListener("fetch", (event) => {
  recuentoSolicitudes++; // No está aislado para esta solicitud
  event.respondWith(new Response(`Recuento: ${recuentoSolicitudes}`));
});
```

Si necesita estado por solicitud, manténgalo dentro del manejador de eventos o de las funciones asíncronas a las que llame.

---

## 6. Variables de Entorno

El Runtime de Azion no expone `process.env`. La configuración específica del entorno se pasa a las funciones a través de los **Argumentos de la Instancia de Función** — un objeto JSON disponible en `event.args`.

```js
addEventListener("fetch", (event) => {
  const apiKey = event.args.API_KEY;
  const region = event.args.REGION ?? "us-east";

  // usar apiKey y region...
});
```

Los argumentos se configuran por Instancia de Función, lo que significa que el mismo código de función puede comportarse de forma diferente dependiendo de dónde se instancie. Consulte [Argumentos de Función y Variables de Entorno](../development/function-arguments-and-environment-variables.md) para ver el patrón completo.

---

## 7. Red (Networking)

Las Edge Functions se ejecutan en la Azion Edge Network, distribuida en muchos puntos de presencia a nivel mundial. Cada invocación de función se ejecuta en el nodo de borde más cercano al usuario que realizó la solicitud.

Las llamadas `fetch()` salientes desde el interior de una función se realizan desde ese mismo nodo de borde. Esto significa:

- **La latencia hacia su origen o APIs externas** depende de la proximidad geográfica del nodo de borde al servicio upstream.
- **Las direcciones IP** de las solicitudes salientes varían por nodo. Si su servicio upstream utiliza listas blancas de IP, es posible que deba configurarlo para permitir todas las IPs de los nodos de borde de Azion.
- **La resolución DNS** es realizada por el runtime. El mismo nombre de host puede resolverse de forma diferente entre nodos o a lo largo del tiempo.

---

## 8. Sistema de Archivos

No existe un sistema de archivos de escritura. Las Edge Functions no pueden leer ni escribir en disco. Todos los datos deben ser:

- Pasados a través de `event.args` en el momento de la configuración.
- Recibidos de la solicitud entrante.
- Obtenidos de un servicio externo mediante `fetch()`.
- Recuperados de la API Cache.

---

## Relacionado

- [APIs del Runtime](./runtime-apis.md) — lista completa de las APIs disponibles.
- [Modelo de Ejecución](./execution-model.md) — cómo se programan las invocaciones y qué límites se aplican.
- [Argumentos de Función y Variables de Entorno](../development/function-arguments-and-environment-variables.md) — cómo pasar la configuración a las funciones.
