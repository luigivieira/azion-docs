---
title: Criar uma Application
sidebar_position: 3
description: Crie uma Edge Application e instancie sua function.
---

# Criar uma Application

Uma **Edge Application** é o container que é executado no edge e determina como as requisições recebidas são tratadas. Nesta etapa, você vai criar uma, instanciar sua function dentro dela e configurar as regras que definem quando e como a function é executada.

<video width="100%" controls style={{borderRadius: '8px'}}>
  <source src="https://github.com/luigivieira/azion-docs/releases/download/media-v1/Creating.the.application.mp4" type="video/mp4" />
</video>

## Etapas

### 1. Abrir Edge Applications

No **Azion Console**, vá até **Build** → **Edge Applications** na barra lateral esquerda.

### 2. Criar uma nova application

Clique em **Add Application**. Nomeie-a como `PokemonOfTheDay - Application`.

:::info Edge Functions deve estar habilitado
Na página de configurações da application, certifique-se de que o módulo **Edge Functions** está habilitado. Isso permite que a application execute functions em resposta às requisições.
:::

### 3. Criar uma Function Instance

Antes que a application possa executar sua function, você precisa criar uma **instância** — uma referência que vincula a function a essa application específica.

Vá até a aba **Functions** dentro da sua application e clique em **Add Function**. Nomeie a instância como `PokemonOfTheDay - Function - Instance` e selecione `PokemonOfTheDay - Function` na lista de functions.

:::note O que é uma Function Instance?
Uma Function Instance não é a function em si — é um ponteiro para ela dentro do contexto de uma application. Isso permite que a mesma function seja reutilizada em várias applications com configurações diferentes.
:::

### 4. Criar a Regra de Requisição

Vá até a aba **Rules Engine** e crie uma nova regra para a **Request Phase**. Nomeie-a como `PokemonOfTheDay - Rule - Request`.

Configure-a da seguinte forma:

- **Criteria**: `If Request URI` → `starts with` → `/pokemon-of-the-day`
- **Behavior**: `Run Function` → selecione `PokemonOfTheDay - Function - Instance`

Salve a regra.

Essa regra instrui a application: sempre que uma requisição chegar para `/pokemon-of-the-day`, execute a function.

### 5. Criar a Regra de Resposta

Ainda em **Rules Engine**, crie uma segunda regra para a **Response Phase**. Nomeie-a como `PokemonOfTheDay - Response`.

Configure-a da seguinte forma:

- **Criteria**: mesmo caminho — `If Request URI` → `starts with` → `/pokemon-of-the-day`
- **Behavior**: `Enable Gzip`

Salve a regra.

:::tip Por que Gzip?
Habilitar a compressão Gzip na fase de resposta reduz o tamanho do payload HTML entregue ao navegador, melhorando o tempo de carregamento — especialmente útil para respostas que contêm padrões de markup repetidos.
:::

### 6. Salvar a application

Todas as alterações no Rules Engine são salvas por regra. Certifique-se de que ambas as regras estejam salvas antes de prosseguir.

## Próximo passo

A application está configurada, mas ainda não é acessível pela internet. Prossiga para [Criar um Workload](./create-workload) para expô-la.
