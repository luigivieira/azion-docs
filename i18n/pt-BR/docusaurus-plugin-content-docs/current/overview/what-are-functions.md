---
title: O que são Functions
sidebar_position: 1
description: Aprenda o que são as Azion Edge Functions e como elas funcionam.
---

# O que são Functions

As Azion Edge Functions são functions serverless orientadas a eventos que executam lógica na Azion Edge Network. Por rodarem próximo aos seus usuários, elas oferecem uma maneira poderosa de personalizar como requisições e respostas são tratadas, implementar lógica de segurança ou construir microserviços inteiros no edge.

---

## 1. O que é Serverless?

Serverless é um modelo de execução em nuvem no qual você pode escrever e fazer o deploy de código sem se preocupar com a infraestrutura subjacente.

- **Zero de gerenciamento**: Você não precisa provisionar, configurar ou escalar servidores.
- **Escalabilidade automática**: A plataforma lida automaticamente com picos de tráfego escalando o ambiente de execução conforme necessário.
- **Pagamento pelo uso**: Em vez de pagar pelo tempo ocioso de servidor, você paga apenas pelo tempo de execução e pelos recursos que suas functions realmente utilizam.

No ecossistema da Azion, isso significa que você se concentra exclusivamente na sua lógica de negócio, enquanto a Azion cuida da distribuição global e da execução.

## 2. O Runtime: Alimentado pelo V8

As Azion Edge Functions rodam no **Azion Runtime**, que é construído sobre o **motor V8** — o mesmo motor JavaScript de alto desempenho que alimenta o Google Chrome e o Node.js.

### Por que V8 Isolates?

Ao contrário das plataformas serverless tradicionais que usam containers (como Docker) ou Máquinas Virtuais, a Azion utiliza **V8 Isolates**. Essa tecnologia permite que centenas de functions rodem com segurança dentro de um único processo.

- **Eficiência**: Isolates usam significativamente menos memória do que containers.
- **Segurança**: Cada function roda em seu próprio ambiente sandboxed, isolado das demais.
- **Velocidade**: Como os Isolates não precisam inicializar um sistema operacional inteiro, eles partem quase instantaneamente.

## 3. Performance: Cold Start vs Warm Start

Um dos maiores desafios na computação serverless é o **cold start**.

- **Cold Start**: Ocorre quando uma function é executada pela primeira vez em um novo ambiente. Plataformas tradicionais baseadas em containers podem levar segundos para "inicializar". Como a Azion usa V8 Isolates, os cold starts são desprezíveis (próximos de zero).
- **Warm Start**: Ocorre quando uma requisição é tratada por um Isolate já inicializado. A Azion mantém suas functions "aquecidas" após a primeira execução, garantindo que requisições subsequentes sejam processadas com latência ainda menor.

## 4. Por que executar lógica no Edge?

A execução no edge significa que seu código roda no ponto de presença (PoP) mais próximo do usuário, em vez de em um data center centralizado (a "origem").

1.  **Menor latência**: Os tempos de ida e volta são minimizados porque os dados percorrem uma distância menor.
2.  **Menor carga na origem**: Você pode tratar validações, lógica de cache e redirecionamentos no edge, de modo que apenas as requisições necessárias cheguem aos seus servidores principais.
3.  **Processamento em tempo real**: Ideal para testes A/B, personalização e filtragem de segurança (como o bloqueio de IPs maliciosos) antes mesmo que eles alcancem sua infraestrutura.

---

## Linguagens Suportadas

As Azion Edge Functions são projetadas para ser rápidas e flexíveis. Você pode escrevê-las em:

- **JavaScript (ES6+)**: A linguagem nativa do motor V8.
- **TypeScript**: Suportado via transpilação.
- **WebAssembly (Wasm)**: Permitindo que você execute código escrito em linguagens como Rust, C ou Go para tarefas computacionalmente intensivas.
