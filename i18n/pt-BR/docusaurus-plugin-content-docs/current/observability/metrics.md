---
title: Metrics
sidebar_position: 3
description: Métricas disponíveis para as Azion Edge Functions.
---

# Metrics

As métricas oferecem uma visão agregada do desempenho das suas Edge Functions ao longo do tempo. Enquanto os logs mostram o que aconteceu em uma invocação específica, as métricas respondem perguntas de nível mais alto: quantas requisições minha função está processando? As invocações estão vindo de applications ou firewalls?

---

## 1. Real-Time Metrics

O **Real-Time Metrics** fornece visualização em gráficos de dados agregados das suas funções. Os dados são obtidos via Azion GraphQL API e exibidos em tempo quase real, com um atraso máximo de agregação de **10 minutos**. Os dados históricos são retidos por **2 anos**.

Para acessar as métricas de função:

1. Acesse **Azion Console** → **Observe** → **Real-Time Metrics**.
2. Selecione a aba **Build**.
3. Clique em **Functions**.

### Gráficos disponíveis

| Gráfico | Descrição |
|---|---|
| **Total Invocations** | Soma de todas as execuções de função no intervalo de tempo selecionado |
| **Firewall Invocations** | Invocações de funções vinculadas a um Edge Firewall |
| **Applications Invocations** | Invocações de funções vinculadas a uma Edge Application |

Total Invocations é a soma de Firewall Invocations e Applications Invocations.

### Opções de intervalo de tempo

Você pode filtrar por: Última Hora, Últimas 24 Horas, Últimos 7 Dias, Últimos 30 Dias, Últimos 6 Meses ou um intervalo de data/hora personalizado. A visualização **Última Hora** é atualizada automaticamente a cada minuto.

:::info Métricas vs. faturamento
O Real-Time Metrics usa uma abordagem no máximo uma vez, otimizada para desempenho, enquanto o faturamento usa um modelo exatamente uma vez. A diferença média é inferior a 1%. Os dados de faturamento são a referência autoritativa para fins de custo.
:::

---

## 2. Consultando Métricas com a GraphQL API

O Real-Time Metrics usa a **Azion GraphQL API** internamente. Você pode consultar os mesmos dados de forma programática para criar dashboards personalizados, alimentar pipelines de alertas ou integrar métricas a ferramentas externas.

Em qualquer gráfico no Real-Time Metrics, abra o menu de contexto e selecione **Copy Query** para obter a consulta GraphQL exata que popula aquele gráfico.

O endpoint da GraphQL API é:

```
https://api.azionapi.net/metrics/graphql
```

Inclua seu token pessoal no cabeçalho `Authorization`.

---

## 3. Correlacionando Métricas com Logs

Métricas e logs são complementares:

- **Métricas** informam _quantas_ invocações ocorreram e _de onde_ vieram (application vs. firewall).
- **Logs** informam _o que aconteceu_ em cada invocação.

Um fluxo de trabalho típico ao investigar uma anomalia:

1. Observe um pico de invocações no Real-Time Metrics.
2. Reduza o intervalo de tempo para a janela do pico.
3. Alterne para **Real-Time Events** → fonte de dados **Functions** para ver os metadados de invocação (IDs de instância, tempo de execução, tipo de iniciador) naquela janela.
4. Alterne para **Real-Time Events** → **Functions Console** para inspecionar a saída do `console.log()` e os erros da mesma janela.

---

## 4. Identificando o Upstream nos Logs de Application

Quando uma função é invocada a partir de uma Edge Application, a fonte de dados **HTTP Requests** no Real-Time Events registra o upstream como:

```
Upstream Addr = 127.0.0.1:1666
```

Esse valor (`127.0.0.1:1666`) é o endereço do **Azion Cells Runtime** — o ambiente de execução das Edge Functions. Você pode usá-lo para filtrar logs no nível de application e isolar apenas as requisições que acionaram uma função.

---

## 5. Usando o Plugin do Grafana

Para equipes que preferem uma stack de observabilidade local, a Azion oferece um **plugin do Grafana** que se conecta à mesma GraphQL API usada pelo Real-Time Metrics. Com ele, você pode:

- Criar dashboards personalizados combinando invocações de função com outras métricas da Azion (WAF, DNS, Cache).
- Definir regras de alerta baseadas em limites de invocação.
- Compartilhar dashboards com sua equipe.

Consulte a documentação da Azion para instruções de instalação e configuração.

---

## Relacionados

- [Logs](./logs.md) — detalhes por invocação e saída do `console.log()` via Real-Time Events e Data Stream.
- [Debugging](./debugging.md) — técnicas para diagnosticar erros específicos.
- [Performance Optimization](../advanced/performance-optimization.md) — estratégias para reduzir o tempo de computação e o uso de recursos.
