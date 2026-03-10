---
title: Runtime APIs
sidebar_position: 1
description: Web APIs disponíveis no runtime das Edge Functions da Azion.
---

# Runtime APIs

O Azion Runtime é um ambiente JavaScript baseado no **padrão de Web APIs**. Ele não expõe built-ins do Node.js, mas implementa um amplo conjunto de APIs compatíveis com navegadores que cobrem a grande maioria dos casos de uso no edge.

Esta página é uma referência das APIs disponíveis em suas funções.

---

## Fetch API

A Fetch API é o mecanismo principal para realizar requisições HTTP — tanto para responder a requisições de entrada quanto para realizar subrequests de saída.

### `fetch(input, init?)`

Realiza uma requisição HTTP de saída. Retorna uma `Promise<Response>`.

```js
const res = await fetch("https://api.example.com/data", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ key: "value" }),
});

const data = await res.json();
```

### `Request`

Representa uma requisição HTTP. Construída manualmente ou recebida via `event.request`.

```js
const req = new Request("https://example.com/path", {
  method: "GET",
  headers: new Headers({ Accept: "application/json" }),
});
```

Principais propriedades e métodos:

| Membro | Tipo | Descrição |
|---|---|---|
| `request.url` | `string` | URL completa da requisição |
| `request.method` | `string` | Método HTTP (`GET`, `POST`, etc.) |
| `request.headers` | `Headers` | Cabeçalhos da requisição |
| `request.body` | `ReadableStream \| null` | Corpo da requisição como stream |
| `request.json()` | `Promise<any>` | Analisa o corpo como JSON |
| `request.text()` | `Promise<string>` | Analisa o corpo como texto |
| `request.arrayBuffer()` | `Promise<ArrayBuffer>` | Analisa o corpo como binário |
| `request.formData()` | `Promise<FormData>` | Analisa o corpo como dados de formulário |
| `request.clone()` | `Request` | Cria uma cópia (o corpo só pode ser lido uma vez) |

### `Response`

Representa uma resposta HTTP.

```js
// Resposta em texto simples
new Response("Hello", { status: 200 })

// Resposta JSON
new Response(JSON.stringify({ ok: true }), {
  status: 200,
  headers: { "Content-Type": "application/json" },
})

// Redirecionamento
Response.redirect("https://new.example.com/path", 301)
```

Principais métodos estáticos:

| Método | Descrição |
|---|---|
| `Response.redirect(url, status)` | Cria uma resposta de redirecionamento |
| `Response.error()` | Cria uma resposta de erro de rede |
| `Response.json(data, init?)` | Cria uma resposta JSON (define `Content-Type` automaticamente) |

### `Headers`

Um mapa mutável e case-insensitive de cabeçalhos HTTP.

```js
const headers = new Headers({
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
});

headers.set("X-Custom", "value");
headers.get("content-type"); // "application/json"
headers.has("X-Custom");     // true
headers.delete("Cache-Control");
```

---

## URL API

### `URL`

Analisa e constrói URLs. Preferível à manipulação de strings para tratamento de URLs.

```js
const url = new URL(event.request.url);

url.pathname;                   // "/api/items"
url.searchParams.get("page");   // "2"
url.origin;                     // "https://example.com"
```

### `URLSearchParams`

Trata query strings de URL.

```js
const params = new URLSearchParams("page=2&limit=10");
params.get("page");    // "2"
params.set("limit", "20");
params.toString();     // "page=2&limit=20"
```

---

## Encoding APIs

### `TextEncoder` / `TextDecoder`

Convertem entre strings e `Uint8Array` (UTF-8).

```js
const encoder = new TextEncoder();
const bytes = encoder.encode("Hello, edge!");
// Uint8Array

const decoder = new TextDecoder();
const text = decoder.decode(bytes);
// "Hello, edge!"
```

### `atob()` / `btoa()`

Codificam e decodificam strings em Base64.

```js
const encoded = btoa("user:password");  // "dXNlcjpwYXNzd29yZA=="
const decoded = atob(encoded);          // "user:password"
```

:::tip Dados binários
Para dados binários arbitrários, use `TextEncoder` e `Uint8Array`. `atob`/`btoa` são limitados a caracteres Latin-1 e lançarão um erro para valores fora desse intervalo.
:::

---

## Streams API

A Streams API permite tratar respostas grandes ou em streaming sem armazenar o corpo inteiro na memória.

### `ReadableStream`

```js
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode("chunk 1"));
    controller.enqueue(new TextEncoder().encode("chunk 2"));
    controller.close();
  },
});

return new Response(stream, {
  headers: { "Content-Type": "text/plain" },
});
```

### `TransformStream`

Transforma dados à medida que fluem por uma cadeia de pipe. Útil para modificar o corpo de uma resposta em tempo real sem armazenar o conteúdo completo em memória.

```js
const { readable, writable } = new TransformStream({
  transform(chunk, controller) {
    const text = new TextDecoder().decode(chunk);
    controller.enqueue(new TextEncoder().encode(text.toUpperCase()));
  },
});

const upstream = await fetch("https://origin.example.com/text");
upstream.body.pipeTo(writable);

return new Response(readable);
```

---

## Cache API

A Cache API armazena e recupera pares `Request`/`Response` no nível do nó de edge.

```js
const cache = await caches.open("my-cache");

// Armazenar uma resposta
await cache.put(request, response.clone());

// Recuperar uma resposta em cache
const cached = await cache.match(request);
if (cached) return cached;

// Excluir uma entrada em cache
await cache.delete(request);
```

:::info Cache local ao nó
Cada nó de edge mantém seu próprio cache. As entradas não são replicadas entre pontos de presença. Para estado compartilhado globalmente consistente ou de longa duração, use **Azion KV Storage**.
:::

---

## Web Crypto API

Operações criptográficas via o global `crypto`.

### Gerando valores aleatórios

```js
const buffer = new Uint8Array(16);
crypto.getRandomValues(buffer);
// buffer é preenchido com bytes aleatórios criptograficamente seguros
```

### `crypto.randomUUID()`

```js
const id = crypto.randomUUID();
// "550e8400-e29b-41d4-a716-446655440000"
```

### `crypto.subtle`

Para assinaturas HMAC, criptografia AES, hashing SHA e derivação de chaves:

```js
// Hash SHA-256 de uma string
const msgBuffer = new TextEncoder().encode("hello");
const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
```

```js
// Verificar uma assinatura HMAC-SHA256 de um cabeçalho da requisição
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(event.args.SECRET_KEY),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["verify"]
);

const signatureHex = event.request.headers.get("X-Signature") ?? "";
const signatureBytes = new Uint8Array(
  signatureHex.match(/.{2}/g).map(b => parseInt(b, 16))
);
const body = await event.request.arrayBuffer();

const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, body);
```

---

## Timers

Os globais de timer padrão estão disponíveis.

```js
// Pausar a execução por uma duração fixa
await new Promise(resolve => setTimeout(resolve, 100));

// Executar lógica após um atraso
const id = setTimeout(() => console.log("fired"), 500);
clearTimeout(id);
```

`setInterval` está disponível, mas raramente é útil em um contexto de requisição-resposta, pois a execução termina quando a resposta é entregue.

---

## `AbortController` / `AbortSignal`

Usados para cancelar chamadas `fetch()` em andamento — mais comumente para impor timeouts em requisições.

```js
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 5000);

try {
  const res = await fetch("https://slow-api.example.com", {
    signal: controller.signal,
  });
  return res;
} catch (err) {
  if (err.name === "AbortError") {
    return new Response("Gateway Timeout", { status: 504 });
  }
  throw err;
} finally {
  clearTimeout(timer);
}
```

---

## `console`

Todos os quatro níveis de log padrão são suportados e capturados pelo runtime:

```js
console.log("general output");
console.info("significant event");
console.warn("non-fatal anomaly");
console.error("failure condition");
```

A saída está disponível em **Real-Time Events** na fonte de dados **Functions Console**. Veja [Logs](../observability/logs.md) para mais detalhes.

---

## APIs Não Disponíveis

Os seguintes recursos **não** estão disponíveis no Azion Runtime:

| Não disponível | Alternativa |
|---|---|
| Built-ins do Node.js (`fs`, `path`, `net`, `os`, …) | Use Web APIs ou serviços HTTP externos |
| `require()` / módulos CommonJS | Empacote (bundle) seu código ou use a sintaxe nativa de ES modules |
| `process.env` | Use `event.args` para valores de configuração |
| `WebSocket` (iniciado pelo servidor) | Não suportado atualmente |
| `XMLHttpRequest` | Use `fetch()` |
| `document`, `window`, APIs do DOM | Não aplicável em um runtime do lado do servidor |

---

## Relacionados

- [Runtime Environment](./runtime-environment.md) — o contexto completo em que sua função é executada.
- [Event Handlers](./event-handlers.md) — como `addEventListener` e o modelo de evento funcionam.
- [Calling External APIs](../development/calling-external-apis.md) — guia prático para `fetch()` de saída.
