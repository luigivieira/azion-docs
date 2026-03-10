---
title: Probar y Observar
sidebar_position: 5
description: Acceda a su función desplegada a través de su dominio y observe los logs de ejecución.
---

# Probar y Observar

Con el workload creado y propagado, su función está en vivo. En este paso final, accederá a ella a través del navegador y comprobará los logs en tiempo real para confirmar que se está ejecutando correctamente.

## Acceda a su dominio

Abra un navegador y navegue a `potd.azion.app/pokemon-of-the-day`. Debería ver una página con la imagen, el nombre y el tipo de un Pokémon — obtenidos en vivo de la PokéAPI en el borde.

<video width="100%" controls style={{borderRadius: '8px'}}>

  <source src="https://github.com/luigivieira/azion-docs/releases/download/media-v1/Acessing.the.domain.mp4" type="video/mp4" />
</video>

Refresque la página varias veces — cada solicitud elige un Pokémon aleatorio, por lo que debería ver uno diferente cada vez.

:::tip ¿Aún no carga?
Si la página devuelve un `404` o no carga, espere un par de minutos a que se complete la propagación e inténtelo de nuevo.
:::

## Compruebe los logs

Azion proporciona logs de ejecución en tiempo real para sus funciones. Esto es útil para confirmar que su función se está invocando, inspeccionar su comportamiento y depurar problemas.

<video width="100%" controls style={{borderRadius: '8px'}}>

  <source src="https://github.com/luigivieira/azion-docs/releases/download/media-v1/Seeing.the.logs.in.the.function.mp4" type="video/mp4" />
</video>

Para ver los logs:

1. En la **Consola de Azion**, vaya a **Observe** → **Real-Time Logs** (o navegue a la página de detalles de su función y abra la pestaña **Logs**, dependiendo de su versión de la Consola).
2. Active una nueva solicitud refrescando su dominio en el navegador.
3. Observe cómo aparecen las entradas de log en tiempo real.

:::info Qué verá en los logs
Cada invocación genera una entrada de log con detalles sobre la solicitud — incluyendo marca de tiempo, estado y cualquier salida de su función. Si su función lanza un error, el seguimiento de la pila (stack trace) aparecerá aquí.
:::

## Qué logró

Ha completado el flujo completo de Inicio Rápido para Azion Edge Functions:

| Paso                     | Qué hizo                                                          |
| ------------------------ | ----------------------------------------------------------------- |
| **Requisitos Previos**   | Configuró su cuenta de Azion                                      |
| **Crear una Función**    | Escribió una función que obtiene y renderiza datos de Pokémon     |
| **Crear una Aplicación** | Creó una Edge Application y la configuró para ejecutar su función |
| **Crear un Workload**    | Expuso la aplicación a través de un dominio público               |
| **Probar y Observar**    | Accedió a la función en vivo e inspeccionó sus logs               |

## A dónde ir después

- **[Arquitectura de la Plataforma](../platform-integration/functions-in-platform-architecture)** — comprenda cómo encajan las Edge Functions en la arquitectura más amplia de Azion.
- **[Modelo de Ejecución](../runtime-reference/execution-model)** — aprenda cómo se inicializan, ejecutan y terminan las funciones.
- **[APIs de Runtime](../runtime-reference/runtime-apis)** — explore las APIs disponibles dentro del runtime de la función.
