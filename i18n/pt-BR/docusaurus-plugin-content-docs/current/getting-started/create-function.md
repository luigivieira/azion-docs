---
title: Criar Sua Primeira Function
sidebar_position: 2
description: Guia passo a passo para criar sua primeira Azion Edge Function.
---

# Criar Sua Primeira Function

Uma Edge Function contém o código que é executado quando uma requisição chega ao edge. Nesta etapa, você vai escrever uma function que busca um Pokémon aleatório na PokéAPI e retorna uma página HTML como resposta.

<video width="100%" controls style={{borderRadius: '8px'}}>
  <source src="https://github.com/luigivieira/azion-docs/releases/download/media-v1/Creating.the.function.mp4" type="video/mp4" />
</video>

## Etapas

### 1. Abrir Edge Functions

No **Azion Console**, vá até **Build** → **Edge Functions** na barra lateral esquerda.

### 2. Criar uma nova function

Clique em **Add Function**. Nomeie-a como `PokemonOfTheDay - Function`.

### 3. Escrever o código

Na aba **Code**, substitua o conteúdo padrão pelo seguinte:

```js
const handleRequest = async (_args) => {
  const id = Math.floor(Math.random() * 1025) + 1;

  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();

  const name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
  const types = data.types.map(t => t.type.name).join(", ");

  const html = `
    <div style="font-family: sans-serif; text-align: center; padding: 2rem;">
      <img src="${data.sprites.front_default}" alt="${name}" width="256" height="256" style="image-rendering: pixelated;" />
      <h1>${name}</h1>
      <p>${types}</p>
    </div>`;

  return new Response(html, {
    headers: { "content-type": "text/html;charset=UTF-8" }
  });
};

addEventListener("fetch", event => {
  return event.respondWith(handleRequest(event.args));
});
```

### 4. Salvar

Clique em **Save** para armazenar a function. Nenhum deploy acontece ainda — a function é salva na sua conta e está pronta para ser vinculada a uma Edge Application.

:::tip Como funciona
Cada vez que essa function recebe uma requisição, ela escolhe um ID de Pokémon aleatório entre 1 e 1025, busca seus dados na PokéAPI e retorna uma página HTML estilizada com o sprite, o nome e os tipos do Pokémon. Cada requisição pode retornar um Pokémon diferente.
:::

## Próximo passo

Com a function salva, prossiga para [Criar uma Application](./create-application).
