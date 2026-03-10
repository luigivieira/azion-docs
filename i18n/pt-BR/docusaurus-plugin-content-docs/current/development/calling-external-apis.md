---
title: Chamando APIs Externas
sidebar_position: 4
description: Como chamar APIs externas de dentro de uma Azion Edge Function.
---

# Chamando APIs Externas

As Edge Functions têm acesso total à API padrão `fetch()`, o que significa que você pode fazer requisições HTTP de saída para qualquer serviço externo — APIs REST, endpoints GraphQL, bancos de dados com interfaces HTTP ou qualquer outro serviço acessível pela internet.

:::info Requisições de saída contam como sub-requisições
Cada chamada `fetch()` feita de dentro de uma Edge Function é uma **sub-requisição**. Sub-requisições consomem tempo de rede e contam para os limites de sub-requisições do seu plano. Fique atento ao fazer múltiplas requisições sequenciais — use fetches paralelos sempre que possível.
:::

---

## 1. Uso Básico de `fetch()`

O global `fetch()` é idêntico à Fetch API do navegador. Uma requisição GET simples:

```js title="main.js"
const handleRequest = async (request) => {
  const response = await fetch("https://api.example.com/data");

  if (!response.ok) {
    return new Response("Erro no upstream", { status: 502 });
  }

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
```

---

## 2. Fazendo Requisições Autenticadas

### Token Bearer

```js
const fetchWithAuth = async (url, token) => {
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

addEventListener("fetch", (event) => {
  event.respondWith(
    fetchWithAuth("https://api.example.com/protected", event.args.API_TOKEN)
      .then((res) => res.json())
      .then(
        (data) =>
          new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
          }),
      ),
  );
});
```

### Chave de API no Header

```js
const res = await fetch("https://api.example.com/v1/results", {
  headers: {
    "X-API-Key": event.args.API_KEY,
  },
});
```

### Autenticação Básica (Basic Auth)

```js
const credentials = btoa(`${event.args.USERNAME}:${event.args.PASSWORD}`);

const res = await fetch("https://api.example.com/secure", {
  headers: {
    Authorization: `Basic ${credentials}`,
  },
});
```

---

## 3. Enviando Dados (POST, PUT, PATCH)

### Corpo JSON

```js
const handleRequest = async (request, args) => {
  const payload = await request.json();

  const res = await fetch("https://api.example.com/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.API_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await res.json();

  return new Response(JSON.stringify(result), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

### Dados de Formulário (Form Data)

```js
const formData = new FormData();
formData.append("name", "Azion");
formData.append("type", "edge");

const res = await fetch("https://api.example.com/submit", {
  method: "POST",
  body: formData,
});
```

---

## 4. Requisições Paralelas

Quando múltiplas chamadas de API independentes são necessárias, execute-as em paralelo com `Promise.all()` em vez de aguardá-las sequencialmente. Isso pode reduzir significativamente a latência total.

```js
const handleRequest = async (request, args) => {
  const base = args.API_BASE ?? "https://api.example.com";

  // Ambas as requisições começam ao mesmo tempo
  const [usersRes, productsRes] = await Promise.all([
    fetch(`${base}/users`),
    fetch(`${base}/products`),
  ]);

  const [users, products] = await Promise.all([
    usersRes.json(),
    productsRes.json(),
  ]);

  return new Response(JSON.stringify({ users, products }), {
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

**Sequencial (lento):** ~200ms + ~150ms = ~350ms total
**Paralelo:** ~200ms total (limitado pela requisição mais lenta)

---

## 5. Tratamento de Erros

Sempre trate erros de serviços externos de forma graciosa. Uma falha em uma API downstream não deve fazer com que sua edge function trave ou retorne uma exceção não tratada.

```js
const safeFetch = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      throw new Error(`Upstream respondeu com ${res.status}`);
    }

    return { data: await res.json(), error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

const handleRequest = async (request, args) => {
  const { data, error } = await safeFetch(`${args.API_BASE}/resource`);

  if (error) {
    console.error("Erro no upstream:", error);
    return new Response(JSON.stringify({ error: "Serviço indisponível" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

---

## 6. Timeouts

A API `fetch()` no Azion Runtime suporta `AbortController` e `AbortSignal`, que você pode usar para impor um timeout em requisições de saída.

```js
const fetchWithTimeout = async (url, options = {}, timeoutMs = 5000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`A requisição para ${url} expirou após ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

addEventListener("fetch", (event) => {
  event.respondWith(
    fetchWithTimeout("https://slow-api.example.com/data", {}, 3000)
      .then((res) => res.json())
      .then(
        (data) =>
          new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
          }),
      )
      .catch((err) => new Response(err.message, { status: 504 })),
  );
});
```

---

## 7. Cache de Respostas de APIs Externas

Se a API externa que você está chamando retorna dados que não mudam com frequência, fazer o cache da resposta no edge reduz drasticamente a latência e o número de sub-requisições que você faz.

O Azion Runtime suporta a padrão [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache). Aqui está um padrão simples de cache-aside:

```js
const CACHE_NAME = "external-api-cache";

const handleRequest = async (request, args) => {
  const cacheUrl = `https://cache-key.internal/weather`;
  const cache = await caches.open(CACHE_NAME);

  // Verifica o cache primeiro
  const cached = await cache.match(cacheUrl);
  if (cached) {
    return cached;
  }

  // Busca na origem
  const res = await fetch(`${args.WEATHER_API}/current?city=sao-paulo`, {
    headers: { "X-API-Key": args.WEATHER_API_KEY },
  });

  if (!res.ok) {
    return new Response("Serviço de clima indisponível", { status: 502 });
  }

  // Clona a resposta antes de colocar no cache (ela só pode ser consumida uma vez)
  const responseToCache = res.clone();
  await cache.put(cacheUrl, responseToCache);

  return res;
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

:::tip Invalidação de cache
A Cache API armazena entradas por nó de edge. Cada ponto de presença mantém seu próprio cache. Se você precisar de invalidação global e coordenada, considere usar o **Azion KV Storage** para armazenar valores em cache com TTLs explícitos.
:::
