---
title: Vinculando Instances a Regras
sidebar_position: 4
description: Como configurar o Rules Engine para invocar uma Function Instance.
---

# Vinculando Instances a Regras

Uma Function Instance não é executada automaticamente. Você deve configurar uma regra no **Rules Engine** que invoque a instance sob condições específicas. É isso que conecta o "o quê" (a instance) ao "quando" (os critérios da requisição).

---

## Pré-requisitos

- Uma Function Instance já criada na application. Veja [Criando Instances](./creating-instances.md).
- O módulo **Edge Functions** habilitado nas Main Settings da application.

---

## Como o Rules Engine funciona

O Rules Engine avalia cada requisição recebida em relação a uma lista de regras. Cada regra tem:

- **Criteria**: Uma ou mais condições que devem ser verdadeiras para que a regra se aplique (ex.: caminho da requisição, método, headers, cookies).
- **Behavior**: A ação a tomar quando todos os critérios são atendidos (ex.: executar uma function, definir um header, redirecionar).

As regras são avaliadas em ordem. O behavior da primeira regra correspondente é aplicado. Se nenhuma regra corresponder, a requisição é processada normalmente.

---

## Passos

### 1. Abrir o Rules Engine

Dentro da Edge Application, acesse a aba **Rules Engine**.

### 2. Criar uma nova regra

Clique em **Add Rule**. Escolha a **fase** em que a regra deve rodar:

- **Request Phase**: Avaliada antes de a requisição ser encaminhada ao cache ou à origem. Use quando a function precisar inspecionar ou modificar a requisição recebida, autenticar o usuário ou retornar uma resposta diretamente.
- **Response Phase**: Avaliada após a origem ou o cache retornar uma resposta, antes da entrega ao cliente. Use quando a function precisar modificar ou enriquecer a resposta de saída.

### 3. Configurar os critérios

Defina as condições que devem ser verdadeiras para que a regra se aplique. Cada condição é composta por uma **variável** (o que inspecionar), um **operador** (como comparar) e um **valor** (com o que comparar).

Operadores disponíveis:

| Operador | Requer um valor | Descrição |
|---|:---:|---|
| `is equal` | ✓ | O valor da variável corresponde exatamente à string especificada. |
| `is not equal` | ✓ | O valor da variável não corresponde exatamente à string especificada. |
| `starts with` | ✓ | O valor da variável começa com a string especificada. |
| `does not start with` | ✓ | O valor da variável não começa com a string especificada. |
| `matches` | ✓ | O valor da variável corresponde à expressão regular especificada. |
| `does not match` | ✓ | O valor da variável não corresponde à expressão regular especificada. |
| `exists` | — | A variável tem qualquer valor. |
| `does not exist` | — | A variável não tem valor. |

Exemplos comuns usando `Request URI`:

| Operador | Valor | Significado |
|---|---|---|
| `starts with` | `/api` | Corresponde a qualquer caminho sob `/api` |
| `is equal` | `/login` | Corresponde apenas ao caminho `/login` |
| `does not start with` | `/public` | Corresponde a qualquer caminho que não esteja sob `/public` |
| `matches` | `^/products/[0-9]+$` | Corresponde a caminhos como `/products/42` usando regex |

Você pode combinar múltiplas condições usando **And** (todas devem corresponder) ou **Or** (qualquer uma deve corresponder).

### 4. Adicionar o behavior "Run Function"

Na seção **Behaviors**, clique em **Add Behavior** e selecione **Run Function**. Em seguida, escolha a instance no dropdown.

:::note Uma function por regra
Cada regra pode invocar uma function instance. Se você precisar executar múltiplas functions para a mesma requisição, crie regras separadas — uma por function — que compartilhem os mesmos critérios.
:::

### 5. Salvar a regra

Clique em **Save**. A regra fica imediatamente ativa e será avaliada na próxima requisição correspondente.

---

## Exemplo: executando uma function para um caminho específico

A configuração a seguir invoca a instance `AuthFunction - Production` para todas as requisições a caminhos que começam com `/protected`:

- **Phase**: Request
- **Criteria**: `If Request URI` → `starts with` → `/protected`
- **Behavior**: `Run Function` → `AuthFunction - Production`

Qualquer requisição a `/protected/dashboard` ou `/protected/settings` acionará a function. Requisições a `/public` ou `/` não serão afetadas.

---

## Combinando functions com outros behaviors

Uma regra pode ter múltiplos behaviors. Por exemplo, você pode executar uma function e também adicionar um header de requisição na mesma regra:

- **Behavior 1**: `Run Function` → `MyFunction - Instance`
- **Behavior 2**: `Add Request Header` → `X-Processed-By: edge`

Os behaviors são aplicados na ordem em que estão listados. Se sua function usa `event.respondWith()` para retornar uma resposta diretamente, behaviors que vêm depois dela no pipeline de resposta podem não se aplicar.

A tabela a seguir lista os behaviors disponíveis no Rules Engine:

| Behavior | Módulo Necessário | Descrição |
|---|---|---|
| **Add Request Cookie** | Application Accelerator | Adiciona um cookie à requisição antes de ela chegar à origem. |
| **Add Request Header** | — | Adiciona ou substitui um header na requisição recebida. |
| **Bypass Cache** | Application Accelerator | Força a requisição a ignorar o cache e ir diretamente à origem. |
| **Capture Match Groups** | Application Accelerator | Captura partes do URI usando regex, disponibilizando os grupos capturados para outros behaviors na mesma regra. |
| **Deliver** | — | Entrega a resposta ao cliente e encerra a avaliação de regras. |
| **Deny (403 Forbidden)** | — | Retorna imediatamente uma resposta 403 ao cliente. |
| **Filter Request Cookie** | Application Accelerator | Remove um cookie da requisição. |
| **Filter Request Header** | — | Remove um header da requisição. |
| **Forward Cookies** | Application Accelerator | Encaminha cookies do cliente ao servidor de origem. |
| **No Content (204)** | — | Retorna imediatamente uma resposta 204 No Content ao cliente. |
| **Optimize Images** | Application Accelerator | Aplica otimização automática de imagens — conversão de formato, redimensionamento e compressão — às respostas de imagem. |
| **Redirect HTTP to HTTPS** | — | Redireciona requisições HTTP para HTTPS com uma resposta 301. |
| **Redirect To (301 Moved Permanently)** | — | Redireciona permanentemente o cliente para uma URL especificada. |
| **Redirect To (302 Found)** | — | Redireciona temporariamente o cliente para uma URL especificada. |
| **Rewrite Request** | Application Accelerator | Reescreve o URI da requisição antes de ela chegar ao cache ou à origem. |
| **Run Function** | Edge Functions | Invoca uma Function Instance. |
| **Set Cache Policy** | — | Aplica uma configuração específica de TTL de cache à requisição. |
| **Set Connector** | — | Roteia a requisição por um conector específico, como uma origem privada ou load balancer. |

---

## Próximo passo

Para entender como as functions interagem com cache, origem e outros módulos ao longo do ciclo de vida completo da requisição, veja [Integração com a Application](./application-integration.md).
