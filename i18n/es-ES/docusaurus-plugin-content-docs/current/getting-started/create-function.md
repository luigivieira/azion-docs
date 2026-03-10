---
title: Cree su Primera Función
sidebar_position: 2
description: Guía paso a paso para crear su primera Azion Edge Function.
---

# Cree su Primera Función

Una Edge Function contiene el código que se ejecuta cuando una solicitud llega al borde. En este paso, escribirá una función que obtiene un Pokémon aleatorio de la PokéAPI y devuelve una página HTML como respuesta.

<video width="100%" controls style={{borderRadius: '8px'}}>

  <source src="https://github.com/luigivieira/azion-docs/releases/download/media-v1/Creating.the.function.mp4" type="video/mp4" />
</video>

## Pasos

### 1. Abrir Edge Functions

En la **Consola de Azion**, vaya a **Build** → **Edge Functions** en la barra lateral izquierda.

### 2. Crear una nueva función

Haga clic en **Add Function**. Nómbrela `PokemonOfTheDay - Function`.

### 3. Escribir el código

En la pestaña **Code**, reemplace el contenido predeterminado por el siguiente:

```js
const handleRequest = async (_args) => {
  const id = Math.floor(Math.random() * 1025) + 1;

  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();

  const name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
  const types = data.types.map((t) => t.type.name).join(", ");

  const html = `
    <div style="font-family: sans-serif; text-align: center; padding: 2rem;">
      <img src="${data.sprites.front_default}" alt="${name}" width="256" height="256" style="image-rendering: pixelated;" />
      <h1>${name}</h1>
      <p>${types}</p>
    </div>`;

  return new Response(html, {
    headers: { "content-type": "text/html;charset=UTF-8" },
  });
};

addEventListener("fetch", (event) => {
  return event.respondWith(handleRequest(event.args));
});
```

### 4. Guardar

Haga clic en **Save** para guardar la función. Todavía no se produce ningún despliegue — la función se guarda en su cuenta y está lista para ser adjuntada a una Edge Application.

:::tip Cómo funciona
Cada vez que esta función recibe una solicitud, elige un ID de Pokémon aleatorio entre 1 y 1025, obtiene sus datos de la PokéAPI y devuelve una página HTML estilizada con la imagen, el nombre y los tipos del Pokémon. Cada solicitud puede devolver un Pokémon diferente.
:::

## Siguiente paso

Con la función guardada, proceda a [Crear una Aplicación](./create-application).
