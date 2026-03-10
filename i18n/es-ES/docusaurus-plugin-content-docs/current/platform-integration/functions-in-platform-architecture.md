---
title: Las Funciones en la Arquitectura de la Plataforma
sidebar_position: 1
description: Cómo encajan las Funciones en la arquitectura más amplia de la plataforma Azion.
---

# Las Funciones en la Arquitectura de la Plataforma

En la plataforma Azion, las Edge Functions no existen de forma aislada. Forman parte de una arquitectura jerárquica diseñada para proporcionar una gestión centralizada, distribución global y ejecución basada en eventos.

A alto nivel, el flujo de una solicitud es el siguiente:

> **Usuario** → **Workload** (dominio) → **Edge Application o Edge Firewall** → **Rules Engine** → **Edge Function**

---

## 1. La Jerarquía Arquitectónica

Para ejecutar una función en la Azion Edge Network, esta debe estar integrada en la siguiente estructura:

**Workload > Edge Application / Edge Firewall > Instancia de Función > Edge Function**

- **Workload**: El contenedor de nivel superior que gestiona dominios, registros DNS, certificados digitales y protocolos de red. Es el punto de entrada para todo el tráfico.
- **Edge Application**: La base para el procesamiento de solicitudes, caché y enrutamiento. Las funciones utilizadas para lógica de negocio — redirecciones, personalización, proxying de API — residen aquí.
- **Edge Firewall**: Un contexto enfocado a la seguridad para implementar lógica de protección personalizada, limitación de tasa y control de acceso. Las funciones aquí se ejecutan incluso antes de que las solicitudes lleguen a la capa de aplicación.
- **Instancia de Función**: Una referencia que vincula una función específica a una aplicación o firewall. Esto es lo que invoca el Rules Engine. Consulte [Qué es una Instancia de Función](./what-is-a-function-instance.md).

## 2. Activación de Funciones: El Rules Engine

Las funciones no se ejecutan para cada solicitud por defecto. El **Rules Engine** determina _cuándo_ y _dónde_ se ejecuta una función, utilizando un modelo de **Criterios y Comportamientos (Criteria & Behavior)**:

1. **Criterios**: Condiciones evaluadas frente a la solicitud — por ejemplo, "si la ruta comienza con `/api`".
2. **Comportamiento**: La acción realizada cuando se cumplen los criterios — por ejemplo, "Ejecutar la Instancia de Función X".

Este modelo condicional significa que usted tiene un control preciso sobre la ejecución. Una sola aplicación puede tener múltiples reglas dirigidas a diferentes rutas, invocando cada regla una instancia de función diferente.

Para más información sobre cómo funcionan las reglas, consulte [Vinculación de Instancias a Reglas](./linking-instances-to-rules.md).

## 3. Contextos de Ejecución y Tipos de Eventos

Las Edge Functions se basan en eventos. Los eventos que reciben dependen de dónde se instancien.

### Fetch Events (Edge Applications)

Las funciones dentro de una Edge Application responden a eventos `fetch`, activados por solicitudes HTTP entrantes. Pueden inspeccionar y modificar solicitudes y respuestas en dos fases:

- **Fase de Solicitud (Request Phase)**: Se ejecuta antes de que la solicitud llegue a la caché o al origen. Use esto para comprobaciones de autenticación, redirecciones, reescritura de solicitudes o para generar una respuesta directamente.
- **Fase de Respuesta (Response Phase)**: Se ejecuta después de que el origen o la caché generen una respuesta, antes de la entrega al cliente. Use esto para inyección de cabeceras, transformación de respuestas o registro (logging).

### Firewall Events (Edge Firewall)

Las funciones dentro de un Edge Firewall responden a eventos `firewall`. Se ejecutan en el borde de la red antes de que la solicitud sea transferida a la capa de aplicación — lo que las hace ideales para la mitigación de bots, verificación de firmas personalizadas, bloqueo de IPs y otra lógica de seguridad.

## 4. Por qué es Importante esta Arquitectura

Este diseño por capas asegura que las funciones sean:

- **Condicionales**: El Rules Engine evita ejecuciones innecesarias. Las funciones solo se ejecutan cuando coinciden los criterios relevantes, manteniendo baja la latencia y el uso de cómputo.
- **Reutilizables**: El mismo código de función puede instanciarse en múltiples aplicaciones o firewalls, cada uno con su propia configuración a través del JSON de Argumentos.
- **Componibles**: Las funciones coexisten con otros comportamientos en el Rules Engine — caché, compresión, redirecciones — ofreciéndole un control minucioso sobre todo el ciclo de vida de la solicitud/respuesta.
