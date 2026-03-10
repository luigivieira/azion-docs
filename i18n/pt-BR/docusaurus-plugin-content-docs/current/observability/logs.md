---
title: Logs
sidebar_position: 1
description: Acesse e entenda os logs das Azion Edge Functions.
---

# Logs

As Edge Functions na plataforma Azion emitem logs disponíveis por meio de dois produtos Observe: **Real-Time Events** para inspeção interativa no Azion Console, e **Data Stream** para encaminhamento de logs a plataformas externas. Os logs são a principal ferramenta para entender o que sua função está fazendo em produção — confirmando invocações, inspecionando valores computados e diagnosticando erros.

---

## 1. Escrevendo Logs na Sua Função

Dentro de uma função, use a API padrão `console` para emitir mensagens de log. Toda saída do `console` é capturada pelo runtime e armazenada na fonte de dados **Functions Console**.

```js
addEventListener("fetch", event => {
  console.log("Function invoked:", event.request.url);
  console.log("Method:", event.request.method);

  event.respondWith(new Response("OK"));
});
```

Todos os quatro níveis são suportados e preservados na saída do log:

| Método | Usado para |
|---|---|
| `console.log()` | Saída informacional geral |
| `console.info()` | Eventos importantes do ciclo de vida |
| `console.warn()` | Anomalias não fatais |
| `console.error()` | Erros e condições inesperadas |

:::tip Logging estruturado
Registre objetos JSON em vez de strings simples. Isso torna seus logs filtráveis no Real-Time Events.

```js
console.log(JSON.stringify({
  event: "cache_miss",
  path: new URL(event.request.url).pathname,
}));
```
:::

---

## 2. Visualizando Logs no Real-Time Events

O **Real-Time Events** permite consultar e inspecionar dados de log brutos dos últimos **7 dias** (168 horas). Os logs ficam disponíveis em aproximadamente **30 segundos** após a invocação.

Para visualizar os logs da sua função:

1. Acesse **Azion Console** → **Observe** → **Real-Time Events**.
2. Selecione a fonte de dados **Functions Console**.
3. Defina o intervalo de tempo e dispare uma requisição para sua função.
4. As entradas de log aparecem na tabela de resultados. Clique em qualquer linha para expandir todos os campos.

### Campos do Functions Console

| Campo | Descrição |
|---|---|
| `Configuration ID` | Identificador de configuração do virtual host |
| `Function ID` | Identificador único da função |
| `ID` | Identificador da requisição — agrupa todas as mensagens de uma única invocação |
| `Level` | Nível do log: `MDN`, `DEBUG`, `INFO`, `ERROR`, `LOG` ou `WARN` |
| `Line` | Conteúdo da mensagem de log — saída do seu `console.log()` |
| `Line Source` | `CONSOLE` (do seu código) ou `RUNTIME` (erro da plataforma) |
| `Solution ID` | ID único da solução Azion |

### Campos de invocação de Functions

A fonte de dados **Functions** (separada do Functions Console) contém metadados de invocação — não as mensagens de log em si:

| Campo | Descrição |
|---|---|
| `Functions Instance ID List` | IDs das instâncias de função invocadas |
| `Functions Initiator Type List` | `1` = Application, `2` = Firewall |
| `Functions List` | Funções invocadas (da esquerda para a direita), separadas por `;` |
| `Functions Time` | Tempo total de execução em segundos |
| `Function Language` | Linguagem utilizada (ex.: `javascript`) |

---

## 3. Transmitindo Logs com o Data Stream

Para exportar logs para plataformas externas — como Datadog, Elasticsearch, Splunk ou S3 — use o **Data Stream**. Ele encaminha continuamente registros de log das suas funções para um endpoint configurado.

A fonte de dados **Functions** do Data Stream captura as seguintes variáveis por invocação:

| Variável | Descrição |
|---|---|
| `$client` | Identificador único do cliente Azion |
| `$edge_function_id` | ID da função executada |
| `$global_id` | Identificação das configurações |
| `$log_level` | `ERROR`, `WARN`, `INFO`, `DEBUG` ou `TRACE` |
| `$log_message` | Conteúdo da mensagem de log da sua função |
| `$message_source` | `CONSOLE` (do seu código) ou `RUNTIME` (erro da plataforma) |
| `$request_id` | Identificador único da requisição |
| `$time` | Timestamp do evento |

### Como o Data Stream entrega os logs

O Data Stream agrupa registros de log e os envia para o seu endpoint a cada **60 segundos**, ou quando um lote atinge **2.000 registros** — o que ocorrer primeiro. Os destinos suportados incluem: Apache Kafka, AWS Kinesis Data Firehose, Azure Blob Storage, Azure Monitor, Datadog, Elasticsearch, Google BigQuery, IBM QRadar, S3, Splunk e Standard HTTP/HTTPS POST.

:::info Disponibilidade do endpoint
O Data Stream monitora seu endpoint uma vez por minuto. Se o endpoint estiver inacessível, os registros daquela janela são **descartados** — eles não são armazenados em buffer para nova tentativa.
:::

---

## 4. Padrões de Logging

### Evite registrar dados sensíveis

Nunca registre tokens de autenticação, senhas ou informações pessoalmente identificáveis:

```js
// ❌ Do not log raw auth headers
console.log("Auth token:", request.headers.get("Authorization"));

// ✅ Log only what you need to confirm authentication state
console.log("Request authenticated:", request.headers.has("Authorization"));
```

### Registre na entrada e saída da função

Delimitar seu handler com logs de entrada/saída facilita a detecção de execuções incompletas no Real-Time Events:

```js
const handleRequest = async (request, args) => {
  console.log(JSON.stringify({ event: "start", url: request.url }));

  const response = await processRequest(request, args);

  console.log(JSON.stringify({ event: "end", status: response.status }));
  return response;
};
```

### Use `event.waitUntil()` para envio de logs sem bloqueio

Se você encaminha logs para um serviço externo a partir da própria função, use `event.waitUntil()` para que o envio não atrase a resposta:

```js
addEventListener("fetch", event => {
  const response = handleRequest(event.request, event.args);

  event.waitUntil(
    fetch("https://logs.example.com/ingest", {
      method: "POST",
      body: JSON.stringify({ url: event.request.url, ts: Date.now() }),
      headers: { "Content-Type": "application/json" },
    })
  );

  event.respondWith(response);
});
```

---

## Relacionados

- [Debugging](./debugging.md) — técnicas para diagnosticar erros de funções usando logs e tratamento de erros.
- [Metrics](./metrics.md) — dados de desempenho agregados para suas funções.
- [Test and Observe](../getting-started/test-and-observe.md) — como verificar logs durante o fluxo de introdução.
