---
title: Testar e Observar
sidebar_position: 5
description: Acesse sua function deployada pelo domínio e observe os logs de execução.
---

# Testar e Observar

Com o workload criado e propagado, sua function está no ar. Nesta etapa final, você vai acessá-la pelo navegador e verificar os logs em tempo real para confirmar que está funcionando corretamente.

## Acessar seu domínio

Abra um navegador e acesse `potd.azion.app/pokemon-of-the-day`. Você verá uma página com o sprite, o nome e o tipo de um Pokémon — buscado em tempo real da PokéAPI no edge.

<video width="100%" controls style={{borderRadius: '8px'}}>
  <source src="https://github.com/luigivieira/azion-docs/releases/download/media-v1/Acessing.the.domain.mp4" type="video/mp4" />
</video>

Atualize a página algumas vezes — cada requisição escolhe um Pokémon aleatório, então você deve ver um diferente a cada vez.

:::tip Ainda não carregou?
Se a página retornar `404` ou não carregar, aguarde alguns minutos para a propagação ser concluída e tente novamente.
:::

## Verificar os logs

A Azion fornece logs de execução em tempo real para suas functions. Isso é útil para confirmar que sua function está sendo invocada, inspecionar seu comportamento e depurar problemas.

<video width="100%" controls style={{borderRadius: '8px'}}>
  <source src="https://github.com/luigivieira/azion-docs/releases/download/media-v1/Seeing.the.logs.in.the.function.mp4" type="video/mp4" />
</video>

Para visualizar os logs:

1. No **Azion Console**, vá até **Observe** → **Real-Time Logs** (ou navegue até a página de detalhes da sua function e abra a aba **Logs**, dependendo da versão do seu Console).
2. Dispare uma nova requisição atualizando seu domínio no navegador.
3. Acompanhe as entradas de log aparecerem em tempo real.

:::info O que você verá nos logs
Cada invocação gera uma entrada de log com detalhes sobre a requisição — incluindo timestamp, status e qualquer saída da sua function. Se sua function lançar um erro, o stack trace aparecerá aqui.
:::

## O que você conquistou

Você concluiu o fluxo completo de Getting Started das Azion Edge Functions:

| Etapa | O que você fez |
|------|-------------|
| **Pré-requisitos** | Configurou sua conta na Azion |
| **Criar uma Function** | Escreveu uma function que busca e renderiza dados de Pokémon |
| **Criar uma Application** | Criou uma Edge Application e a configurou para executar sua function |
| **Criar um Workload** | Expôs a application por um domínio público |
| **Testar e Observar** | Acessou a function no ar e inspecionou seus logs |

## Para onde ir agora

- **[Arquitetura da Plataforma](../platform-integration/functions-in-platform-architecture)** — entenda como as Edge Functions se encaixam na arquitetura mais ampla da Azion.
- **[Modelo de Execução](../runtime-reference/execution-model)** — aprenda como as functions são inicializadas, executadas e encerradas.
- **[Runtime APIs](../runtime-reference/runtime-apis)** — explore as APIs disponíveis dentro do runtime das functions.
