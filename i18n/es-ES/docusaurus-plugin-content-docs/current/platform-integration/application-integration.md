---
title: Integración con Aplicaciones
sidebar_position: 5
description: Cómo se integran las Edge Functions con las Edge Applications e interactúan con el ciclo de vida completo de solicitud/respuesta.
---

# Integración con Aplicaciones

Una Edge Function no reemplaza a una Edge Application — la extiende. Las funciones se ejecutan como un comportamiento (behavior) dentro del pipeline más amplio de solicitud/respuesta gestionado por la aplicación. Entender dónde encajan las funciones en ese pipeline determina cómo diseñarlas.

---

## 1. El Módulo Edge Functions

Para que una Edge Application soporte funciones, el módulo **Edge Functions** debe estar habilitado en la **Configuración Principal (Main Settings)** de la aplicación. Este módulo desbloquea:

- La pestaña **Functions**, donde crea y gestiona las Instancias de Función.
- El comportamiento **Run Function** en el Rules Engine.

Deshabilitar el módulo oculta la pestaña Functions y evita que se evalúen los comportamientos de función, pero no elimina las instancias existentes.

---

## 2. Dónde se Ejecutan las Funciones en el Pipeline

Cada solicitud a una Edge Application pasa por las siguientes etapas:

```
Solicitud Entrante
      │
      ▼
 Fase de Solicitud (Rules Engine)
      │  ← las funciones pueden ejecutarse aquí
      ▼
   Capa de Caché
      │
      ▼
    Origen
      │
      ▼
 Fase de Respuesta (Rules Engine)
      │  ← las funciones pueden ejecutarse aquí
      ▼
 Respuesta al Cliente
```

### Fase de Solicitud (Request Phase)

Las funciones en la **Fase de Solicitud** se ejecutan antes de consultar la caché y antes de que cualquier solicitud sea reenviada al origen. Esto significa:

- Si la función devuelve una respuesta mediante `event.respondWith()`, la caché y el origen se omiten por completo para esa solicitud.
- Si la función modifica la solicitud (cabeceras, ruta, cuerpo) y no devuelve una respuesta, la solicitud modificada continúa a través de las etapas de caché y origen.

Use la Fase de Solicitud para: autenticación y autorización, redirecciones, pruebas A/B, reescritura de solicitudes, generación de respuestas desde cero (ej. sirviendo desde Edge Storage).

### Fase de Respuesta (Response Phase)

Las funciones en la **Fase de Respuesta** se ejecutan después de que el origen o la caché devuelvan una respuesta, antes de que se envíe al cliente. En esta etapa:

- La función recibe la respuesta completa, incluyendo el código de estado, las cabeceras y el cuerpo.
- Puede modificar o reemplazar la respuesta antes de la entrega.

Use la Fase de Respuesta para: inyectar cabeceras de seguridad, transformar cuerpos de respuesta, personalización basada en los datos de la respuesta, registro (logging).

---

## 3. Interacción con otros Comportamientos

Las funciones coexisten con otros comportamientos del Rules Engine. Una sola regla puede combinar una función con otras acciones:

- **Caché**: Una función en la Fase de Solicitud que devuelve una respuesta cortocircuita el almacenamiento en caché para esa solicitud. Para cachear las respuestas de la función, configure el comportamiento de caché por separado y asegúrese de que la función no llame a `event.respondWith()` cuando se espere un acierto en caché (cache hit).
- **Compresión (Gzip/Brotli)**: Puede aplicarse en la Fase de Respuesta junto con o después de una función, reduciendo el tamaño de la salida de la función antes de la entrega.
- **Cabeceras**: Los comportamientos `Add Request Header` o `Add Response Header` pueden complementar la lógica de la función — por ejemplo, marcando las solicitudes antes de que lleguen a la función, o añadiendo cabeceras después de que la función se ejecute.

:::tip El orden de los comportamientos importa
Dentro de una regla, los comportamientos se ejecutan en el orden en que aparecen. Si una función devuelve una respuesta directamente y necesita añadir una cabecera a esa respuesta, asegúrese de que el comportamiento de la cabecera aparezca después de la función — o añada la cabecera dentro del propio código de la función.
:::

---

## 4. Acceso al Contexto de la Aplicación desde una Función

Las funciones tienen acceso a la solicitud entrante completa a través de `event.request`. Esto incluye:

- La URL, el método y el cuerpo.
- Todas las cabeceras de la solicitud — incluyendo cualquier cabecera añadida por comportamientos (behaviors) previos del Rules Engine.
- El objeto `event.args` de la configuración de la Instancia de Función.

Las funciones no tienen acceso integrado al estado de la caché de la aplicación ni a la configuración del origen — operan directamente sobre los datos de solicitud/respuesta. Para leer o escribir contenido cacheado mediante programación, use **Edge Storage** a través de la API Azion Storage.

---

## 5. Edge Firewall frente a Edge Application

Las funciones también pueden ejecutarse dentro de un **Edge Firewall**, que opera antes de que la solicitud llegue a la capa de aplicación. Las diferencias clave:

|                                 | **Edge Application**                             | **Edge Firewall**                                            |
| ------------------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| **Tipo de evento**              | `fetch`                                          | `firewall`                                                   |
| **Punto de ejecución**          | Durante el procesamiento de solicitud/respuesta  | Antes de que la aplicación reciba la solicitud               |
| **Uso principal**               | Lógica de negocio, personalización, llamadas API | Filtrado de seguridad, mitigación de bots, control de acceso |
| **¿Puede devolver respuestas?** | Sí                                               | Sí (para bloquear o desafiar solicitudes)                    |

Use el Edge Firewall cuando necesite tomar decisiones — permitir, bloquear o desafiar — antes de que intervenga la lógica de su aplicación.

---

## Siguientes pasos

- [Estructura de la Función](../development/function-structure.md) — entienda cómo escribir funciones que interactúan con el pipeline de solicitud/respuesta.
- [Manejo de Solicitudes y Respuestas](../development/handling-requests-and-responses.md) — patrones prácticos para leer y modificar solicitudes y respuestas.
