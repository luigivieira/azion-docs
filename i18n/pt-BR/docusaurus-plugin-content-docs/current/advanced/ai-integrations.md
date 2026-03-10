---
title: Integrações com AI
sidebar_position: 2
description: Integrando serviços de AI e LLM com Azion Edge Functions.
---

# Integrações com AI

Edge Functions podem chamar APIs de AI — para geração de texto, análise de imagens, embeddings ou qualquer outra inferência de modelo disponível via HTTP. Executar essa lógica no edge significa menor latência para os usuários e a capacidade de personalizar ou filtrar respostas de AI antes que cheguem ao cliente.

Esta página aborda padrões práticos para chamar serviços de AI a partir de Edge Functions, incluindo respostas em streaming, cache e como manter as chaves de API seguras.

---

## 1. Chamando uma API de AI

APIs de AI como OpenAI, Anthropic, Google Gemini e AWS Bedrock são acessíveis via HTTP padrão de dentro de uma Edge Function usando `fetch()`. O padrão é o mesmo que chamar qualquer API REST externa.

### Exemplo: Chat completion com OpenAI

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

A chave de API é passada por `event.args` — nunca codificada diretamente no código-fonte da função. Consulte [Argumentos de Função e Variáveis de Ambiente](../development/function-arguments-and-environment-variables.md) para o padrão completo.

---

## 2. Streaming de Respostas de AI

APIs de LLM suportam **server-sent events (SSE)** para streaming token a token. Edge Functions podem encaminhar esse stream diretamente ao cliente, para que o usuário veja os tokens à medida que são gerados, sem esperar pela resposta completa.

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

Essa abordagem usa zero buffering — o corpo da resposta da API de AI é encaminhado como está ao cliente. O primeiro token aparece no navegador assim que o serviço de AI o envia.

### Transformando uma resposta em streaming

Se você precisar filtrar ou modificar o stream (por exemplo, remover certos tokens ou injetar metadados entre chunks), use um `TransformStream`:

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

## 3. Protegendo Chaves de API

Chaves de API de AI jamais devem aparecer no código-fonte da sua função. Use os Argumentos de Instância de Função para passá-las com segurança:

1. Abra sua Edge Application no Azion Console.
2. Navegue até **Functions Instances**.
3. Selecione sua instância de função e abra a aba **Arguments**.
4. Adicione sua chave de API:

```json
{
  "OPENAI_API_KEY": "sk-...",
  "MAX_TOKENS": 1024
}
```

5. Na sua função, leia-a a partir de `event.args`:

```js
const apiKey = event.args.OPENAI_API_KEY;
```

:::warning Exposição de chaves
Os argumentos são visíveis para qualquer pessoa com acesso à sua conta no Azion Console. Não os use para armazenar chaves de serviços com raio de explosão extremamente sensível. Rotacione as chaves de API regularmente e limite-as às permissões mínimas necessárias.
:::

---

## 4. Fazendo Cache de Respostas de AI

Chamadas a APIs de AI são custosas — tanto em latência quanto em custo financeiro. Para casos de uso em que a mesma entrada produz de forma confiável a mesma saída (por exemplo, respostas fixas de FAQ, resumos de conteúdo estático), o cache no edge reduz custos e melhora o tempo de resposta.

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

:::info Quando não fazer cache
Não faça cache de respostas para AI conversacional com contexto único por usuário, recomendações personalizadas ou qualquer caso de uso em que o mesmo prompt deve produzir resultados diferentes.
:::

---

## 5. Adicionando AI a um Pipeline de Requisições Existente

Um padrão comum é usar uma função como uma **camada de pré-processamento ou pós-processamento** em torno de uma origem existente, em vez de substituí-la completamente.

### Pré-processamento: classificar requisições de entrada

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

### Pós-processamento: moderar ou traduzir uma resposta

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

## 6. Tratando Erros e Timeouts de APIs de AI

APIs de AI podem ser lentas ou ocasionalmente indisponíveis. Sempre defina um timeout e trate os erros de forma adequada:

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

Para aplicações voltadas ao usuário, considere retornar uma resposta de fallback quando o serviço de AI estiver indisponível, em vez de expor um erro 502:

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

## Relacionados

- [Calling External APIs](../development/calling-external-apis.md) — padrões gerais para chamadas `fetch()` de saída.
- [Argumentos de Função e Variáveis de Ambiente](../development/function-arguments-and-environment-variables.md) — armazenando chaves de API com segurança nos Argumentos de Instância de Função.
- [Performance Optimization](./performance-optimization.md) — streaming, cache e requisições paralelas.
