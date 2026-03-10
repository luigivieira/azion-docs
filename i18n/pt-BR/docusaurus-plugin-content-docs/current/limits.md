---
title: Limites
sidebar_position: 10
description: Limites técnicos e cotas para Azion Edge Functions.
---

# Limites

Esta página descreve os limites técnicos que se aplicam às Azion Edge Functions. Entender esses limites ajuda você a projetar functions que sejam confiáveis em condições de produção.

:::info Limites específicos por plano
Alguns limites variam de acordo com o plano. Os valores listados aqui refletem os padrões. Entre em contato com o [Suporte da Azion](https://www.azion.com/pt-br/suporte/) ou verifique a documentação do seu plano para limites específicos da sua conta.
:::

---

## Código e Configuração

| Limite                                                       | Valor |
| ------------------------------------------------------------ | ----- |
| Tamanho máximo do código da function                         | 1 MB  |
| Tamanho máximo dos Arguments da Function Instance            | 32 KB |
| Número máximo de functions por conta                         | 100   |
| Número máximo de instâncias de function por Edge Application | 10    |
| Número máximo de instâncias de function por Edge Firewall    | 10    |

O código da function é medido como o texto JavaScript bruto salvo na plataforma. Se você usa um bundler, a saída combinada deve caber em 1 MB. Módulos WebAssembly incorporados como strings Base64 contam para este limite.

---

## Tempo de Execução

| Limite                                             | Valor        |
| -------------------------------------------------- | ------------ |
| Tempo máximo de relógio (wall-clock) por invocação | 30 segundos  |
| Tempo máximo de CPU por invocação                  | Veja o plano |

**Tempo de relógio (wall-clock)** é o tempo total decorrido desde o disparo do evento até a entrega da resposta e a resolução de todas as promises `waitUntil`. O tempo de espera de E/S (tempo aguardando respostas de `fetch()`, consultas DNS, etc.) conta para o limite de wall-clock.

**Tempo de CPU** é o tempo de computação real usado pelo seu código — o tempo gasto executando JavaScript, não esperando por E/S. Os limites de tempo de CPU são impostos separadamente e normalmente são muito menores do que os limites de wall-clock. Se sua function exceder o orçamento de tempo de CPU, ela será encerrada.

Para functions que chamam APIs externas lentas, defina timeouts explícitos em chamadas `fetch()` de saída usando `AbortController` para evitar que o limite de wall-clock seja atingido. Veja [Chamando APIs Externas](./development/calling-external-apis.md) para o padrão.

---

## Memória

| Limite                     | Valor  |
| -------------------------- | ------ |
| Memória máxima por isolate | 128 MB |

Este limite se aplica a toda a memória usada por uma única instância de isolate — a heap de JavaScript, a memória linear de WebAssembly e quaisquer dados em cache ou transmitidos mantidos em memória durante a execução.

Se sua function processa corpos de requisição ou resposta grandes, considere transmiti-los (streaming) em vez de armazenar todo o corpo em memória. Veja [Otimização de Performance](./advanced/performance-optimization.md) para padrões de streaming.

---

## Sub-requisições

| Limite                                                                   | Valor                                   |
| ------------------------------------------------------------------------ | --------------------------------------- |
| Máximo de sub-requisições por invocação                                  | 50                                      |
| Tamanho máximo do corpo de resposta da sub-requisição mantido em memória | Veja os limites de wall-clock e memória |

Uma **sub-requisição** é qualquer chamada `fetch()` de saída feita de dentro de uma function. Cada chamada conta para o limite de sub-requisições dessa invocação. Sub-requisições para serviços da Azion (como o KV Storage) contam igual a sub-requisições para hosts externos.

Para permanecer dentro do limite:

- Faça o cache de respostas para recursos acessados com frequência usando a Cache API.
- Paralelize sub-requisições independentes com `Promise.all()` (elas ainda contam individualmente, mas você reduz a latência total).
- Evite padrões recursivos ou de fan-out onde uma única invocação dispara uma cascata de chamadas `fetch()`.

---

## Logs

| Limite                                        | Valor              |
| --------------------------------------------- | ------------------ |
| Saída total máxima do `console` por invocação | 100 KB             |
| Retenção de log no Real-Time Events           | 7 dias (168 horas) |
| Disponibilidade de log após a invocação       | ~30 segundos       |

Saídas de log que excedam 100 KB por invocação podem ser truncadas. Prefira entradas de log estruturadas e compactas (JSON com campos específicos) em vez de logs de texto simples excessivamente detalhados.

---

## Arguments da Function Instance

| Limite                              | Valor |
| ----------------------------------- | ----- |
| Tamanho máximo do JSON de Arguments | 32 KB |

Arguments são destinados a valores de configuração — URLs base de API, feature flags, chaves de assinatura. Eles não são um substituto para um banco de dados ou um arquivo de configuração grande. Se sua configuração exceder 32 KB, mova-a para um serviço de armazenamento externo acessível via `fetch()`.

---

## O Que Acontece Quando um Limite é Excedido

| Limite excedido               | Comportamento                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| Tempo de CPU                  | Function é encerrada; cliente recebe HTTP 500; erro registrado no Real-Time Events   |
| Tempo de relógio (wall-clock) | Function é encerrada; cliente recebe HTTP 504; erro registrado no Real-Time Events   |
| Memória                       | Function é encerrada; cliente recebe HTTP 500; erro registrado no Real-Time Events   |
| Contagem de sub-requisições   | A chamada `fetch()` que excede o limite lança um erro                                |
| Tamanho do código             | A function não pode ser salva; o Azion Console ou a CLI retorna um erro de validação |

Em todos os casos de encerramento, o erro é visível no **Real-Time Events** sob a fonte de dados **Functions Console** com um `LINE_SOURCE` de `RUNTIME`.

---

## Aumentando Limites

Alguns limites podem ser aumentados para contas em planos superiores ou através de acordos personalizados. Para solicitar um aumento de limite, entre em contato com o [Suporte da Azion](https://www.azion.com/pt-br/suporte/) com detalhes sobre seu caso de uso e perfil de tráfego esperado.

---

## Relacionado

- [Modelo de Execução](./runtime-reference/execution-model.md) — como o tempo de CPU e o tempo de wall-clock são impostos.
- [Otimização de Performance](./advanced/performance-optimization.md) — técnicas para permanecer dentro dos limites de memória e sub-requisições.
- [Logs](./observability/logs.md) — detalhes de retenção e formato de log.
