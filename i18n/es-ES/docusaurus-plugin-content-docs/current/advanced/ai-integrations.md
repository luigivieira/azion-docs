---
title: Integraciones de IA
sidebar_position: 2
description: Integración de servicios de IA y LLM con Azion Edge Functions.
---

# Integraciones de IA

Las Edge Functions pueden llamar a APIs de IA — para generación de texto, análisis de imágenes, embeddings o cualquier otra inferencia de modelo disponible a través de HTTP. Ejecutar esta lógica en el borde significa una menor latencia para los usuarios y la capacidad de personalizar o filtrar las respuestas de la IA antes de que lleguen al cliente.

Esta página cubre patrones prácticos para llamar a servicios de IA desde Edge Functions, incluyendo respuestas en streaming, almacenamiento en caché y mantenimiento de la seguridad de las claves de API.

---

## 1. Llamada a una API de IA

Las APIs de IA como OpenAI, Anthropic, Google Gemini y AWS Bedrock son accesibles vía HTTP estándar desde una Edge Function utilizando `fetch()`. El patrón es el mismo que para llamar a cualquier API REST externa.

### Ejemplo: Chat completion con OpenAI

```js
const handleRequest = async (request, args) => {
  const body = await request.json();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: body.messages,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Error de OpenAI:", error);
    return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

La clave de API se pasa a través de `event.args` — nunca se incluye directamente en el código fuente de la función. Consulte [Variables de Entorno](../development/environment-variables.md) para ver el patrón completo.

---

## 2. Streaming de Respuestas de IA

Las APIs de LLM soportan **eventos enviados por el servidor (SSE)** para transmitir el resultado token a token. Las Edge Functions pueden canalizar (pipe) este flujo directamente al cliente, de modo que el usuario vea los tokens a medida que se generan sin esperar a la respuesta completa.

```js
const handleRequest = async (request, args) => {
  const body = await request.json();

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: body.messages,
      stream: true,
    }),
  });

  if (!upstream.ok) {
    return new Response("Error del servicio de IA", { status: 502 });
  }

  // Canalizar el flujo SSE directamente al cliente
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

Este enfoque utiliza un buffer de tamaño cero — el cuerpo de la respuesta de la API de IA se canaliza tal cual al cliente. El primer token aparece en el navegador tan pronto como el servicio de IA lo envía.

### Transformación de una respuesta en streaming

Si necesita filtrar o modificar el flujo (ej. eliminar ciertos tokens, inyectar metadatos entre bloques), use un `TransformStream`:

```js
const createFilterTransform = () => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new TransformStream({
    transform(chunk, controller) {
      const text = decoder.decode(chunk);

      // Pasar todos los bloques excepto las señales "[DONE]"
      if (!text.includes("[DONE]")) {
        controller.enqueue(encoder.encode(text));
      }
    },
  });
};

// En su manejador:
const { readable, writable } = createFilterTransform();
upstream.body.pipeTo(writable);

return new Response(readable, {
  headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
});
```

---

## 3. Protección de las Claves de API

Las claves de las APIs de IA nunca deben aparecer en el código fuente de su función. Utilice los Argumentos de la Instancia de Función para pasarlas de forma segura:

1. Abra su Edge Application en la Consola de Azion.
2. Vaya a **Functions Instances**.
3. Seleccione su instancia de función y abra la pestaña **Arguments**.
4. Añada su clave de API:

```json
{
  "OPENAI_API_KEY": "sk-...",
  "MAX_TOKENS": 1024
}
```

5. En su función, léala desde `event.args`:

```js
const apiKey = event.args.OPENAI_API_KEY;
```

:::warning Exposición de claves
Los Argumentos son visibles para cualquier persona que tenga acceso a su cuenta de la Consola de Azion. No utilice este método para almacenar claves de servicios con un radio de impacto extremadamente sensible. Rote las claves de API regularmente y limítelas a los permisos mínimos necesarios.
:::

---

## 4. Almacenamiento en Caché de Respuestas de IA

Las llamadas a APIs de IA son costosas — tanto en latencia como en dinero. Para casos de uso donde la misma entrada produce de forma fiable la misma salida (ej. respuestas fijas a preguntas frecuentes, resúmenes de contenido estático), el almacenamiento en caché en el borde reduce los costes y mejora el tiempo de respuesta.

```js
const CACHE_NAME = "ai-response-cache";

const getCacheKey = (messages) => {
  // Crear una clave de caché determinista a partir del array de mensajes
  return `https://ai-cache.internal/${btoa(JSON.stringify(messages))}`;
};

const handleRequest = async (request, args) => {
  const body = await request.json();
  const cacheKey = getCacheKey(body.messages);

  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(cacheKey);
  if (cached) {
    return new Response(cached.body, {
      headers: {
        ...Object.fromEntries(cached.headers.entries()),
        "X-Cache": "HIT",
      },
    });
  }

  const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: body.messages,
    }),
  });

  if (!aiResponse.ok) {
    return new Response("Error de IA", { status: 502 });
  }

  const toCache = aiResponse.clone();
  await cache.put(cacheKey, toCache);

  return new Response(aiResponse.body, {
    status: aiResponse.status,
    headers: {
      ...Object.fromEntries(aiResponse.headers.entries()),
      "X-Cache": "MISS",
    },
  });
};
```

:::info Cuándo no cachear
No almacene en caché las respuestas para IA conversacional con un contexto único por usuario, recomendaciones personalizadas o cualquier caso de uso donde el mismo prompt deba producir resultados diferentes.
:::

---

## 5. Añadir IA a un Pipeline de Solicitud Existente

Un patrón común es utilizar una función como una **capa de pre-procesamiento o post-procesamiento** alrededor de un origen existente, en lugar de reemplazarlo por completo.

### Pre-procesamiento: clasificar solicitudes entrantes

```js
const classifyIntent = async (userMessage, args) => {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Usted clasifica mensajes de usuario en categorías: SOPORTE, VENTAS u OTROS. Responda solo con el nombre de la categoría.",
        },
        { role: "user", content: userMessage },
      ],
      max_tokens: 10,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "OTROS";
};

const handleRequest = async (request, args) => {
  const body = await request.json();
  const intent = await classifyIntent(body.message, args);

  // Enrutar a diferentes endpoints del backend según el propósito
  const target =
    intent === "SOPORTE"
      ? `${args.SUPPORT_ORIGIN}/tickets`
      : intent === "VENTAS"
        ? `${args.SALES_ORIGIN}/leads`
        : `${args.DEFAULT_ORIGIN}/messages`;

  return fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, intent }),
  });
};
```

### Post-procesamiento: moderar o traducir una respuesta

```js
const translateResponse = async (text, targetLang, args) => {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Traduzca el siguiente texto a ${targetLang}. Devuelva solo la traducción.`,
        },
        { role: "user", content: text },
      ],
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? text;
};

const handleRequest = async (request, args) => {
  const lang = request.headers.get("Accept-Language")?.split(",")[0] ?? "en";
  const originRes = await fetch(
    `${args.ORIGIN}${new URL(request.url).pathname}`,
  );
  const originalText = await originRes.text();

  if (lang.startsWith("en")) {
    return new Response(originalText, { headers: originRes.headers });
  }

  const translated = await translateResponse(originalText, lang, args);

  return new Response(translated, {
    status: originRes.status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
```

---

## 6. Manejo de Errores y Timeouts de APIs de IA

Las APIs de IA pueden ser lentas o estar no disponibles ocasionalmente. Establezca siempre un tiempo de espera y maneje los errores con elegancia:

```js
const callAI = async (messages, args, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${args.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: "gpt-4o-mini", messages }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Error de la API de IA ${res.status}: ${error}`);
    }

    return await res.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("La solicitud de IA ha superado el tiempo de espera");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};
```

Para aplicaciones de cara al usuario, considere devolver una respuesta alternativa (fallback) cuando el servicio de IA no esté disponible, en lugar de mostrar un error 502:

```js
try {
  const aiResult = await callAI(messages, event.args);
  return new Response(JSON.stringify(aiResult), {
    headers: { "Content-Type": "application/json" },
  });
} catch (err) {
  console.error("Fallo en la llamada a la IA:", err.message);
  // Fallback: devolver una respuesta estática o redirigir al origen
  return fetch(
    `${event.args.FALLBACK_ORIGIN}${new URL(event.request.url).pathname}`,
  );
}
```

---

## Relacionado

- [Llamada a APIs Externas](../development/calling-external-apis.md) — patrones generales para llamadas `fetch()` salientes.
- [Variables de Entorno](../development/environment-variables.md) — almacenamiento de claves de API de forma segura en los Argumentos de la Instancia de Función.
- [Optimización del Rendimiento](./performance-optimization.md) — streaming, caché y solicitudes paralelas.
