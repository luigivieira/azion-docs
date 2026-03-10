---
title: O Que É uma Function Instance
sidebar_position: 2
description: Entenda o que é uma Function Instance e por que ela é o elo fundamental entre uma function e uma Edge Application.
---

# O Que É uma Function Instance

Uma **Function Instance** é uma referência configurada a uma Edge Function dentro de uma Edge Application ou Edge Firewall. É a entidade que o Rules Engine invoca — não o código da function em si.

---

## 1. Function vs. Function Instance

Entender a distinção entre uma function e uma function instance é essencial:

| | **Edge Function** | **Function Instance** |
|---|---|---|
| **O que é** | O código que você escreve e salva | Uma referência a esse código, com escopo para uma application |
| **Onde vive** | Na biblioteca de functions da sua conta | Dentro de uma Edge Application ou Edge Firewall específica |
| **O que o Rules Engine usa** | — | A instance |

Pense na function como um blueprint e na instance como um deploy desse blueprint em um contexto específico. A mesma function pode ter múltiplas instances — em diferentes applications, ou até múltiplas instances dentro da mesma application.

## 2. Por Que as Instances Existem

As instances existem para habilitar **reuso com configuração por application**.

Imagine que você tem uma function de autenticação. Em vez de duplicar o código para cada application que precisa dela, você a salva uma vez e cria uma instance em cada application. Cada instance pode ser configurada de forma diferente usando o JSON de **Arguments** — uma instance pode impor expiração de token rígida, outra pode usar uma política mais flexível para ferramentas internas.

## 3. O JSON de Arguments

Toda Function Instance tem uma aba **Arguments** onde você pode fornecer um objeto JSON. Esse objeto é passado para a function em tempo de execução via `event.args`.

Por exemplo, se sua instance tiver esta configuração:

```json
{
  "allowedOrigins": ["https://app.example.com"],
  "strictMode": true
}
```

Sua function pode lê-lo assim:

```js
addEventListener("fetch", event => {
  const { allowedOrigins, strictMode } = event.args;

  // use a configuração na sua lógica
  event.respondWith(new Response(`Strict mode: ${strictMode}`));
});
```

Essa separação entre código e configuração é o que torna as functions reutilizáveis. A lógica permanece a mesma; apenas os arguments mudam por instance.

:::tip Sem valores hardcoded
Use Arguments para qualquer valor que possa diferir entre deploys: chaves de API (via variáveis de ambiente), origens permitidas, feature flags, URLs de destino. Isso mantém o código da sua function genérico e suas instances específicas.
:::

## 4. Ciclo de Vida da Instance

- **Criar uma instance** não faz deploy nem executa nada por si só. A function só roda quando uma regra do Rules Engine com um behavior "Run Function" corresponde a uma requisição.
- **Excluir uma instance** a remove da application. Qualquer regra que a referenciasse parará de invocar a function.
- **Atualizar os Arguments** de uma instance entra em vigor na próxima requisição correspondente, sem necessidade de redeploy.

## Próximos passos

- [Criando Instances](./creating-instances.md) — como adicionar uma Function Instance a uma application.
- [Vinculando Instances a Regras](./linking-instances-to-rules.md) — como configurar o Rules Engine para invocar sua instance.
