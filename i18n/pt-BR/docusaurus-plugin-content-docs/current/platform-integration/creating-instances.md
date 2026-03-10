---
title: Criando Instances
sidebar_position: 3
description: Como criar uma Function Instance dentro de uma Edge Application ou Edge Firewall.
---

# Criando Instances

Uma Function Instance vincula uma Edge Function a uma Edge Application ou Edge Firewall específica. Você deve criar uma instance antes que o Rules Engine possa invocar sua function.

---

## Pré-requisitos

Antes de criar uma instance:

- Você deve ter uma Edge Function salva na sua conta. Veja [Criar Sua Primeira Function](../getting-started/create-function.md).
- A Edge Application de destino deve ter o módulo **Edge Functions** habilitado. Você pode habilitá-lo na aba **Main Settings** da application.

:::info Módulo Edge Functions
Sem o módulo Edge Functions habilitado, a aba **Functions** não aparece na application e você não pode criar instances. O módulo deve ser explicitamente ativado para cada application que precisar dele.
:::

---

## Passos

### 1. Abrir a Edge Application

No **Azion Console**, acesse **Build** → **Edge Applications** e abra a application onde deseja adicionar a instance.

### 2. Ir para a aba Functions

Selecione a aba **Functions**. Ela lista todas as instances existentes para a application.

### 3. Adicionar uma nova instance

Clique em **Add Function**. Um formulário aparecerá com os seguintes campos:

- **Name**: Um rótulo descritivo para esta instance (ex.: `AuthFunction - Production`). Escolha um nome que facilite identificar a instance no Rules Engine.
- **Edge Function**: A function a vincular. Selecione na lista de functions salvas na sua conta.

### 4. Configurar Arguments (opcional)

Após selecionar uma function, a aba **Arguments** fica disponível. Aqui você pode fornecer um objeto JSON com valores de configuração que sua function lerá de `event.args`.

Por exemplo:

```json
{
  "redirectTo": "https://login.example.com",
  "tokenHeader": "x-auth-token"
}
```

Deixe os Arguments vazios se sua function não usa `event.args`, ou se ela define seus próprios valores padrão.

### 5. Salvar a instance

Clique em **Save**. A instance agora aparece na aba Functions e está disponível para ser referenciada no Rules Engine.

---

## Múltiplas instances a partir de uma function

Você pode criar mais de uma instance a partir da mesma function dentro da mesma application — cada uma com Arguments diferentes. Isso é útil quando você precisa que a mesma lógica se comporte de forma diferente dependendo do caminho ou contexto.

Por exemplo, uma function de rate limiting poderia ter:

- **Instance A** — `{ "limit": 100 }` para o caminho `/api/public`.
- **Instance B** — `{ "limit": 10 }` para o caminho `/api/admin`.

Cada instance seria então referenciada por uma regra diferente no Rules Engine.

---

## Próximo passo

Com a instance criada, configure o Rules Engine para invocá-la. Veja [Vinculando Instances a Regras](./linking-instances-to-rules.md).
