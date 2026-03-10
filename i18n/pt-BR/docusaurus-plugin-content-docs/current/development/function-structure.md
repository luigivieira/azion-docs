---
title: Estrutura de uma Function
sidebar_position: 1
description: A estrutura e anatomia de uma Azion Edge Function.
---

# Estrutura de uma Function

Toda Azion Edge Function segue um padrão consistente baseado no modelo do **Fetch Event**. Compreender essa estrutura é a base para escrever qualquer Edge Function — de simples redirecionamentos a integrações complexas com APIs.

---

## 1. A Function Mínima

A menor Edge Function possível tem a seguinte aparência:

```js
addEventListener("fetch", event => {
  event.respondWith(new Response("Hello, World!"));
});
```

Três coisas estão acontecendo aqui:

1. **`addEventListener("fetch", ...)`** — registra um listener para requisições HTTP recebidas.
2. **`event.respondWith(...)`** — informa ao runtime qual resposta enviar de volta ao cliente.
3. **`new Response(...)`** — constrói a resposta HTTP.

---

## 2. O Objeto `FetchEvent`

Quando uma requisição chega, o runtime chama seu listener com um objeto `FetchEvent`. Ele expõe dois membros principais:

| Membro | Tipo | Descrição |
|---|---|---|
| `event.request` | `Request` | A requisição HTTP recebida (URL, método, headers, body). |
| `event.args` | `object` | Argumentos JSON configurados na Function Instance. |

### `event.request`

Este é um objeto [`Request` padrão da Web API](https://developer.mozilla.org/en-US/docs/Web/API/Request). Você pode ler a URL, o método, os headers e o body a partir dele.

```js
addEventListener("fetch", event => {
  const { request } = event;

  const url = new URL(request.url);
  const method = request.method;

  event.respondWith(new Response(`${method} ${url.pathname}`));
});
```

### `event.args`

`event.args` contém o objeto JSON que você configura na aba **Arguments** de uma Function Instance. É a forma principal de passar valores de configuração para uma function sem precisar codificá-los diretamente.

```js
addEventListener("fetch", event => {
  const { args } = event;

  const greeting = args.greeting ?? "Hello";
  const name = args.name ?? "World";

  event.respondWith(new Response(`${greeting}, ${name}!`));
});
```

Na configuração da Function Instance, você definiria:

```json
{
  "greeting": "Hi",
  "name": "Azion"
}
```

---

## 3. Handlers Assíncronos

A maioria das functions reais realiza operações assíncronas como `fetch()`. O padrão recomendado é extrair a lógica em uma função handler `async`:

```js
const handleRequest = async (request, args) => {
  // ... sua lógica aqui

  return new Response("Done");
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

O método `event.respondWith()` aceita um objeto `Response` ou uma `Promise<Response>`, portanto passar a promise retornada por uma função `async` funciona corretamente.

---

## 4. Tarefas em Background com `event.waitUntil()`

Às vezes você precisa realizar tarefas que não devem atrasar a resposta — como enviar telemetria, atualizar um cache ou registrar logs em um serviço externo.

`event.waitUntil()` permite iniciar uma tarefa em background que continua sendo executada **após** a resposta ter sido enviada ao cliente.

```js
const logToExternalService = async (data) => {
  await fetch("https://my-logging-service.example.com/log", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", event => {
  const response = new Response("OK");

  // Fire and forget — this runs after the response is delivered
  event.waitUntil(logToExternalService({ url: event.request.url }));

  event.respondWith(response);
});
```

:::tip Quando usar `waitUntil`
Use `waitUntil` para efeitos colaterais que não alteram a resposta: analytics, aquecimento de cache, logs de auditoria. Evite usá-lo para lógicas que o usuário precisa ver na resposta.
:::

---

## 5. TypeScript

Functions também podem ser escritas em TypeScript. O Azion runtime não executa TypeScript diretamente — você deve transpilá-lo para JavaScript antes de salvar pelo console ou fazer o deploy via CLI.

Uma versão tipada da função mínima:

```ts
interface Args {
  greeting?: string;
}

const handleRequest = async (request: Request, args: Args): Promise<Response> => {
  const greeting = args.greeting ?? "Hello";
  return new Response(`${greeting} from the edge!`);
};

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(handleRequest(event.request, (event as any).args));
});
```

---

## 6. Juntando Tudo

Aqui está um exemplo completo combinando todos os conceitos acima:

```js
const handleRequest = async (request, args) => {
  const url = new URL(request.url);
  const target = args.targetOrigin ?? "https://example.com";

  // Proxy the request to the configured origin
  const originResponse = await fetch(`${target}${url.pathname}${url.search}`);

  return new Response(originResponse.body, {
    status: originResponse.status,
    headers: originResponse.headers,
  });
};

addEventListener("fetch", event => {
  // Background: log every request
  event.waitUntil(
    fetch("https://logger.example.com/hit", {
      method: "POST",
      body: JSON.stringify({ path: new URL(event.request.url).pathname }),
    })
  );

  event.respondWith(handleRequest(event.request, event.args));
});
```
