---
title: Cuándo usar Functions
sidebar_position: 2
description: Comprenda los casos de uso y escenarios donde destacan las Azion Edge Functions.
---

# Cuándo usar Functions

Las Azion Edge Functions son muy versátiles, pero son más efectivas cuando se utilizan para tareas que se benefician de estar físicamente cerca del usuario. Comprender cuándo usarlas — y cuándo delegar en un backend tradicional — es clave para construir una arquitectura de alto rendimiento.

---

## 1. Escenarios de Alto Valor (Edge-First)

La razón principal para usar Edge Functions es la **baja latencia**. Estos escenarios representan el "punto ideal" para la computación en el borde:

- **Manipulación de Solicitudes y Respuestas**: Agregar cabeceras de seguridad (HSTS, CSP), reescribir URLs o normalizar cadenas de consulta antes de que lleguen a su origen.
- **Autenticación y Autorización**: Validar JWTs o claves de API en el borde para bloquear solicitudes no autorizadas antes de que consuman recursos del origen.
- **Personalización Dinámica**: Adaptar el contenido basado en la ubicación del usuario (GeoIP), el tipo de dispositivo o las cookies sin un viaje de ida y vuelta completo a una base de datos centralizada.
- **Pruebas A/B**: Aleatorizar o segmentar a los usuarios en diferentes grupos y servir diferentes contenidos o redirigirlos instantáneamente.
- **Filtrado de Seguridad**: Implementar reglas de WAF personalizadas, limitación de tasa (rate limiting) o protección contra "hotlinking".
- **IoT y Datos en Tiempo Real**: Preprocesar y filtrar datos de telemetría de dispositivos IoT en el borde antes de enviarlos a un lago de datos central.

## 2. Cuándo las Functions NO son ideales

Las Edge Functions están optimizadas para la velocidad y la eficiencia, no para trabajos pesados. Debe evitar usarlas para:

- **Tareas de Computación Intensiva**: Codificación de video a gran escala o simulaciones complejas.
  :::tip Consejo
  En casos donde se requiere estrictamente un alto rendimiento para la lógica de computación intensiva, puede usar **WebAssembly (Wasm)** para ejecutar código compilado de lenguajes como Rust o C++ a velocidades casi nativas.
  :::
- **Procesos de Larga Duración**: Tareas que tardan varios minutos en completarse (como generar un PDF masivo o ejecutar una migración de datos larga).
- **Cargas Útiles Muy Grandes**: Procesar archivos de varios gigabytes en memoria.
- **Acceso Directo al Sistema de Archivos Local**: El Azion Runtime es un entorno aislado y no proporciona acceso tradicional a disco persistente.

## 3. Límites de Ejecución y Tareas en Segundo Plano

Para mantener un alto rendimiento en toda la red, las Edge Functions tienen límites específicos:

- **Límites de Tiempo de CPU**: Las funciones están diseñadas para ráfagas cortas de ejecución (normalmente medidas en milisegundos, aunque los límites permiten ráfagas más largas dependiendo del plan).
- **Aislamiento de Memoria (Sandboxing)**: Cada Isolate tiene un límite de memoria. El uso excesivo de memoria resultará en la terminación del Isolate.

:::info Procesamiento en Segundo Plano

Si necesita realizar una tarea que no necesita bloquear la respuesta al usuario (como enviar telemetría o actualizar una caché), puede usar el método `event.waitUntil()`. Esto permite que la función continúe procesando en segundo plano después de que se haya entregado la respuesta.

Hay ejemplos detallados y guías de implementación para `event.waitUntil()` disponibles en la sección de [Desarrollo](../development/function-structure) de esta documentación.
:::

## 4. Consejos de Migración y Precauciones

Al mover código desde Node.js u otras plataformas serverless, tenga en cuenta estos consejos:

- **Compatibilidad de API**: El Azion Runtime implementa las APIs estándar de la Web (Fetch, Streams, Web Crypto). Algunos módulos específicos de Node.js (como `fs`, `child_process` o `net`) no están disponibles.
- **Estado Global**: No confíe en variables globales para persistir el estado entre solicitudes. Los Isolates pueden crearse y destruirse con frecuencia. Use **Azion KV Storage** para el estado persistente.
- **Sin Conexiones Persistentes**: Las Edge functions son de corta duración. Evite mantener abiertas conexiones WebSocket de larga duración o conexiones persistentes a bases de datos dentro de la función.
- **FS Local**: Si su código espera leer/escribir en `/tmp` o directorios locales, debe migrar esa lógica para usar un servicio de almacenamiento externo o el Edge Storage de Azion.

---

### ¿Necesita más potencia?

Si su tarea excede los límites del borde, considere un **Enfoque Híbrido**:

1. Maneje la solicitud inicial y la validación en el **Borde**.
2. Delegue el procesamiento pesado a una **Cola** o a un **Backend Tradicional** (Origen).
3. Use `event.waitUntil` para activar estos procesos en segundo plano sin retrasar al usuario.
