---
title: Debugging
sidebar_position: 2
description: Técnicas de debugging para Azion Edge Functions.
---

# Debugging

O debugging de Edge Functions requer uma abordagem ligeiramente diferente do debugging de código server-side tradicional. As funções rodam em um runtime distribuído e de curta duração — não há um processo persistente ao qual anexar um debugger, e cada invocação é independente. Este guia aborda as ferramentas e técnicas que funcionam bem nesse ambiente.

---

## 1. Debugging Local com a Azion CLI

O ciclo de debugging mais rápido é local. O comando `azion dev` inicia um servidor de desenvolvimento local que executa sua função na sua máquina, onde você obtém:

- Saída imediata do `console.log()` no seu terminal.
- Recarga rápida a cada salvamento de arquivo.
- Acesso completo às requisições de rede local para inspeção.

```bash
azion dev
```

Todas as chamadas `console.log()`, `console.warn()` e `console.error()` aparecem no seu terminal durante o desenvolvimento local.

Para um guia completo sobre desenvolvimento local, veja [Local Development / Preview](../development/local-development.md).

---

## 2. Inspecionando Requisições e Respostas

Uma técnica útil para debugging em produção é retornar os detalhes da requisição como corpo da resposta. Isso confirma exatamente o que o runtime está recebendo antes que sua lógica de negócio seja executada.

```js
addEventListener("fetch", event => {
  const { request } = event;

  const debugInfo = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  };

  event.respondWith(
    new Response(JSON.stringify(debugInfo, null, 2), {
      headers: { "Content-Type": "application/json" },
    })
  );
});
```

:::caution
Remova ou proteja as respostas de debug por trás de uma flag antes de ir para produção. Expor cabeçalhos de requisição (incluindo cookies ou tokens de autenticação) publicamente é um risco de segurança.
:::

---

## 3. Tratamento Defensivo de Erros

Exceções não tratadas fazem o runtime retornar um `500` sem corpo — o que dificulta o diagnóstico no **Real-Time Events**. Envolva seu handler em um `try/catch` para garantir que os erros sejam registrados e a resposta seja significativa.

```js
const handleRequest = async (request, args) => {
  // ... your logic
  return new Response("OK");
};

addEventListener("fetch", event => {
  event.respondWith(
    handleRequest(event.request, event.args).catch(err => {
      console.error(JSON.stringify({
        event: "unhandled_error",
        message: err.message,
        stack: err.stack,
      }));

      return new Response("Internal Server Error", { status: 500 });
    })
  );
});
```

Isso garante que:

1. O erro seja registrado com um stack trace completo, visível no Real-Time Events na fonte de dados **Functions Console**.
2. O cliente receba uma resposta HTTP adequada em vez de uma página de erro da plataforma.
3. A função não falhe silenciosamente.

---

## 4. Erros Comuns e Suas Causas

### `TypeError: Failed to fetch`

Geralmente significa que a URL passada para `fetch()` está malformada, ou o host de destino está inacessível a partir do edge node.

```js
// Check your URL construction
const url = new URL(path, "https://api.example.com"); // ✅ Safe
const url = "https://" + path; // ❌ Breaks if path starts with "/"
```

### `TypeError: Cannot read properties of undefined`

A causa mais comum é acessar uma propriedade em `null` ou `undefined` — frequentemente de um cabeçalho ausente ou de uma resposta de API que não corresponde ao formato esperado.

```js
// ❌ Throws if the header is absent
const token = request.headers.get("Authorization").split(" ")[1];

// ✅ Guard before accessing
const authHeader = request.headers.get("Authorization");
if (!authHeader) {
  return new Response("Unauthorized", { status: 401 });
}
const token = authHeader.split(" ")[1];
```

### Corpo da resposta consumido duas vezes

Os corpos de `Request` e `Response` só podem ser lidos uma vez. Chamar `.json()`, `.text()` ou `.arrayBuffer()` uma segunda vez no mesmo objeto lança um erro.

```js
// ❌ Throws on the second read
const data = await request.json();
const raw = await request.text();

// ✅ Clone before reading if you need it more than once
const cloned = request.clone();
const data = await request.json();
const raw = await cloned.text();
```

### Campos de `event.args` são undefined

`event.args` é populado a partir da configuração da Function Instance. Chaves ausentes retornam `undefined`, não um erro. Sempre use valores padrão.

```js
const targetOrigin = event.args.targetOrigin ?? "https://default.example.com";
```

---

## 5. Debugging em Produção com o Real-Time Events

Quando você precisa investigar um problema em produção, o **Real-Time Events** é sua principal ferramenta. Acesse **Azion Console** → **Observe** → **Real-Time Events** e use a fonte de dados **Functions Console** para consultar invocações recentes.

**O que procurar:**

- Entradas com `Line Source = RUNTIME` — são erros no nível da plataforma não capturados pelo seu código.
- Entradas com `Level = ERROR` — originadas de chamadas `console.error()` no seu handler.
- Invocações que aparecem na fonte de dados **Functions** (metadados) mas sem entradas correspondentes no **Functions Console** — isso pode indicar uma falha antes de qualquer log ter sido registrado.

**Habilite logging detalhado temporariamente**

Adicione logging detalhado condicional por meio de uma flag em `event.args`:

```js
const verbose = event.args.DEBUG === "true";

if (verbose) {
  console.log(JSON.stringify({
    headers: Object.fromEntries(request.headers.entries()),
    args: event.args,
  }));
}
```

Defina `"DEBUG": "true"` nos Arguments da Function Instance. Remova após a investigação.

**Reproduza com `curl`**

Reduza o problema criando uma requisição de reprodução mínima:

```bash
curl -i -X POST https://your-domain.azion.app/path \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

A flag `-i` exibe os cabeçalhos da resposta, o que pode revelar se a função retornou o código de status esperado ou um erro da plataforma.

---

## 6. Debugging de Problemas Assíncronos e de Tempo

As Edge Functions têm um limite de tempo de execução. Se sua função realiza muitas chamadas `await` sequenciais, ela pode expirar antes de concluir.

**Paralelizar fetches independentes:**

```js
// ❌ Sequential — slower and more likely to time out
const user = await fetchUser(id);
const settings = await fetchSettings(id);

// ✅ Parallel — both run concurrently
const [user, settings] = await Promise.all([fetchUser(id), fetchSettings(id)]);
```

**Defina timeouts explícitos em chamadas externas:**

```js
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 3000); // 3s limit

try {
  const response = await fetch("https://api.example.com/data", {
    signal: controller.signal,
  });
  return response;
} catch (err) {
  if (err.name === "AbortError") {
    console.warn("Upstream request timed out");
    return new Response("Gateway Timeout", { status: 504 });
  }
  throw err;
} finally {
  clearTimeout(timeout);
}
```

---

## Relacionados

- [Logs](./logs.md) — escrita e acesso a logs de execução via Real-Time Events e Data Stream.
- [Metrics](./metrics.md) — dados agregados sobre erros, invocações e latência.
- [Local Development / Preview](../development/local-development.md) — como executar e depurar funções localmente.
