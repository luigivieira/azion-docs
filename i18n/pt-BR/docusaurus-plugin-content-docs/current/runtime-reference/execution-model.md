---
title: Execution Model
sidebar_position: 4
description: How Azion Edge Functions are executed on the edge network.
---

# Modelo de Execução

Entender como o runtime executa sua function ajuda você a escrever código que seja eficiente, previsível e livre de armadilhas comuns relacionadas a concorrência, estado e tempo.

---

## 1. Execução Orientada a Requisições

Edge Functions não são servidores de longa duração. Elas são executadas **sob demanda**, uma vez por requisição correspondente, e espera-se que retornem uma resposta dentro de um orçamento de tempo limitado.

O ciclo de vida de uma única invocação é:

1. Uma requisição chega a um nó de edge da Azion.
2. O Rules Engine avalia os critérios e determina que uma Function Instance deve ser executada.
3. O runtime dispara um evento `fetch` (ou `firewall`) para o seu listener.
4. Seu handler executa e chama `event.respondWith(...)`.
5. A resposta é retornada ao cliente.
6. Quaisquer tarefas agendadas via `event.waitUntil(...)` continuam a rodar até serem concluídas ou o orçamento de tempo ser esgotado.

---

## 2. Concorrência

O Azion Runtime lida com requisições concorrentes usando **V8 isolates** — contextos de execução leves que são isolados uns dos outros. Um único nó de edge pode rodar muitos isolates simultaneamente, mas cada isolate lida com **um evento por vez**.

Dentro do código da sua function, a concorrência é cooperativa e baseada no modelo assíncrono single-threaded do JavaScript:

- `await` cede o controle para o loop de eventos, permitindo que outras microtarefas prossigam.
- Múltiplas chamadas `fetch()` podem ser executadas concorrentemente usando `Promise.all()`.
- Não existem threads, worker threads ou memória compartilhada entre invocações.

```js
// Sub-requisições concorrentes — ambas as chamadas fetch começam simultaneamente
const [usersRes, statsRes] = await Promise.all([
  fetch("https://api.example.com/users"),
  fetch("https://api.example.com/stats"),
]);
```

---

## 3. Cold Starts (Inícios a Frio) e Isolates Quentes

Quando uma function é invocada em um nó de edge pela primeira vez, o runtime deve inicializar um novo isolate, compilar o código da function e executar qualquer código de configuração em nível de módulo. Isso é chamado de **cold start**.

Após a primeira invocação, o runtime pode **reutilizar o mesmo isolate** para requisições subsequentes. Isso é uma execução "quente" (warm) — não há sobrecarga de inicialização e as variáveis em nível de módulo retêm seus valores da invocação anterior.

Consequências práticas:

- **A inicialização em nível de módulo ocorre uma vez**, não em cada requisição. Use isso para trabalhos que são caros para repetir — como parsear configurações, construir tabelas de busca, etc.
- **O estado mutável em nível de módulo persiste entre as requisições** dentro do mesmo isolate quente. Evite armazenar dados por requisição em variáveis globais.
- **A latência de cold start** é proporcional ao tamanho e complexidade do seu código. Mantenha sua function pequena e evite rotinas de inicialização grandes.

```js
// Isso roda uma vez por vida útil do isolate, não por requisição
const config = JSON.parse(JSON.stringify(hardcodedDefaults));

addEventListener("fetch", (event) => {
  // Isso roda uma vez por requisição
  event.respondWith(handle(event.request, event.args, config));
});
```

---

## 4. Execução Assíncrona e o Loop de Eventos

Edge Functions usam um loop de eventos padrão do JavaScript. Operações assíncronas — `fetch()`, `crypto.subtle`, timers — não são bloqueantes. O runtime as agenda e retoma seu handler quando os resultados estão prontos.

O próprio handler da function pode ser `async`, e `event.respondWith()` pode receber uma `Promise<Response>`:

```js
const handleRequest = async (request, args) => {
  const data = await fetch("https://api.example.com/resource").then((r) =>
    r.json(),
  );
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

`event.respondWith()` deve ser chamado **sincronamente** no event handler — ele não pode ser chamado após um `await`. O padrão acima funciona porque você passa uma `Promise`, não porque `respondWith` é chamado após o await.

---

## 5. Tarefas em Segundo Plano

`event.waitUntil(promise)` estende o tempo de vida de execução da function para permitir que o trabalho em segundo plano seja concluído após a resposta ter sido enviada. O runtime não encerrará o isolate até que todas as promises de `waitUntil` tenham sido resolvidas (ou o limite de tempo de execução seja atingido).

```js
addEventListener("fetch", (event) => {
  const response = handleRequest(event.request, event.args);

  // Isso roda depois que a resposta é entregue
  event.waitUntil(
    fetch("https://analytics.example.com/collect", {
      method: "POST",
      body: JSON.stringify({ url: event.request.url, ts: Date.now() }),
    }),
  );

  event.respondWith(response);
});
```

Tarefas em segundo plano consomem tempo do orçamento total de execução da function. Se uma tarefa em segundo plano levar muito tempo, ela será encerrada pelo runtime.

---

## 6. Tratamento de Erros

Se sua function lançar uma exceção não tratada, o runtime a captura e retorna uma resposta HTTP `500` ao cliente. Os detalhes do erro são capturados e aparecem no **Real-Time Events** sob a fonte de dados **Functions Console** com um `LINE_SOURCE` de `RUNTIME`.

A melhor prática é envolver a lógica do seu handler em um try/catch e retornar uma resposta de erro significativa:

```js
const handleRequest = async (request, args) => {
  try {
    const res = await fetch(`${args.API_BASE}/resource`);

    if (!res.ok) throw new Error(`Erro no upstream: ${res.status}`);

    return new Response(await res.text());
  } catch (err) {
    console.error("Erro no handler:", err.message);
    return new Response("Internal Server Error", { status: 500 });
  }
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

---

## 7. Tempo de Execução

Cada invocação de function tem um **orçamento de tempo de CPU** — a quantidade de tempo de computação real que a function tem permissão para consumir. O tempo gasto esperando por respostas de `fetch()`, timers ou outras operações de E/S não conta para o orçamento de CPU, mas o **tempo total de relógio (wall-clock)** (tempo decorrido desde o início da invocação até a resposta) também é limitado.

Se sua function exceder seus limites de tempo:

- A invocação é encerrada.
- O cliente recebe uma resposta de erro.
- O encerramento é registrado e fica visível no Real-Time Events.

Veja [Limites](../limits.md) para os orçamentos de tempo específicos que se aplicam ao seu plano.

---

## Relacionado

- [Ambiente de Runtime](./runtime-environment.md) — modelo de isolate, globais e estado.
- [Limites](../limits.md) — tempo de CPU, memória e limites de sub-requisições.
- [Otimização de Performance](../advanced/performance-optimization.md) — técnicas para reduzir o tempo de cold start e a sobrecarga de execução.
