---
title: Depuración
sidebar_position: 2
description: Técnicas de depuración para Azion Edge Functions.
---

# Depuración

La depuración de Edge Functions requiere un enfoque ligeramente diferente al de la depuración de código tradicional del lado del servidor. Las funciones se ejecutan en un runtime distribuido y de corta duración — no hay un proceso persistente al que conectar un depurador, y cada invocación es independiente. Esta guía cubre las herramientas y técnicas que funcionan bien en este entorno.

---

## 1. Depuración Local con la CLI de Azion

El ciclo de depuración más rápido es el local. El comando `azion dev` inicia un servidor de desarrollo local que ejecuta su función en su máquina, donde obtiene:

- Salida inmediata de `console.log()` en su terminal.
- Recarga rápida en cada guardado de archivo.
- Acceso completo a las solicitudes de red locales para su inspección.

```bash
azion dev
```

Todas las llamadas a `console.log()`, `console.warn()` y `console.error()` aparecen en su terminal durante el desarrollo local.

Para una guía completa sobre el desarrollo local, consulte [Desarrollo Local / Vista Previa](../development/local-development.md).

---

## 2. Inspección de Solicitudes y Respuestas

Una técnica útil para la depuración en producción es devolver los detalles de la solicitud como cuerpo de la respuesta. Esto confirma exactamente qué está recibiendo el runtime antes de que se ejecute su lógica de negocio.

```js
addEventListener("fetch", (event) => {
  const { request } = event;

  const debugInfo = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  };

  event.respondWith(
    new Response(JSON.stringify(debugInfo, null, 2), {
      headers: { "Content-Type": "application/json" },
    }),
  );
});
```

:::warning Atención
Elimine o proteja las respuestas de depuración con un flag antes de pasar a producción. Exponer las cabeceras de la solicitud (incluyendo cookies o tokens de autenticación) públicamente es un riesgo de seguridad.
:::

---

## 3. Manejo Defensivo de Errores

Las excepciones no controladas hacen que el runtime devuelva un `500` sin cuerpo — lo que dificulta su diagnóstico en **Real-Time Events**. Envuelva su manejador en un `try/catch` para asegurar que los errores se registren y la respuesta sea significativa.

```js
const handleRequest = async (request, args) => {
  // ... su lógica
  return new Response("OK");
};

addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event.request, event.args).catch((err) => {
      console.error(
        JSON.stringify({
          event: "unhandled_error",
          message: err.message,
          stack: err.stack,
        }),
      );

      return new Response("Internal Server Error", { status: 500 });
    }),
  );
});
```

Esto asegura:

1. El error se registra con un seguimiento de pila completo, visible en Real-Time Events bajo la fuente de datos **Functions Console**.
2. El cliente recibe una respuesta HTTP adecuada en lugar de una página de error a nivel de plataforma.
3. La función no falla silenciosamente.

---

## 4. Errores Comunes y Sus Causas

### `TypeError: Failed to fetch`

Normalmente significa que la URL pasada a `fetch()` está mal formada, o que el host de destino es inalcanzable desde el nodo de borde.

```js
// Compruebe la construcción de su URL
const url = new URL(path, "https://api.example.com"); // ✅ Seguro
const url = "https://" + path; // ❌ Falla si path comienza con "/"
```

### `TypeError: Cannot read properties of undefined`

La causa más común es acceder a una propiedad en `null` o `undefined` — a menudo debido a una cabecera ausente o a una respuesta de API que no coincide con la forma esperada.

```js
// ❌ Lanza un error si la cabecera no está presente
const token = request.headers.get("Authorization").split(" ")[1];

// ✅ Proteja antes de acceder
const authHeader = request.headers.get("Authorization");
if (!authHeader) {
  return new Response("Unauthorized", { status: 401 });
}
const token = authHeader.split(" ")[1];
```

### Cuerpo de respuesta consumido dos veces

Los cuerpos de `Request` y `Response` solo pueden leerse una vez. Llamar a `.json()`, `.text()` o `.arrayBuffer()` una segunda vez sobre el mismo objeto lanza un error.

```js
// ❌ Error en la segunda lectura
const data = await request.json();
const raw = await request.text();

// ✅ Clone antes de leer si necesita hacerlo más de una vez
const cloned = request.clone();
const data = await request.json();
const raw = await cloned.text();
```

### Campos de `event.args` indefinidos

`event.args` se rellena a partir de la configuración de la Instancia de Función. Las claves ausentes devuelven `undefined`, no un error. Utilice siempre valores por defecto.

```js
const targetOrigin = event.args.targetOrigin ?? "https://default.example.com";
```

---

## 5. Depuración en Producción con Real-Time Events

Cuando necesite investigar un problema en producción, **Real-Time Events** es su herramienta principal. Vaya a **Azion Console** → **Observe** → **Real-Time Events** y utilice la fuente de datos **Functions Console** para consultar las invocaciones recientes.

**Qué buscar:**

- Entradas con `Line Source = RUNTIME` — son errores a nivel de plataforma no capturados por su código.
- Entradas con `Level = ERROR` — provienen de llamadas a `console.error()` en su manejador.
- Invocaciones que aparecen en la fuente de datos **Functions** (metadatos) pero no tienen entradas correspondientes en **Functions Console** — esto puede indicar un bloqueo antes de que ocurriera cualquier registro.

**Habilitar logs detallados temporalmente**

Añada logs detallados condicionales tras un flag en `event.args`:

```js
const verbose = event.args.DEBUG === "true";

if (verbose) {
  console.log(
    JSON.stringify({
      headers: Object.fromEntries(request.headers.entries()),
      args: event.args,
    }),
  );
}
```

Establezca `"DEBUG": "true"` en los Argumentos de la Instancia de Función. Elimínelo tras la investigación.

**Reproducir con `curl`**

Delimite el problema creando una solicitud de reproducción mínima:

```bash
curl -i -X POST https://your-domain.azion.app/path \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

El flag `-i` muestra las cabeceras de la respuesta, lo que puede revelar si la función devolvió el código de estado esperado o un error a nivel de plataforma.

---

## 6. Depuración de Problemas de Asincronía y Tiempos

Las Edge Functions tienen un límite de tiempo de ejecución. Si su función realiza muchas llamadas secuenciales con `await`, puede superar el tiempo límite antes de completarse.

**Paralelice los fetches independientes:**

```js
// ❌ Secuencial — más lento y más probable que supere el tiempo límite
const user = await fetchUser(id);
const settings = await fetchSettings(id);

// ✅ Paralelo — ambos se ejecutan concurrentemente
const [user, settings] = await Promise.all([fetchUser(id), fetchSettings(id)]);
```

**Establezca timeouts explícitos en llamadas externas:**

```js
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 3000); // límite de 3s

try {
  const response = await fetch("https://api.example.com/data", {
    signal: controller.signal,
  });
  return response;
} catch (err) {
  if (err.name === "AbortError") {
    console.warn("La solicitud al upstream superó el tiempo de espera");
    return new Response("Gateway Timeout", { status: 504 });
  }
  throw err;
} finally {
  clearTimeout(timeout);
}
```

---

## Relacionado

- [Logs](./logs.md) — escritura y acceso a los logs de ejecución a través de Real-Time Events y Data Stream.
- [Métricas](./metrics.md) — datos agregados sobre errores, invocaciones y latencia.
- [Desarrollo Local / Vista Previa](../development/local-development.md) — cómo ejecutar y depurar funciones localmente.
