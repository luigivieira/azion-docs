---
title: Ciclo de Vida da Requisição
sidebar_position: 3
description: O ciclo de vida de uma requisição na plataforma Azion e nas Functions.
---

# Ciclo de Vida da Requisição

Uma requisição a uma aplicação Azion passa pelas seguintes etapas:

1. **Requisição do Cliente** — O navegador ou cliente do usuário envia uma requisição HTTP.
2. **Edge Node** — A requisição é recebida no edge node mais próximo da Azion.
3. **Aplicação** — A requisição é associada a uma Edge Application.
4. **Rules Engine** — O Rules Engine avalia condições e aplica comportamentos.
5. **Function Instance** — Se um comportamento de Function for acionado, uma Function Instance é invocada.
6. **Execução da Function** — A Edge Function executa sua lógica.
7. **Origem / Storage / Resposta** — A função retorna uma resposta, faz proxy para a origem ou busca do Edge Storage.

Esta página é um espaço reservado e será expandida com documentação detalhada.
