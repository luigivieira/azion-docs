---
title: AI Integrations
sidebar_position: 2
description: Integrating AI and LLM services with Azion Edge Functions.
---

# AI Integrations

Edge Functions can call AI APIs — for text generation, image analysis, embeddings, or any other model inference available over HTTP. Running this logic at the edge means lower latency for users and the ability to personalize or filter AI responses before they reach the client.

This page covers practical patterns for calling AI services from Edge Functions, including streaming responses, caching, and keeping API keys secure.

---

## 1. Calling an AI API

AI APIs like OpenAI, Anthropic, Google Gemini, and AWS Bedrock are accessible via standard HTTP from within an Edge Function using `fetch()`. The pattern is the same as calling any external REST API.

### Example: Chat completion with OpenAI

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
    console.error("OpenAI error:", error);
    return new Response(JSON.stringify({ error: "AI service error" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

The API key is passed through `event.args` — never hardcoded in the function source. See [Environment Variables](../development/environment-variables.md) for the full pattern.

---

## 2. Streaming AI Responses

LLM APIs support **server-sent events (SSE)** for streaming token-by-token output. Edge Functions can pipe this stream directly to the client, so the user sees tokens as they are generated without waiting for the full response.

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
    return new Response("AI service error", { status: 502 });
  }

  // Pipe the SSE stream directly to the client
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

This approach uses zero buffering — the response body from the AI API is piped as-is to the client. The first token appears in the browser as soon as the AI service sends it.

### Transforming a streamed response

If you need to filter or modify the stream (e.g., remove certain tokens, inject metadata between chunks), use a `TransformStream`:

```js
const createFilterTransform = () => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new TransformStream({
    transform(chunk, controller) {
      const text = decoder.decode(chunk);

      // Pass through all chunks except "[DONE]" signals
      if (!text.includes("[DONE]")) {
        controller.enqueue(encoder.encode(text));
      }
    },
  });
};

// In your handler:
const { readable, writable } = createFilterTransform();
upstream.body.pipeTo(writable);

return new Response(readable, {
  headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
});
```

---

## 3. Securing API Keys

AI API keys must never appear in your function source code. Use Function Instance Arguments to pass them securely:

1. Open your Edge Application in Azion Console.
2. Navigate to **Functions Instances**.
3. Select your function instance and open the **Arguments** tab.
4. Add your API key:

```json
{
  "OPENAI_API_KEY": "sk-...",
  "MAX_TOKENS": 1024
}
```

5. In your function, read it from `event.args`:

```js
const apiKey = event.args.OPENAI_API_KEY;
```

:::warning Key exposure
Arguments are visible to anyone who has access to your Azion Console account. Do not use this to store keys for services with extremely sensitive blast radius. Rotate API keys regularly and scope them to the minimum necessary permissions.
:::

---

## 4. Caching AI Responses

AI API calls are expensive — both in latency and cost. For use cases where the same input reliably produces the same output (e.g., fixed FAQ answers, static content summaries), caching at the edge reduces cost and improves response time.

```js
const CACHE_NAME = "ai-response-cache";

const getCacheKey = (messages) => {
  // Create a deterministic cache key from the messages array
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
    return new Response("AI error", { status: 502 });
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

:::info When not to cache
Do not cache responses for conversational AI with unique context per user, personalized recommendations, or any use case where the same prompt should produce different results.
:::

---

## 5. Adding AI to an Existing Request Pipeline

A common pattern is to use a function as a **pre-processing or post-processing layer** around an existing origin, rather than replacing it entirely.

### Pre-processing: classify incoming requests

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
          content: "You classify user messages into categories: SUPPORT, SALES, or OTHER. Reply with only the category name.",
        },
        { role: "user", content: userMessage },
      ],
      max_tokens: 10,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "OTHER";
};

const handleRequest = async (request, args) => {
  const body = await request.json();
  const intent = await classifyIntent(body.message, args);

  // Route to different backend endpoints based on intent
  const target = intent === "SUPPORT"
    ? `${args.SUPPORT_ORIGIN}/tickets`
    : intent === "SALES"
    ? `${args.SALES_ORIGIN}/leads`
    : `${args.DEFAULT_ORIGIN}/messages`;

  return fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, intent }),
  });
};
```

### Post-processing: moderate or translate a response

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
          content: `Translate the following text to ${targetLang}. Output only the translation.`,
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
  const originRes = await fetch(`${args.ORIGIN}${new URL(request.url).pathname}`);
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

## 6. Handling AI API Errors and Timeouts

AI APIs can be slow or occasionally unavailable. Always set a timeout and handle errors gracefully:

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
      throw new Error(`AI API error ${res.status}: ${error}`);
    }

    return await res.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("AI request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};
```

For user-facing applications, consider returning a fallback response when the AI service is unavailable, rather than surfacing a 502 error:

```js
try {
  const aiResult = await callAI(messages, event.args);
  return new Response(JSON.stringify(aiResult), {
    headers: { "Content-Type": "application/json" },
  });
} catch (err) {
  console.error("AI call failed:", err.message);
  // Fallback: return a static response or forward to origin
  return fetch(`${event.args.FALLBACK_ORIGIN}${new URL(event.request.url).pathname}`);
}
```

---

## Related

- [Calling External APIs](../development/calling-external-apis.md) — general patterns for outbound `fetch()` calls.
- [Environment Variables](../development/environment-variables.md) — storing API keys securely in Function Instance Arguments.
- [Performance Optimization](./performance-optimization.md) — streaming, caching, and parallel requests.
