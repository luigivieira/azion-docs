---
title: Functions na Arquitetura da Plataforma
sidebar_position: 1
description: Como as Functions se encaixam na arquitetura mais ampla da plataforma Azion.
---

# Functions na Arquitetura da Plataforma

Na plataforma Azion, as Edge Functions não existem isoladamente. Elas fazem parte de uma arquitetura hierárquica projetada para fornecer gerenciamento centralizado, distribuição global e execução orientada a eventos.

Em alto nível, uma requisição flui assim:

> **Usuário** → **Workload** (domínio) → **Edge Application ou Edge Firewall** → **Rules Engine** → **Edge Function**

---

## 1. A Hierarquia Arquitetural

Para executar uma function na Azion Edge Network, ela deve ser integrada à seguinte estrutura:

**Workload > Edge Application / Edge Firewall > Function Instance > Edge Function**

- **Workload**: O contêiner de nível superior que gerencia domínios, registros DNS, certificados digitais e protocolos de rede. É o ponto de entrada de todo o tráfego.
- **Edge Application**: A base para processamento de requisições, cache e roteamento. Functions usadas para lógica de negócio — redirecionamentos, personalização, proxy de API — residem aqui.
- **Edge Firewall**: Um contexto focado em segurança para implementar lógica de proteção personalizada, rate limiting e controle de acesso. Functions aqui são executadas antes mesmo de as requisições chegarem à camada da application.
- **Function Instance**: Uma referência que vincula uma function específica a uma application ou firewall. É o que o Rules Engine invoca. Veja [O Que É uma Function Instance](./what-is-a-function-instance.md).

## 2. Disparando Functions: O Rules Engine

Por padrão, as functions não são executadas para toda requisição. O **Rules Engine** determina _quando_ e _onde_ uma function roda, usando um modelo de **Criteria & Behavior**:

1. **Criteria**: Condições avaliadas contra a requisição — por exemplo, "se o caminho começa com `/api`".
2. **Behavior**: A ação tomada quando os critérios são atendidos — por exemplo, "Executar Function Instance X".

Esse modelo condicional significa que você tem controle preciso sobre a execução. Uma única application pode ter múltiplas regras direcionando caminhos diferentes, com cada regra invocando uma function instance diferente.

Para mais informações sobre como as regras funcionam, veja [Vinculando Instances a Regras](./linking-instances-to-rules.md).

## 3. Contextos de Execução e Tipos de Eventos

As Edge Functions são orientadas a eventos. Os eventos que elas recebem dependem de onde são instanciadas.

### Fetch Events (Edge Applications)

Functions dentro de uma Edge Application respondem a eventos `fetch`, disparados por requisições HTTP recebidas. Elas podem inspecionar e modificar requisições e respostas em duas fases:

- **Request Phase**: Executada antes de a requisição chegar ao cache ou à origem. Use para verificações de autenticação, redirecionamentos, reescrita de requisições ou computação de uma resposta diretamente.
- **Response Phase**: Executada após a origem ou o cache produzir uma resposta, antes da entrega ao cliente. Use para injeção de headers, transformação de resposta ou logging.

### Firewall Events (Edge Firewall)

Functions dentro de um Edge Firewall respondem a eventos `firewall`. Elas são executadas no edge da rede antes de a requisição ser entregue à camada da application — tornando-as ideais para mitigação de bots, verificação de assinatura personalizada, bloqueio de IP e outras lógicas de segurança.

## 4. Por Que Essa Arquitetura Importa

Esse design em camadas garante que as functions sejam:

- **Condicionais**: O Rules Engine previne execuções desnecessárias. As functions só rodam quando critérios relevantes são atendidos, mantendo baixas a latência e o uso de computação.
- **Reutilizáveis**: O mesmo código de function pode ser instanciado em múltiplas applications ou firewalls, cada um com sua própria configuração via JSON de Arguments.
- **Combináveis**: As functions coexistem com outros behaviors no Rules Engine — cache, compressão, redirecionamentos — dando a você controle refinado sobre o ciclo de vida completo de requisição/resposta.
