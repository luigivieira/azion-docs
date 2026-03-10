---
title: Integração com a Application
sidebar_position: 5
description: Como as Edge Functions se integram às Edge Applications e interagem com o ciclo de vida completo de requisição/resposta.
---

# Integração com a Application

Uma Edge Function não substitui uma Edge Application — ela a estende. As functions rodam como um behavior dentro do pipeline mais amplo de requisição/resposta gerenciado pela application. Entender onde as functions se encaixam nesse pipeline determina como você as projeta.

---

## 1. O Módulo Edge Functions

Para que uma Edge Application suporte functions, o módulo **Edge Functions** deve estar habilitado nas **Main Settings** da application. Esse módulo desbloqueia:

- A aba **Functions**, onde você cria e gerencia Function Instances.
- O behavior **Run Function** no Rules Engine.

Desabilitar o módulo oculta a aba Functions e impede que behaviors de function sejam avaliados, mas não exclui instances existentes.

---

## 2. Onde as Functions Executam no Pipeline

Cada requisição a uma Edge Application passa pelas seguintes etapas:

```
Requisição Recebida
      │
      ▼
 Request Phase (Rules Engine)
      │  ← functions podem rodar aqui
      ▼
  Camada de Cache
      │
      ▼
   Origem
      │
      ▼
 Response Phase (Rules Engine)
      │  ← functions podem rodar aqui
      ▼
 Resposta ao Cliente
```

### Request Phase

Functions na **Request Phase** executam antes de o cache ser consultado e antes de qualquer requisição ser encaminhada à origem. Isso significa que:

- Se a function retornar uma resposta via `event.respondWith()`, o cache e a origem são completamente ignorados para essa requisição.
- Se a function modificar a requisição (headers, caminho, body) e não retornar uma resposta, a requisição modificada continua pelas etapas de cache e origem.

Use a Request Phase para: autenticação e autorização, redirecionamentos, testes A/B, reescrita de requisições, computação de respostas do zero (ex.: servindo do Edge Storage).

### Response Phase

Functions na **Response Phase** executam após a origem ou o cache retornar uma resposta, antes de ela ser enviada ao cliente. Nesta etapa:

- A function recebe a resposta completa, incluindo código de status, headers e body.
- Ela pode modificar ou substituir a resposta antes da entrega.

Use a Response Phase para: injeção de headers de segurança, transformação de bodies de resposta, personalização baseada em dados de resposta, logging.

---

## 3. Interagindo com Outros Behaviors

As functions coexistem com outros behaviors do Rules Engine. Uma única regra pode combinar uma function com outras ações:

- **Cache**: Uma function na Request Phase que retorna uma resposta curto-circuita o cache para essa requisição. Para fazer cache de respostas de functions, configure o behavior de cache separadamente e garanta que a function não chame `event.respondWith()` quando um cache hit for esperado.
- **Compressão (Gzip/Brotli)**: Pode ser aplicada na Response Phase junto ou após uma function, reduzindo o tamanho da saída da function antes da entrega.
- **Headers**: Os behaviors `Add Request Header` ou `Add Response Header` podem complementar a lógica da function — por exemplo, marcando requisições antes de chegarem à function, ou adicionando headers após a function ser executada.

:::tip A ordem dos behaviors importa
Dentro de uma regra, os behaviors são executados na ordem em que estão listados. Se uma function retorna uma resposta diretamente e você precisa adicionar um header a essa resposta, certifique-se de que o behavior de header esteja listado após a function — ou adicione o header dentro do próprio código da function.
:::

---

## 4. Acessando o Contexto da Application a Partir de uma Function

As functions têm acesso à requisição recebida completa através de `event.request`. Isso inclui:

- A URL, método e body.
- Todos os headers de requisição — incluindo quaisquer headers adicionados por behaviors upstream do Rules Engine.
- O objeto `event.args` da configuração da Function Instance.

As functions não têm acesso embutido ao estado de cache da application ou à configuração de origem — elas operam diretamente sobre os dados de requisição/resposta. Para ler ou escrever conteúdo em cache programaticamente, use o **Edge Storage** via Azion Storage API.

---

## 5. Edge Firewall vs. Edge Application

As functions também podem rodar dentro de um **Edge Firewall**, que opera antes de a requisição chegar à camada da application. As principais diferenças:

| | **Edge Application** | **Edge Firewall** |
|---|---|---|
| **Tipo de evento** | `fetch` | `firewall` |
| **Ponto de execução** | Durante o processamento de requisição/resposta | Antes de a application receber a requisição |
| **Uso principal** | Lógica de negócio, personalização, chamadas de API | Filtragem de segurança, mitigação de bots, controle de acesso |
| **Pode retornar respostas** | Sim | Sim (para bloquear ou desafiar requisições) |

Use o Edge Firewall quando precisar tomar decisões — permitir, bloquear ou desafiar — antes de qualquer lógica da application ser envolvida.

---

## Próximos passos

- [Estrutura de Function](../development/function-structure.md) — entenda como escrever functions que interagem com o pipeline de requisição/resposta.
- [Tratando Requisições e Respostas](../development/handling-requests-and-responses.md) — padrões práticos para ler e modificar requisições e respostas.
