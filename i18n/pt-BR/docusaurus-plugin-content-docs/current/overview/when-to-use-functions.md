---
title: Quando Usar Functions
sidebar_position: 2
description: Entenda os casos de uso e cenários em que as Azion Edge Functions se destacam.
---

# Quando Usar Functions

As Azion Edge Functions são altamente versáteis, mas são mais eficazes quando utilizadas em tarefas que se beneficiam de estar fisicamente próximas ao usuário. Entender quando usá-las — e quando delegar a um backend tradicional — é fundamental para construir uma arquitetura de alto desempenho.

---

## 1. Cenários de Alto Valor (Edge-First)

O principal motivo para usar Edge Functions é a **baixa latência**. Esses cenários representam o "ponto ideal" da computação no edge:

- **Manipulação de Requisições e Respostas**: Adição de headers de segurança (HSTS, CSP), reescrita de URLs ou normalização de query strings antes que elas cheguem à sua origem.
- **Autenticação e Autorização**: Validação de JWTs ou chaves de API no edge para bloquear requisições não autorizadas antes que consumam recursos da origem.
- **Personalização Dinâmica**: Adaptação do conteúdo com base na localização do usuário (GeoIP), tipo de dispositivo ou cookies sem uma ida e volta completa a um banco de dados centralizado.
- **Testes A/B**: Distribuição aleatória ou segmentação de usuários em diferentes grupos e entrega de conteúdo diferente ou redirecionamento instantâneo.

* **Filtragem de Segurança**: Implementação de regras personalizadas de WAF, rate limiting ou proteção contra hotlink.
* **IoT e Dados em Tempo Real**: Pré-processamento e filtragem de dados de telemetria de dispositivos IoT no edge antes de enviá-los a um data lake central.

## 2. Quando Functions NÃO são ideais

As Edge Functions são otimizadas para velocidade e eficiência, não para trabalho pesado. Você deve evitar utilizá-las para:

- **Tarefas Computacionalmente Intensivas**: Codificação de vídeo em larga escala ou simulações complexas.
  :::tip Dica
  Nos casos em que alto desempenho é estritamente necessário para lógica computacionalmente intensa, você pode usar **WebAssembly (Wasm)** para executar código compilado de linguagens como Rust ou C++ em velocidades próximas às nativas.
  :::
- **Processos de Longa Duração**: Tarefas que levam vários minutos para ser concluídas (como gerar um PDF extenso ou executar uma longa migração de dados).
- **Payloads Muito Grandes**: Processamento de arquivos de múltiplos gigabytes em memória.
- **Acesso Direto ao Sistema de Arquivos Local**: O Azion Runtime é um ambiente sandboxed e não fornece acesso tradicional a disco persistente.

## 3. Limites de Execução e Tarefas em Background

Para manter o alto desempenho em toda a rede, as Edge Functions têm limites específicos:

- **Limites de Tempo de CPU**: As functions são projetadas para execuções curtas (tipicamente medidas em milissegundos, embora os limites permitam execuções mais longas dependendo do plano).
- **Sandboxing de Memória**: Cada Isolate tem um limite de memória. O uso excessivo de memória resultará no encerramento do Isolate.

:::info Processamento em Background

Se você precisa realizar uma tarefa que não precisa bloquear a resposta ao usuário (como enviar telemetria ou atualizar um cache), você pode usar o método `event.waitUntil()`. Isso permite que a function continue processando em background após a resposta ter sido entregue.

Exemplos detalhados e guias de implementação para `event.waitUntil()` estão disponíveis na seção [Development](../development/function-structure) desta documentação.
:::

## 4. Dicas e Precauções para Migração

Ao mover código do Node.js ou de outras plataformas serverless, tenha estas dicas em mente:

- **Compatibilidade de API**: O Azion Runtime implementa Web Standard APIs (Fetch, Streams, Web Crypto). Alguns módulos específicos do Node.js (como `fs`, `child_process` ou `net`) não estão disponíveis.
- **Estado Global**: Não confie em variáveis globais para persistir estado entre requisições. Isolates podem ser criados e destruídos com frequência. Use o **Azion KV Storage** para estado persistente.
- **Sem Conexões Persistentes**: As edge functions têm vida curta. Evite manter conexões WebSocket de longa duração ou conexões persistentes com banco de dados ativas dentro da function.
- **FS Local**: Se seu código espera ler/escrever em `/tmp` ou em diretórios locais, você deve migrar essa lógica para usar um serviço de armazenamento externo ou o Edge Storage da Azion.

---

### Precisa de mais poder?

Se sua tarefa excede os limites do edge, considere uma **Abordagem Híbrida**:

1. Trate a requisição inicial e a validação no **Edge**.
2. Delegue o processamento pesado a uma **Fila** ou a um **Backend Tradicional** (Origem).
3. Use `event.waitUntil` para acionar esses processos em background sem atrasar o usuário.
