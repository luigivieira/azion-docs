---
title: Qué son las Functions
sidebar_position: 1
description: Aprenda qué son las Azion Edge Functions y cómo funcionan.
---

# Qué son las Functions

Las Azion Edge Functions son funciones serverless basadas en eventos que ejecutan lógica en la Red de Borde (Edge Network) de Azion. Al ejecutarse cerca de sus usuarios, proporcionan una forma potente de personalizar cómo se manejan las solicitudes y respuestas, implementar lógica de seguridad o construir microservicios completos en el borde.

---

## 1. ¿Qué es Serverless?

Serverless es un modelo de ejecución en la nube donde puede escribir y desplegar código sin preocuparse por la infraestructura subyacente.

- **Gestión Cero**: No necesita aprovisionar, configurar ni escalar servidores.
- **Escalado Automático**: La plataforma maneja automáticamente los picos de tráfico escalando el entorno de ejecución según sea necesario.
- **Pago por uso**: En lugar de pagar por el tiempo de inactividad del servidor, solo paga por el tiempo de ejecución y los recursos que sus funciones realmente utilizan.

En el ecosistema de Azion, esto significa que usted se enfoca únicamente en su lógica de negocio, mientras que Azion se encarga de la distribución y ejecución global.

## 2. El Runtime: Impulsado por V8

Las Azion Edge Functions se ejecutan en el **Azion Runtime**, que está construido sobre el **motor V8** — el mismo motor JavaScript de alto rendimiento que impulsa Google Chrome y Node.js.

### ¿Por qué V8 Isolates?

A diferencia de las plataformas serverless tradicionales que utilizan contenedores (como Docker) o Máquinas Virtuales, Azion utiliza **V8 Isolates**. Esta tecnología permite que cientos de funciones se ejecuten de forma segura dentro de un solo proceso.

- **Eficiencia**: Los Isolates utilizan significativamente menos memoria que los contenedores.
- **Seguridad**: Cada función se ejecuta en su propio entorno aislado (sandbox), independiente de los demás.
- **Velocidad**: Debido a que los Isolates no necesitan arrancar un sistema operativo completo, se inician casi instantáneamente.

## 3. Rendimiento: Arranques en Frío vs en Caliente

Uno de los mayores desafíos en la computación serverless es el **Arranque en Frío (Cold Start)**.

- **Arranque en Frío**: Ocurre cuando una función se ejecuta por primera vez en un nuevo entorno. Las plataformas tradicionales basadas en contenedores pueden tardar segundos en "arrancar". Debido a que Azion utiliza V8 Isolates, los arranques en frío son insignificantes (casi cero).
- **Arranque en Caliente (Warm Start)**: Ocurre cuando una solicitud es manejada por un Isolate ya inicializado. Azion mantiene sus funciones "calientes" después de la primera ejecución, asegurando que las solicitudes subsiguientes se procesen con una latencia aún menor.

## 4. ¿Por qué ejecutar lógica en el Borde?

La ejecución en el Borde (Edge) significa que su código se ejecuta en el punto de presencia (PoP) más cercano al usuario, en lugar de en un centro de datos centralizado (el "origen").

1.  **Menor Latencia**: Los tiempos de ida y vuelta se minimizan porque los datos viajan una distancia más corta.
2.  **Carga Reducida en el Origen**: Puede manejar la validación, la lógica de caché y el redireccionamiento en el borde, de modo que solo las solicitudes necesarias lleguen a sus servidores principales.
3.  **Procesamiento en Tiempo Real**: Ideal para pruebas A/B, personalización y filtrado de seguridad (como el bloqueo de IPs maliciosas) antes de que lleguen a su infraestructura.

---

## Lenguajes Soportados

Las Azion Edge Functions están diseñadas para ser rápidas y flexibles. Puede escribirlas en:

- **JavaScript (ES6+)**: El lenguaje nativo del motor V8.
- **TypeScript**: Soportado mediante transpilación.
- **WebAssembly (Wasm)**: Permitiéndole ejecutar código escrito en lenguajes como Rust, C o Go para tareas de computación intensiva.
