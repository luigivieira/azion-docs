---
title: Environment Variables
sidebar_position: 3
description: Usando environment variables em Azion Edge Functions.
---

# Environment Variables

Environment variables permitem injetar configurações e segredos nas suas Edge Functions sem precisar codificar valores diretamente no código-fonte. Esse é o padrão recomendado para separar código de configuração e manter valores sensíveis — como chaves de API ou credenciais de banco de dados — fora do seu repositório.

---

## 1. Como as Variáveis São Armazenadas

A Azion armazena environment variables no nível da **Edge Application**, dentro de uma **Function Instance**. Os valores inseridos são criptografados em repouso. Quando o runtime inicializa sua function, ele disponibiliza esses valores por meio da API `Azion.env`.

:::info Não é o mesmo que `process.env`
O Azion Runtime não possui o global `process` (esse é um conceito do Node.js). Para ler environment variables, use `Azion.env.get()`.
:::

---

## 2. Configurando Variáveis no Console

1. Abra o **Azion Console** → **Build** → **Edge Applications** e selecione sua aplicação.
2. Acesse a aba **Functions** e abra a Function Instance que deseja configurar.
3. Na aba **Arguments**, adicione seus pares chave-valor em JSON — ou use a seção **Environment Variables** se o seu plano incluir essa opção.

Para configurações no nível da function (o objeto `event.args`), adicione pares chave-valor diretamente no editor JSON da aba **Arguments**:

```json
{
  "API_KEY": "sk-your-key-here",
  "ORIGIN_URL": "https://api.example.com",
  "CACHE_TTL": 300
}
```

Esses valores ficam disponíveis em tempo de execução como `event.args`.

---

## 3. Lendo Variáveis em Tempo de Execução

### Via `event.args` (Recomendado para Configurações Específicas da Function)

A abordagem mais comum é passar configurações pela aba **Arguments** da Function Instance. Isso torna cada instância configurável de forma independente.

```js
const handleRequest = async (request, args) => {
  const apiKey     = args.API_KEY;
  const originUrl  = args.ORIGIN_URL ?? "https://api.example.com";
  const cacheTtl   = args.CACHE_TTL ?? 60;

  const res = await fetch(`${originUrl}/data`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${cacheTtl}`,
    },
  });
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

### Via `Azion.env.get()` (Variáveis no Nível da Aplicação)

Para variáveis compartilhadas entre múltiplas function instances (ou definidas fora do JSON de Arguments), a Azion disponibiliza um objeto global `Azion.env`:

```js
addEventListener("fetch", event => {
  const apiKey = Azion.env.get("MY_API_KEY");

  if (!apiKey) {
    event.respondWith(new Response("Configuration error", { status: 500 }));
    return;
  }

  event.respondWith(new Response(`Key starts with: ${apiKey.slice(0, 4)}...`));
});
```

`Azion.env.get(name)` retorna o valor como string, ou `undefined` se a variável não estiver definida.

---

## 4. Fornecendo Valores Padrão e Validando na Inicialização

Sempre forneça valores padrão sensatos e valide variáveis obrigatórias antecipadamente. Uma function que falha com uma mensagem de erro clara é muito mais fácil de depurar do que uma que retorna dados incorretos silenciosamente.

```js
const getConfig = (args) => {
  const required = ["API_KEY", "ORIGIN_URL"];

  for (const key of required) {
    if (!args[key]) {
      throw new Error(`Missing required configuration: ${key}`);
    }
  }

  return {
    apiKey:   args.API_KEY,
    origin:   args.ORIGIN_URL,
    cacheTtl: Number(args.CACHE_TTL ?? 60),
    debug:    args.DEBUG === "true",
  };
};

const handleRequest = async (request, args) => {
  let config;

  try {
    config = getConfig(args);
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }

  if (config.debug) {
    console.log("Config loaded:", { origin: config.origin, cacheTtl: config.cacheTtl });
  }

  const res = await fetch(`${config.origin}/data`, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
  });

  return res;
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

---

## 5. Segredos e Boas Práticas de Segurança

- **Nunca registre valores secretos em logs**. Use `console.log` apenas para metadados não sensíveis (URLs sem credenciais, códigos de status, etc.).
- **Nunca coloque segredos no código-fonte**. Armazene-os somente no JSON de Arguments ou nas environment variables no nível da aplicação.
- **Rotacione as chaves regularmente**. Quando você atualiza o JSON de Arguments de uma Function Instance, o novo valor entra em vigor na próxima requisição — sem necessidade de redeployment.
- **Use instâncias diferentes para ambientes diferentes**. Crie Function Instances separadas para staging e produção, cada uma com seu próprio conjunto de chaves. Isso evita vazamentos acidentais de dados entre ambientes.

---

## 6. Coerção de Tipos

Todos os valores inseridos no JSON de Arguments são tipados como estão (strings permanecem strings, números permanecem números). Valores lidos via `Azion.env.get()` são sempre strings. Lembre-se de converter os tipos explicitamente quando necessário:

```js
const args = event.args;

const timeout = Number(args.TIMEOUT_MS ?? "5000");   // string → number
const debug   = args.DEBUG === "true";                // string → boolean
const items   = JSON.parse(args.ALLOWED_IPS ?? "[]"); // string → array
```
