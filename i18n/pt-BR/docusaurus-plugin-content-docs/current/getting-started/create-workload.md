---
title: Criar um Workload
sidebar_position: 4
description: Crie um Workload para expor sua Edge Application via um domínio público.
---

# Criar um Workload

Um **Workload** vincula sua Edge Application a um domínio, tornando-a acessível na internet. Sem esta etapa, a application existe, mas não tem um endereço público para receber tráfego.

<video width="100%" controls style={{borderRadius: '8px'}}>
  <source src="https://github.com/luigivieira/azion-docs/releases/download/media-v1/Creating.the.workload.mp4" type="video/mp4" />
</video>

## Etapas

### 1. Abrir Workloads

No **Azion Console**, vá até **Deliver** → **Workloads** na barra lateral esquerda.

### 2. Criar um novo workload

Clique em **Add Workload**. Nomeie-o como `PokemonOfTheDay`.

### 3. Vincular à sua application

No campo **Edge Application**, selecione `PokemonOfTheDay - Application`.

### 4. Configurar o domínio

Para este guia, selecione **Azion domain** como tipo de domínio e use `potd` como prefixo de subdomínio. A Azion atribuirá `potd.azion.app` como o endereço público do seu workload.

### 5. Salvar o workload

Clique em **Save**. A Azion começará a propagar a configuração para os edge nodes ao redor do mundo.

Além do seu domínio personalizado (`potd.azion.app`), a Azion atribui automaticamente um **workload domain** no formato `<hash>.map.azionedge.net` (por exemplo, `qzlboudy4am.map.azionedge.net`). Esse endereço é exibido na página de detalhes do workload e tende a ficar disponível antes do domínio personalizado — útil para uma verificação rápida enquanto a propagação ainda está em andamento.

:::info Tempo de propagação
Na primeira vez que um workload é criado, a propagação leva alguns minutos, pois a configuração é distribuída para os edge nodes ao redor do mundo. Atualizações subsequentes no mesmo workload e application propagam de forma significativamente mais rápida.

Durante a propagação inicial, as requisições podem retornar `404` ou timeout — isso é esperado.
:::

## Próximo passo

Assim que a propagação for concluída, prossiga para [Testar e Observar](./test-and-observe) para acessar sua function e verificar os logs.
