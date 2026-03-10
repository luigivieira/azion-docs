---
title: Crear una Aplicación
sidebar_position: 3
description: Cree una Edge Application e instancie su función.
---

# Crear una Aplicación

Una **Edge Application** es el contenedor que se ejecuta en el borde y determina cómo se manejan las solicitudes entrantes. En este paso, creará una, instanciará su función dentro de ella y configurará las reglas que definen cuándo y cómo se ejecuta la función.

<video width="100%" controls style={{borderRadius: '8px'}}>

  <source src="https://github.com/luigivieira/azion-docs/releases/download/media-v1/Creating.the.application.mp4" type="video/mp4" />
</video>

## Pasos

### 1. Abrir Edge Applications

En la **Consola de Azion**, vaya a **Build** → **Edge Applications** en la barra lateral izquierda.

### 2. Crear una nueva aplicación

Haga clic en **Add Application**. Nómbrela `PokemonOfTheDay - Application`.

:::info Edge Functions debe estar habilitado
En la página de configuración de la aplicación, asegúrese de que el módulo **Edge Functions** esté habilitado. Esto permite que la aplicación ejecute funciones en respuesta a las solicitudes.
:::

### 3. Crear una Instancia de Función

Antes de que la aplicación pueda ejecutar su función, debe crear una **instancia** — una referencia que vincula la función a esta aplicación específica.

Vaya a la pestaña **Functions** dentro de su aplicación y haga clic en **Add Function**. Nombre la instancia `PokemonOfTheDay - Function - Instance` y seleccione `PokemonOfTheDay - Function` de la lista de funciones.

:::note ¿Qué es una Instancia de Función?
Una Instancia de Función no es la función en sí misma — es un puntero a ella dentro del contexto de una aplicación. Esto permite que la misma función se reutilice en múltiples aplicaciones con diferentes configuraciones.
:::

### 4. Crear la Regla de Solicitud (Request Rule)

Vaya a la pestaña **Rules Engine** y cree una nueva regla para la **Fase de Solicitud (Request Phase)**. Nómbrela `PokemonOfTheDay - Rule - Request`.

Configúrela de la siguiente manera:

- **Criteria**: `If Request URI` → `starts with` → `/pokemon-of-the-day`
- **Behavior**: `Run Function` → seleccione `PokemonOfTheDay - Function - Instance`

Guarde la regla.

Esta regla le indica a la aplicación: cada vez que llegue una solicitud para `/pokemon-of-the-day`, ejecute la función.

### 5. Crear la Regla de Respuesta (Response Rule)

Aún en **Rules Engine**, cree una segunda regla para la **Fase de Respuesta (Response Phase)**. Nómbrela `PokemonOfTheDay - Response`.

Configúrela de la siguiente manera:

- **Criteria**: mismo path — `If Request URI` → `starts with` → `/pokemon-of-the-day`
- **Behavior**: `Enable Gzip`

Guarde la regla.

:::tip ¿Por qué Gzip?
Habilitar la compresión Gzip en la fase de respuesta reduce el tamaño de la carga útil HTML entregada al navegador, mejorando el tiempo de carga — especialmente útil para respuestas que incluyen patrones de marcado repetidos.
:::

### 6. Guardar la aplicación

Todos los cambios en el Rules Engine se guardan por regla. Asegúrese de que ambas reglas estén guardadas antes de continuar.

## Siguiente paso

La aplicación está configurada pero aún no es accesible desde internet. Proceda a [Crear un Workload](./create-workload) para exponerla.
