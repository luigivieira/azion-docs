---
title: Límites
sidebar_position: 10
description: Límites técnicos y cuotas para Azion Edge Functions.
---

# Límites

Esta página describe los límites técnicos que se aplican a Azion Edge Functions. Comprender estos límites le ayuda a diseñar funciones que sean confiables en condiciones de producción.

:::info Límites específicos del plan
Algunos límites varían según el plan. Los valores enumerados aquí reflejan los valores predeterminados. Contacte al [Soporte de Azion](https://www.azion.com/es/soporte/) o consulte la documentación de su plan para conocer los límites específicos de su cuenta.
:::

---

## Código y Configuración

| Límite                                                      | Valor |
| ----------------------------------------------------------- | ----- |
| Tamaño máximo del código de la función                      | 1 MB  |
| Tamaño máximo de los Argumentos de la Instancia de Función  | 32 KB |
| Número máximo de funciones por cuenta                       | 100   |
| Número máximo de instancias de función por Edge Application | 10    |
| Número máximo de instancias de función por Edge Firewall    | 10    |

El código de la función se mide como el texto raw de JavaScript guardado en la plataforma. Si utiliza un bundler, la salida combinada debe caber en 1 MB. Los módulos de WebAssembly embebidos como cadenas Base64 cuentan para este límite.

---

## Tiempo de Ejecución

| Límite                                             | Valor            |
| -------------------------------------------------- | ---------------- |
| Tiempo máximo de reloj (wall-clock) por invocación | 30 segundos      |
| Tiempo máximo de CPU por invocación                | Consulte el plan |

El **tiempo de reloj (wall-clock)** es el tiempo total transcurrido desde que se despacha el evento hasta que se entrega la respuesta y se resuelven todas las promesas de `waitUntil`. El tiempo de espera de E/S (tiempo de espera por las respuestas de `fetch()`, búsquedas de DNS, etc.) cuenta contra el límite de tiempo de reloj.

El **tiempo de CPU** es el tiempo de procesamiento real utilizado por su código — el tiempo dedicado a ejecutar JavaScript, no a esperar E/S. Los límites de tiempo de CPU se aplican por separado y suelen ser mucho más bajos que los límites de tiempo de reloj. Si su función excede el presupuesto de tiempo de CPU, se interrumpe.

Para funciones que llaman a APIs externas lentas, configure tiempos de espera explícitos en las llamadas `fetch()` salientes utilizando `AbortController` para evitar que se alcance el límite de tiempo de reloj. Consulte [Llamar a APIs Externas](./development/calling-external-apis.md) para ver el patrón.

---

## Memoria

| Límite                     | Valor  |
| -------------------------- | ------ |
| Memoria máxima por isolate | 128 MB |

Este límite se aplica a toda la memoria utilizada por una sola instancia de isolate: el montón (heap) de JavaScript, la memoria lineal de WebAssembly y cualquier dato almacenado en caché o transmitido retenido en memoria durante la ejecución.

Si su función procesa cuerpos de solicitud o respuesta grandes, considere transmitirlos (streaming) en lugar de almacenar en búfer todo el cuerpo en la memoria. Consulte [Optimización del Rendimiento](./advanced/performance-optimization.md) para ver los patrones de streaming.

---

## Subsolicitudes (Subrequests)

| Límite                                                                       | Valor                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------- |
| Máximo de subsolicitudes por invocación                                      | 50                                                |
| Tamaño máximo del cuerpo de respuesta de la subsolicitud retenido en memoria | Consulte los límites de tiempo de reloj y memoria |

Una **subsolicitud** es cualquier llamada `fetch()` saliente realizada desde una función. Cada llamada cuenta contra el límite de subsolicitudes para esa invocación. Las subsolicitudes a los servicios de Azion (como KV Storage) cuentan igual que las subsolicitudes a hosts externos.

Para mantenerse dentro del límite:

- Almacene en caché las respuestas para los recursos a los que se accede con frecuencia utilizando la API de Cache.
- Paralelice las subsolicitudes independientes con `Promise.all()` (siguen contando individualmente, pero reduce la latencia total).
- Evite patrones recursivos o de "fan-out" donde una sola invocación desencadena una cascada de llamadas `fetch()`.

---

## Logs

| Límite                                          | Valor              |
| ----------------------------------------------- | ------------------ |
| Salida total máxima de `console` por invocación | 100 KB             |
| Retención de logs en Real-Time Events           | 7 días (168 horas) |
| Disponibilidad de logs después de la invocación | ~30 segundos       |

La salida de logs que exceda los 100 KB por invocación puede ser truncada. Prefiera entradas de log estructuradas y compactas (JSON con campos específicos) en lugar de registros detallados en texto plano.

---

## Argumentos de la Instancia de Función

| Límite                               | Valor |
| ------------------------------------ | ----- |
| Tamaño máximo del JSON de Argumentos | 32 KB |

Los argumentos están destinados a valores de configuración: URLs base de API, flags de funciones, claves de firma. No son un sustituto de una base de datos o un archivo de configuración grande. Si su configuración supera los 32 KB, muévala a un servicio de almacenamiento externo accesible a través de `fetch()`.

---

## Qué sucede cuando se supera un límite

| Límite excedido              | Comportamiento                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| Tiempo de CPU                | La función se interrumpe; el cliente recibe un HTTP 500; el error se registra en Real-Time Events |
| Tiempo de reloj (Wall-clock) | La función se interrumpe; el cliente recibe un HTTP 504; el error se registra en Real-Time Events |
| Memoria                      | La función se interrumpe; el cliente recibe un HTTP 500; el error se registra en Real-Time Events |
| Recuento de subsolicitudes   | La llamada `fetch()` que excede el límite lanza un error                                          |
| Tamaño del código            | La función no se puede guardar; la Consola de Azion o la CLI devuelven un error de validación     |

En todos los casos de interrupción, el error es visible en **Real-Time Events** bajo la fuente de datos **Functions Console** con un `LINE_SOURCE` de `RUNTIME`.

---

## Aumentar los límites

Algunos límites se pueden aumentar para cuentas en planes superiores o mediante acuerdos personalizados. Para solicitar un aumento de límite, contacte al [Soporte de Azion](https://www.azion.com/es/soporte/) con detalles sobre su caso de uso y el perfil de tráfico esperado.

---

## Relacionado

- [Modelo de Ejecución](./runtime-reference/execution-model.md) — cómo se aplican el tiempo de CPU y el tiempo de reloj.
- [Optimización del Rendimiento](./advanced/performance-optimization.md) — técnicas para mantenerse dentro de los límites de memoria y subsolicitudes.
- [Logs](./observability/logs.md) — retención de logs y detalles de formato.
