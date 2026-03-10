---
title: Configuração
sidebar_position: 3
description: Opções de configuração para as Edge Functions da Azion.
---

# Configuração

As Edge Functions são configuradas em dois níveis: a **definição de função** (o código e seus metadados), e a **function instance** (onde e como ela é executada dentro de uma aplicação ou firewall). Esta página cobre ambos.

---

## 1. Metadados da Função

Ao criar ou editar uma função no Azion Console ou via API, você configura as seguintes propriedades:

| Propriedade | Descrição |
|---|---|
| **Name** | Um identificador legível por humanos para a função. Usado para encontrá-la na biblioteca de Functions. |
| **Language** | A linguagem do código da função. Atualmente, apenas `JavaScript` é suportado (TypeScript deve ser compilado para JavaScript antes de salvar). |
| **Code** | O código-fonte da função. Salvo e executado como está — nenhum bundling do lado do servidor é realizado pela plataforma. |
| **Initiator Type** | Se a função é destinada para **Edge Application** (responde a eventos `fetch`) ou **Edge Firewall** (responde a eventos `firewall`). Isso controla qual tipo de evento o runtime despacha. |
| **Active** | Se a função está disponível para ser instanciada. Funções inativas não podem ser atribuídas a uma Function Instance. |

---

## 2. Function Instance Arguments

Cada **Function Instance** possui um campo **Arguments** — um objeto JSON que é passado para sua função em runtime via `event.args`. Esta é a principal forma de fornecer configuração específica por ambiente ou por instância a uma função.

Os argumentos são configurados por instância, de modo que o mesmo código de função pode se comportar de forma diferente dependendo de onde está implantado:

```json
{
  "targetOrigin": "https://api.example.com",
  "cacheTTL": 300,
  "allowedRoles": ["admin", "editor"]
}
```

Sua função lê esses valores em runtime:

```js
addEventListener("fetch", event => {
  const { targetOrigin, cacheTTL, allowedRoles } = event.args;

  // use os valores de configuração...
});
```

### Validação de argumentos

O runtime não valida a estrutura de `event.args`. Você é responsável por validar a presença e os tipos dos campos esperados.

```js
const handleRequest = async (request, args) => {
  const origin = args.targetOrigin;

  if (typeof origin !== "string" || !origin.startsWith("https://")) {
    console.error("Invalid targetOrigin in args:", origin);
    return new Response("Function misconfigured", { status: 500 });
  }

  return fetch(`${origin}${new URL(request.url).pathname}`);
};
```

### Limite de tamanho

O objeto JSON de Arguments está sujeito a um limite máximo de tamanho. Mantenha os argumentos concisos — eles são destinados a valores de configuração (URLs, flags, chaves), não a grandes cargas de dados. Veja [Limits](../limits.md) para o limite atual.

---

## 3. Comportamento do Rules Engine

Uma Function Instance não é invocada por padrão para cada requisição. Ela é acionada por uma **Rule** no Rules Engine de uma Edge Application ou Edge Firewall. A regra especifica:

1. **Criteria**: Quais requisições devem corresponder (por exemplo, o caminho começa com `/api`, um cabeçalho específico está presente).
2. **Behavior**: O que fazer quando os critérios correspondem — neste caso, "Run Function" com uma Function Instance específica.

Essa configuração é feita na aba **Rules Engine** da sua Edge Application ou Edge Firewall, não na própria função. Veja [Linking Instances to Rules](../platform-integration/linking-instances-to-rules.md) para instruções passo a passo.

---

## 4. Funções Inativas vs. Ativas

Uma função marcada como **inativa** no Azion Console não pode ser instanciada ou executada. Isso é útil para:

- Remover uma função da produção sem excluí-la permanentemente.
- Manter versões de rascunho de funções que ainda não estão prontas para deploy.

Function Instances existentes que referenciam uma função inativa falharão quando a regra que as invoca for correspondida — o runtime retornará uma resposta de erro em vez de executar a função.

---

## 5. Versionamento e Deploy

Não há sistema de versionamento integrado para código de função. Salvar uma nova versão de uma função no Azion Console **sobrescreve** o código atual imediatamente. Todas as Function Instances que referenciam essa função usarão o novo código na próxima invocação.

Práticas recomendadas para deploys seguros:

- **Use uma aplicação de staging**: Crie uma Edge Application separada (ou Edge Firewall) apontando para um domínio de staging, com as mesmas function instances. Teste lá antes de atualizar a função de produção.
- **Use a Azion CLI com um pipeline de CI/CD**: A CLI permite gerenciar o código de função como parte do seu fluxo de trabalho de controle de código-fonte, fornecendo um histórico de alterações por meio do seu sistema de controle de versão (por exemplo, Git).
- **Blue/green via múltiplas instâncias**: Crie uma nova função com o código atualizado, redirecione uma pequena parcela do tráfego para uma instância da nova função via critérios do Rules Engine e, em seguida, migre gradualmente o tráfego.

---

## Relacionados

- [Environment Variables](../development/environment-variables.md) — como usar `event.args` para segredos e configuração.
- [Function Instance](../platform-integration/what-is-a-function-instance.md) — explicação detalhada de function instances.
- [Linking Instances to Rules](../platform-integration/linking-instances-to-rules.md) — como ativar uma função para requisições específicas.
