---
title: Create Your First Function
sidebar_position: 2
description: Step-by-step guide to create your first Azion Edge Function.
---

# Create Your First Function

An Edge Function contains the code that runs when a request hits the edge. In this step, you'll write a function that fetches a random Pokémon from the PokéAPI and returns an HTML page as the response.

<video width="100%" controls style={{borderRadius: '8px'}}>
  <source src="https://github.com/luigivieira/azion-docs/releases/download/media-v1/Creating.the.function.mp4" type="video/mp4" />
</video>

## Steps

### 1. Open Edge Functions

In **Azion Console**, go to **Build** → **Edge Functions** in the left sidebar.

### 2. Create a new function

Click **Add Function**. Give it a name — for example, `pokemon-function`.

### 3. Write the code

In the **Code** tab, replace the default content with the following:

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

### 4. Save

Click **Save** to store the function. No deployment happens yet — the function is saved to your account and ready to be attached to an Edge Application.

:::tip How it works
Every time this function receives a request, it picks a random Pokémon ID between 1 and 1025, fetches its data from the PokéAPI, and returns a styled HTML page with the Pokémon's sprite, name, and types. Each request may return a different Pokémon.
:::

## Next step

With the function saved, proceed to [Create an Application](./create-application).
