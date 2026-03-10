---
title: Desenvolvimento Local / Preview
sidebar_position: 5
description: Como desenvolver e fazer preview de Azion Edge Functions localmente.
---

# Desenvolvimento Local / Preview

Embora o Azion Console seja ótimo para edições rápidas, iterar sobre lógicas complexas diretamente em um editor no navegador pode ser limitante. A **Azion CLI** oferece um servidor de desenvolvimento local que executa suas Edge Functions na sua máquina, proporcionando um ciclo de feedback rápido sem precisar fazer deploy na edge network a cada alteração.

---

## 1. Pré-requisitos

Antes de usar o servidor de desenvolvimento local, verifique se você tem:

- **Node.js 18+** instalado. Você pode verificar com `node --version`.
- **Azion CLI** instalada globalmente:

```bash
npm install -g azion
```

- Uma **conta Azion** e um token de API. Gere um em **Azion Console** → **Account** → **Personal Tokens**.

---

## 2. Autenticando

Faça login com seu token de API para que a CLI possa sincronizar suas functions com sua conta:

```bash
azion login --token YOUR_PERSONAL_TOKEN
```

---

## 3. Criando um Novo Projeto

Se você está começando do zero, a CLI pode criar a estrutura de um novo projeto de Edge Function:

```bash
azion init
```

Siga as instruções para escolher um template inicial (JavaScript, TypeScript ou uma aplicação baseada em framework). Isso cria uma estrutura de projeto local com uma function de exemplo e um arquivo de configuração.

---

## 4. Executando o Servidor de Desenvolvimento Local

Dentro do diretório do seu projeto, inicie o servidor de desenvolvimento local:

```bash
azion dev
```

A CLI irá:

1. Ler o código-fonte da sua function (geralmente `main.js` ou `src/index.ts`).
2. Empacotá-lo com suas dependências.
3. Iniciar um servidor HTTP local que emula o ambiente do Azion Runtime.

Você verá uma saída semelhante a:

```
[Azion] Starting local development server...
[Azion] Server running at http://localhost:3000
```

Abra `http://localhost:3000` no seu navegador ou use `curl` para testar sua function:

```bash
curl http://localhost:3000
```

Toda vez que você salvar uma alteração no arquivo-fonte, o servidor recarrega automaticamente.

---

## 5. Simulando `event.args`

Em produção, `event.args` é populado pelo JSON configurado na Function Instance. Durante o desenvolvimento local, você pode fornecer um objeto `args` simulado criando um arquivo `azion.config.js` (ou editando o existente) na raiz do seu projeto:

```js
// azion.config.js
export default {
  dev: {
    args: {
      API_KEY: "local-dev-key",
      ORIGIN_URL: "https://api.example.com",
      DEBUG: "true",
    },
  },
};
```

A CLI injeta esses valores como `event.args` ao executar localmente, de modo que seu código não precisa de nenhuma alteração entre o ambiente local e o de produção.

---

## 6. Gerando o Build para Deploy

Quando estiver pronto para fazer o deploy, gere o bundle de produção:

```bash
azion build
```

Isso compila e otimiza sua function. Para fazer o deploy na edge network:

```bash
azion deploy
```

A CLI envia sua function para sua conta Azion e, se houver uma Edge Application vinculada, atualiza automaticamente a Function Instance associada.

---

## 7. Vinculando a uma Aplicação Existente

Se você tem uma Edge Application existente na sua conta e deseja vincular o projeto local a ela:

```bash
azion link
```

Isso armazena localmente os IDs da aplicação e da function para que o `azion deploy` saiba quais recursos atualizar.

---

## 8. Limitações Conhecidas do Ambiente Local

O servidor de desenvolvimento local emula fielmente a maior parte do comportamento do Azion Runtime, mas alguns recursos se comportam de forma diferente ou não estão disponíveis:

| Recurso | Comportamento local |
|---|---|
| `fetch()` | Funciona normalmente — chama APIs externas reais. |
| `caches` (Cache API) | Somente em memória. O cache é limpo ao reiniciar. |
| `Azion.env.get()` | Retorna valores das environment variables do seu shell ou do `azion.config.js`. |
| `console.log()` | A saída vai para o seu terminal. |
| Latência da edge network | Não é simulada — as respostas são servidas a partir do `localhost`. |
| GeoIP / `request.cf` | Não disponível localmente. |
| KV Storage | Requer uma conta Azion real e um token de API; não é emulado em memória. |

:::tip Testando lógica de GeoIP localmente
Se sua function ramifica com base em dados geográficos (país, cidade, etc.), adicione uma condicional no seu código que leia a partir de `event.args` quando os dados de GeoIP estiverem ausentes:

```js
const country = event.request.cf?.country ?? args.MOCK_COUNTRY ?? "US";
```

Em seguida, defina `MOCK_COUNTRY` nos args do seu `azion.config.js` local para simular diferentes localizações.
:::

---

## 9. Integração com Editor

O Azion Runtime implementa **Web Standard APIs** (Fetch, Streams, Web Crypto, Cache). Para a melhor experiência com TypeScript no editor, instale as definições de tipos do Web Workers:

```bash
npm install --save-dev @cloudflare/workers-types
```

Em seguida, referencie-as no seu `tsconfig.json`:

```json
{
  "compilerOptions": {
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"]
  }
}
```

Isso fornece autocompletar completo e verificação de tipos para `Request`, `Response`, `FetchEvent` e outros globais do runtime.
