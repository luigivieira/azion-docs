---
title: Crear un Workload
sidebar_position: 4
description: Cree un Workload para exponer su Edge Application a través de un dominio público.
---

# Crear un Workload

Un **Workload** vincula su Edge Application a un dominio, haciéndola accesible en internet. Sin este paso, la aplicación existe pero no tiene una dirección pública para recibir tráfico.

<video width="100%" controls style={{borderRadius: '8px'}}>

  <source src="https://github.com/luigivieira/azion-docs/releases/download/media-v1/Creating.the.workload.mp4" type="video/mp4" />
</video>

## Pasos

### 1. Abrir Workloads

En la **Consola de Azion**, vaya a **Deliver** → **Workloads** en la barra lateral izquierda.

### 2. Crear un nuevo workload

Haga clic en **Add Workload**. Nómbrelo `PokemonOfTheDay`.

### 3. Vincular a su aplicación

En el campo **Edge Application**, seleccione `PokemonOfTheDay - Application`.

### 4. Configurar el dominio

Para esta guía, seleccione **Azion domain** como tipo de dominio y use `potd` como prefijo de subdominio. Azion asignará `potd.azion.app` como la dirección pública para su workload.

### 5. Guardar el workload

Haga clic en **Save**. Azion comenzará a propagar la configuración a los nodos de borde en todo el mundo.

Además de su dominio personalizado (`potd.azion.app`), Azion asigna automáticamente un **dominio de workload** en el formato `<hash>.map.azionedge.net` (por ejemplo, `qzlboudy4am.map.azionedge.net`). Esta dirección se muestra en la página de detalles del workload y suele estar disponible antes que el dominio personalizado — útil para una comprobación rápida mientras la propagación está en curso.

:::info Tiempo de propagación
La primera vez que se crea un workload, la propagación tarda unos minutos mientras la configuración se distribuye a los nodos de borde de todo el mundo. Las actualizaciones posteriores al mismo workload y aplicación se propagan significativamente más rápido.

Durante la propagación inicial, las solicitudes pueden devolver un `404` o tiempo de espera — esto es lo esperado.
:::

## Siguiente paso

Una vez que se complete la propagación, proceda a [Probar y Observar](./test-and-observe) para acceder a su función y comprobar sus logs.
