---
title: Event Handlers
sidebar_position: 2
description: Event handlers disponíveis no runtime das Edge Functions da Azion.
---

# Event Handlers

Edge Functions são orientadas a eventos. Seu código não é executado em um loop de servidor — ele é executado em resposta a um evento emitido pelo Azion Runtime quando uma requisição chega. Esta página cobre o modelo de evento, os tipos de evento disponíveis e os métodos que eles expõem.

---

## 1. `addEventListener`

Todas as Edge Functions registram um listener usando a função global `addEventListener`:

```js
addEventListener(type, handler)
```

| Parâmetro | Descrição |
|---|---|
| `type` | A string do tipo de evento: `"fetch"` ou `"firewall"` |
| `handler` | Uma função que recebe o objeto de evento |

Você pode registrar apenas **um listener por tipo de evento**. Chamar `addEventListener` uma segunda vez com o mesmo tipo sobrescreve o primeiro registro.

---

## 2. O Fetch Event

Funções implantadas em uma **Edge Application** respondem a eventos `fetch`. Este é o tipo de evento mais comum — toda requisição HTTP de entrada dispara um fetch event.

```js
addEventListener("fetch", event => {
  event.respondWith(new Response("OK"));
});
```

### Membros do `FetchEvent`

| Membro | Tipo | Descrição |
|---|---|---|
| `event.request` | `Request` | A requisição HTTP de entrada |
| `event.args` | `object` | Argumentos JSON da configuração da Function Instance |
| `event.respondWith(response)` | `void` | Define a resposta a ser retornada ao cliente |
| `event.waitUntil(promise)` | `void` | Agenda uma tarefa em segundo plano que é executada após o envio da resposta |

### `event.request`

Um [`Request` da Web API](https://developer.mozilla.org/en-US/docs/Web/API/Request) padrão que representa a requisição HTTP de entrada. Leia a URL, o método, os cabeçalhos e o corpo a partir dele.

```js
addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);
  const method = request.method;

  console.log(`${method} ${url.pathname}`);

  event.respondWith(new Response("logged"));
});
```

### `event.args`

O objeto JSON configurado na aba **Arguments** da Function Instance. É a forma recomendada de injetar configuração em uma função sem hardcodar valores no código.

```js
addEventListener("fetch", event => {
  const { targetOrigin } = event.args;

  event.respondWith(
    fetch(`${targetOrigin}${new URL(event.request.url).pathname}`)
  );
});
```

### `event.respondWith(response)`

`respondWith` aceita um objeto `Response` ou uma `Promise<Response>`. Ele deve ser chamado **de forma síncrona** dentro do event handler — não é possível adiá-lo além de um ponto de await:

```js
// ✅ Correto — respondWith chamado de forma síncrona, recebe uma Promise
addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});

// ✅ Também correto — respondWith chamado diretamente com um Response
addEventListener("fetch", event => {
  event.respondWith(new Response("Hello"));
});
```

```js
// ❌ Incorreto — respondWith é chamado dentro de um callback assíncrono
addEventListener("fetch", async event => {
  const data = await fetch("https://api.example.com");
  event.respondWith(new Response(await data.text())); // Tarde demais
});
```

### `event.waitUntil(promise)`

`waitUntil` agenda trabalho para continuar sendo executado após a resposta ter sido entregue ao cliente. Use-o para efeitos colaterais do tipo fire-and-forget: analytics, logs de auditoria, aquecimento de cache.

```js
addEventListener("fetch", event => {
  const response = new Response("OK");

  event.waitUntil(
    fetch("https://logger.example.com/hit", {
      method: "POST",
      body: JSON.stringify({ url: event.request.url }),
    })
  );

  event.respondWith(response);
});
```

:::tip
`waitUntil` não afeta a resposta que o usuário recebe — ele apenas estende o tempo de vida da função. O orçamento de tempo total para tarefas em segundo plano é contabilizado no limite geral de tempo de execução da função.
:::

---

## 3. O Firewall Event

Funções implantadas em um **Edge Firewall** respondem a eventos `firewall`. Essas funções são executadas na camada de segurança, antes que a requisição chegue à Edge Application.

```js
addEventListener("firewall", event => {
  const ip = event.request.headers.get("X-Forwarded-For");

  if (isBannedIP(ip)) {
    event.deny();
    return;
  }

  event.continue();
});
```

### Membros do `FirewallEvent`

| Membro | Tipo | Descrição |
|---|---|---|
| `event.request` | `Request` | A requisição HTTP de entrada |
| `event.args` | `object` | Argumentos JSON da configuração da Function Instance |
| `event.deny()` | `void` | Rejeita a requisição (retorna `403 Forbidden`) |
| `event.drop()` | `void` | Descarta a conexão sem enviar uma resposta |
| `event.continue()` | `void` | Passa a requisição para o próximo estágio de processamento |
| `event.respondWith(response)` | `void` | Retorna uma resposta personalizada, ignorando a origem |
| `event.waitUntil(promise)` | `void` | Agenda uma tarefa em segundo plano |

### Opções de resposta do firewall

Uma função de firewall **deve** chamar exatamente um dos seguintes: `deny()`, `drop()`, `continue()` ou `respondWith()` para encerrar o evento. Deixar de fazer isso deixa a requisição sem resolução.

| Ação | Efeito |
|---|---|
| `event.deny()` | Retorna HTTP `403 Forbidden` ao cliente |
| `event.drop()` | Fecha a conexão sem resposta |
| `event.continue()` | Passa a requisição downstream para a Edge Application |
| `event.respondWith(res)` | Retorna uma resposta personalizada — permite allowlisting, redirecionamentos ou respostas sintéticas |

```js
addEventListener("firewall", event => {
  const token = event.request.headers.get("X-Auth-Token");

  if (!token || !isValidToken(token, event.args.SECRET)) {
    // Retorna um 401 com corpo personalizado
    event.respondWith(
      new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );
    return;
  }

  event.continue();
});
```

---

## 4. Escolhendo o Tipo de Evento Correto

| Objetivo | Tipo de evento | Local |
|---|---|---|
| Tratar requisições HTTP, proxy de tráfego, transformar respostas | `fetch` | Edge Application |
| Redirecionar ou reescrever URLs | `fetch` | Edge Application |
| Autenticar ou autorizar requisições | `fetch` ou `firewall` | Edge Application ou Firewall |
| Bloquear ou limitar tráfego por taxa | `firewall` | Edge Firewall |
| Detecção e mitigação de bots | `firewall` | Edge Firewall |
| Verificação de assinatura personalizada | `firewall` | Edge Firewall |

---

## Relacionados

- [Function Structure](../development/function-structure.md) — como escrever uma função completa do zero.
- [Execution Model](./execution-model.md) — como os eventos são despachados e executados.
- [Functions in the Platform Architecture](../platform-integration/functions-in-platform-architecture.md) — como os eventos `fetch` e `firewall` se encaixam na plataforma mais ampla.
