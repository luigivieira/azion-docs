---
title: Otimização de Performance
sidebar_position: 3
description: Dicas e técnicas para otimizar a performance de Azion Edge Functions.
---

# Otimização de Performance

Edge Functions são construídas para execução com baixa latência. Porém, alguns padrões comuns podem adicionar overhead desnecessário — desde o tempo de cold start até a latência de sub-requisições. Esta página aborda as otimizações mais eficazes.

---

## 1. Minimize o Tempo de Cold Start

Um cold start ocorre na primeira vez que uma função é invocada em um nó de edge (ou após um período de inatividade). O runtime precisa inicializar um novo isolate e executar todo o código no nível do módulo antes de processar a requisição.

**Mantenha o código no nível do módulo mínimo e rápido:**

```js
// ✅ Fast — simple constant initialization
const ALLOWED_ORIGINS = new Set(["https://app.example.com"]);

// ❌ Slow — parsing a large JSON blob at startup
const HUGE_CONFIG = JSON.parse(GIANT_JSON_STRING); // defer this if possible
```

**Adie inicializações pesadas para a primeira requisição se ela depender da requisição:**

```js
let client = null;

const getClient = (args) => {
  if (!client) {
    client = new SomeClient(args.API_KEY);
  }
  return client;
};

addEventListener("fetch", event => {
  const c = getClient(event.args);
  event.respondWith(c.handle(event.request));
});
```

---

## 2. Reduza o Tamanho do Código

Funções maiores levam mais tempo para serem analisadas e compiladas durante um cold start. Mantenha o código da sua função enxuto:

- **Remova código não utilizado.** Código morto ainda é analisado pelo parser.
- **Faça bundle e tree-shake das dependências.** Se você usa um bundler (esbuild, Rollup), ative o tree-shaking para eliminar exportações não utilizadas.
- **Evite incluir bibliotecas inteiras para casos de uso pequenos.** Implemente o utilitário de 5 linhas em vez de importar uma biblioteca de 200 KB.

Para verificar o tamanho do seu output compilado:

```bash
esbuild src/function.js --bundle --minify --outfile=dist/function.js
wc -c dist/function.js
```

Consulte [Limites](../limits.md) para o limite máximo de tamanho de código.

---

## 3. Paralelize Sub-Requisições

Cada chamada `fetch()` a um serviço externo adiciona latência. Quando você precisa de múltiplos dados independentes, faça as buscas em paralelo usando `Promise.all()`:

```js
// ❌ Sequential — total time ≈ sum of all request times
const user = await fetch(`${args.API}/user/${userId}`).then(r => r.json());
const prefs = await fetch(`${args.API}/prefs/${userId}`).then(r => r.json());
const cart = await fetch(`${args.API}/cart/${userId}`).then(r => r.json());

// ✅ Parallel — total time ≈ max of all request times
const [user, prefs, cart] = await Promise.all([
  fetch(`${args.API}/user/${userId}`).then(r => r.json()),
  fetch(`${args.API}/prefs/${userId}`).then(r => r.json()),
  fetch(`${args.API}/cart/${userId}`).then(r => r.json()),
]);
```

Se algumas requisições dependem do resultado de uma requisição anterior, agrupe as independentes em lotes paralelos:

```js
// First batch: get user and session (independent)
const [user, session] = await Promise.all([
  fetch(`${args.API}/user/${userId}`).then(r => r.json()),
  fetch(`${args.API}/session/${sessionId}`).then(r => r.json()),
]);

// Second batch: use results from first batch
const [profile, permissions] = await Promise.all([
  fetch(`${args.API}/profile/${user.profileId}`).then(r => r.json()),
  fetch(`${args.API}/permissions/${session.roleId}`).then(r => r.json()),
]);
```

---

## 4. Faça Cache de Respostas Upstream

Se uma API externa retorna dados que não mudam a cada requisição, faça cache da resposta no edge usando a Cache API. Isso elimina a latência de sub-requisições para requisições subsequentes tratadas pelo mesmo nó de edge.

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

:::info Escopo do cache
A Cache API é por nó de edge. O cache não é compartilhado entre pontos de presença. A primeira requisição a cada nó ainda atingirá seu upstream — o aquecimento ocorre por nó.
:::

---

## 5. Faça Streaming de Respostas

Para respostas grandes ou de longa duração, o streaming permite que o navegador comece a receber e renderizar o conteúdo antes que o corpo completo esteja pronto — reduzindo significativamente a latência percebida.

```js
addEventListener("fetch", event => {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Start streaming the response immediately
  event.respondWith(new Response(readable, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  }));

  // Write content asynchronously
  event.waitUntil((async () => {
    const encoder = new TextEncoder();
    writer.write(encoder.encode("<html><body>"));

    const data = await fetch("https://api.example.com/items").then(r => r.json());
    for (const item of data.items) {
      writer.write(encoder.encode(`<p>${item.title}</p>`));
    }

    writer.write(encoder.encode("</body></html>"));
    writer.close();
  })());
});
```

---

## 6. Use `event.waitUntil` para Efeitos Colaterais

Envio de logs, analytics e aquecimento de cache não devem bloquear a resposta. Use `event.waitUntil()` para executá-los após o envio da resposta:

```js
addEventListener("fetch", event => {
  const response = handleRequest(event.request, event.args);

  // Does not delay the response
  event.waitUntil(
    logRequest(event.request.url, event.request.method)
  );

  event.respondWith(response);
});
```

---

## 7. Evite Serialização JSON Desnecessária

Analisar e serializar JSON tem um custo — especialmente para objetos grandes. Alguns padrões a evitar:

```js
// ❌ Unnecessary round-trip: parse then serialize the same data
const data = await fetch(url).then(r => r.json());
return new Response(JSON.stringify(data), {
  headers: { "Content-Type": "application/json" },
});

// ✅ Pipe the raw response body if you don't need to transform it
const upstream = await fetch(url);
return new Response(upstream.body, {
  status: upstream.status,
  headers: upstream.headers,
});
```

Analise o JSON somente se você realmente precisar ler ou modificar os dados.

---

## 8. Defina Timeouts Explícitos em Sub-Requisições

Sub-requisições que ficam travadas consomem o orçamento de tempo de execução da sua função. Sempre defina um timeout em chamadas `fetch()` de saída para serviços externos:

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

Um timeout de 3 a 5 segundos é um ponto de partida razoável. Ajuste com base no SLA do serviço upstream.

---

## 9. Meça Antes de Otimizar

Antes de investir em otimização, meça onde o tempo está sendo gasto. Use `Date.now()` ou `performance.now()` para instrumentar sua função:

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

Revise o output de temporização em **Real-Time Events** para encontrar o verdadeiro gargalo antes de alterar o código.

---

## Relacionados

- [Execution Model](../runtime-reference/execution-model.md) — cold starts, warm isolates e orçamentos de tempo.
- [Calling External APIs](../development/calling-external-apis.md) — padrões de cache e fetch paralelo.
- [Limites](../limits.md) — limites de tempo de CPU e memória.
