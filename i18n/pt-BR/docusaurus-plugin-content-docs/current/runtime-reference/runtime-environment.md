---
title: Runtime Environment
sidebar_position: 5
description: O ambiente de runtime para as Edge Functions da Azion.
---

# Runtime Environment

Entender o ambiente em que sua função é executada ajuda a escrever código correto, eficiente e livre de suposições herdadas de ambientes Node.js ou de navegadores.

---

## 1. O que é o Azion Runtime

O Azion Runtime é um **motor JavaScript** baseado no V8 — o mesmo motor que alimenta o Chrome e o Node.js. No entanto, ele não é o Node.js. O runtime expõe um subconjunto do [padrão de Web APIs](https://developer.mozilla.org/en-US/docs/Web/API), não a biblioteca padrão do Node.js.

Isso significa:

- Você escreve JavaScript padrão (ES2020+) ou TypeScript (compilado para JS antes do deploy).
- APIs no estilo de navegador como `fetch`, `Request`, `Response`, `URL`, `TextEncoder` e `crypto` estão disponíveis.
- APIs do Node.js como `fs`, `path`, `net`, `process`, `Buffer` e `require()` **não** estão disponíveis.
- O DOM não está disponível — não existe `document`, `window` ou `navigator`.

O objetivo de design é a **portabilidade entre ambientes de edge** e a compatibilidade com o padrão emergente [WinterCG](https://wintercg.org/) para runtimes JavaScript do lado do servidor.

---

## 2. Suporte a JavaScript

O runtime suporta JavaScript moderno. Você pode usar:

- `async` / `await`
- `Promise`, `Promise.all`, `Promise.allSettled`
- Desestruturação, operadores spread, optional chaining (`?.`), nullish coalescing (`??`)
- Sintaxe de `class`
- Template literals
- Sintaxe de ES modules (`import` / `export`) — quando a função é corretamente empacotada (bundled)

:::info TypeScript
O TypeScript não é executado diretamente. Você deve compilar seu TypeScript para JavaScript antes de salvá-lo no Azion Console ou fazer deploy via CLI. A Azion CLI realiza essa compilação automaticamente.
:::

---

## 3. Globais Disponíveis

Os seguintes globais são injetados pelo runtime e estão disponíveis sem importações:

| Global | Descrição |
|---|---|
| `addEventListener` | Registra event listeners (`fetch`, `firewall`) |
| `fetch` | Realiza requisições HTTP de saída |
| `Request` | Construtor de requisição HTTP |
| `Response` | Construtor de resposta HTTP |
| `Headers` | Construtor de cabeçalhos HTTP |
| `URL` | Parser e construtor de URL |
| `URLSearchParams` | Parser de query string |
| `TextEncoder` | Codifica strings para `Uint8Array` |
| `TextDecoder` | Decodifica `Uint8Array` para strings |
| `ReadableStream` | Stream de bytes legível |
| `WritableStream` | Stream de bytes gravável |
| `TransformStream` | Estágio de pipeline de transformação |
| `caches` | Armazenamento da Cache API |
| `crypto` | Web Crypto API (incluindo `crypto.subtle`) |
| `console` | Saída de logs (capturada pelo runtime) |
| `setTimeout` / `clearTimeout` | Execução diferida |
| `setInterval` / `clearInterval` | Execução repetida |
| `AbortController` / `AbortSignal` | Tokens de cancelamento para `fetch` |
| `atob` / `btoa` | Codificação Base64 |
| `FormData` | Dados de formulário multipart |
| `Blob` | Objeto binário de grande tamanho |
| `structuredClone` | Clonagem profunda de um valor |
| `queueMicrotask` | Agenda uma microtarefa |

---

## 4. Isolamento

Cada invocação de função é executada em seu **próprio isolate** — um contexto de execução leve e sandboxed dentro do motor V8. Os isolates fornecem:

- **Isolamento de memória**: Uma função não pode acessar a memória de outra função.
- **Isolamento de estado**: Variáveis globais não persistem entre requisições dentro do mesmo isolate (na maioria dos casos — veja a seção 5).
- **Segurança**: Uma função com falha ou que cause crash não pode afetar outras requisições sendo tratadas pelo mesmo nó de edge.

Isolates são muito mais baratos de criar do que processos completos do SO ou até mesmo threads. Isso torna o Azion Runtime altamente eficiente no tratamento de grandes volumes de requisições concorrentes com baixo overhead.

---

## 5. Escopo Global e Estado

Variáveis declaradas no **nível do módulo** (fora do seu event handler) podem persistir entre múltiplas invocações tratadas pela mesma instância de isolate. Isso é uma otimização — o runtime pode reutilizar um isolate já aquecido para evitar o overhead de inicialização a cada requisição.

Isso tem duas implicações:

**Você pode usar constantes no nível do módulo para dados compartilhados e imutáveis:**

```js
// Inicializado uma vez por tempo de vida do isolate
const ALLOWED_ORIGINS = new Set(["https://app.example.com", "https://admin.example.com"]);

addEventListener("fetch", event => {
  const origin = event.request.headers.get("Origin") ?? "";

  if (!ALLOWED_ORIGINS.has(origin)) {
    event.respondWith(new Response("Forbidden", { status: 403 }));
    return;
  }

  event.respondWith(new Response("OK"));
});
```

**Você não deve armazenar estado mutável por requisição no nível do módulo:**

```js
// ❌ Perigoso — este contador pode se acumular entre múltiplas requisições
let requestCount = 0;

addEventListener("fetch", event => {
  requestCount++; // Não está isolado a esta requisição
  event.respondWith(new Response(`Count: ${requestCount}`));
});
```

Se você precisar de estado por requisição, mantenha-o dentro do event handler ou das funções assíncronas que ele chama.

---

## 6. Variáveis de Ambiente

O Azion Runtime não expõe `process.env`. A configuração específica por ambiente é passada às funções através dos **Function Instance Arguments** — um objeto JSON disponível em `event.args`.

```js
addEventListener("fetch", event => {
  const apiKey = event.args.API_KEY;
  const region = event.args.REGION ?? "us-east";

  // use apiKey e region...
});
```

Os argumentos são configurados por Function Instance, o que significa que o mesmo código de função pode se comportar de forma diferente dependendo de onde está instanciado. Veja [Argumentos de Função e Variáveis de Ambiente](../development/function-arguments-and-environment-variables.md) para o padrão completo.

---

## 7. Rede

Edge Functions são executadas na Azion Edge Network, distribuída por muitos pontos de presença globalmente. Cada invocação de função é executada no nó de edge mais próximo do usuário que fez a requisição.

Chamadas `fetch()` de saída feitas dentro de uma função partem desse mesmo nó de edge. Isso significa:

- **A latência para sua origem ou APIs externas** depende da proximidade geográfica do nó de edge ao serviço upstream.
- **Os endereços IP** de requisições de saída variam por nó. Se seu serviço upstream usa allowlisting de IP, pode ser necessário configurá-lo para permitir todos os IPs dos nós de edge da Azion.
- **A resolução de DNS** é realizada pelo runtime. O mesmo hostname pode resolver de forma diferente entre nós ou ao longo do tempo.

---

## 8. Sistema de Arquivos

Não há sistema de arquivos gravável. Edge Functions não podem ler ou gravar em disco. Todos os dados devem ser:

- Passados via `event.args` no momento da configuração.
- Recebidos da requisição de entrada.
- Obtidos de um serviço externo usando `fetch()`.
- Recuperados da Cache API.

---

## Relacionados

- [Runtime APIs](./runtime-apis.md) — lista completa de APIs disponíveis.
- [Execution Model](./execution-model.md) — como as invocações são agendadas e quais limites se aplicam.
- [Argumentos de Função e Variáveis de Ambiente](../development/function-arguments-and-environment-variables.md) — como passar configurações para funções.
