---
title: Configuración
sidebar_position: 3
description: Opciones de configuración para Azion Edge Functions.
---

# Configuración

Las Edge Functions se configuran a dos niveles: la **definición de la función** (el código y sus metadatos) y la **instancia de la función** (dónde y cómo se ejecuta dentro de una aplicación o firewall). Esta página cubre ambos niveles.

---

## 1. Metadatos de la Función

Cuando crea o edita una función en la Consola de Azion o a través de la API, configura las siguientes propiedades:

| Propiedad          | Descripción                                                                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**           | Un identificador legible por humanos para la función. Se usa para encontrarla en la biblioteca de funciones.                                                                                                |
| **Language**       | El lenguaje del código de la función. Actualmente, solo se soporta `JavaScript` (TypeScript debe compilarse a JavaScript antes de guardarse).                                                               |
| **Code**           | El código fuente de la función. Se guarda y ejecuta tal cual — la plataforma no realiza ningún empaquetado (bundling) en el lado del servidor.                                                              |
| **Initiator Type** | Indica si la función está destinada a una **Edge Application** (responde a eventos `fetch`) o a un **Edge Firewall** (responde a eventos `firewall`). Esto controla qué tipo de evento despacha el runtime. |
| **Active**         | Indica si la función está disponible para ser instanciada. Las funciones inactivas no pueden asignarse a una Instancia de Función.                                                                          |

---

## 2. Argumentos de la Instancia de Función

Cada **Instancia de Función** tiene un campo **Arguments** — un objeto JSON que se pasa a su función en tiempo de ejecución a través de `event.args`. Este es el método principal para proporcionar una configuración específica del entorno o de la instancia a una función.

Los argumentos se configuran por instancia, de modo que el mismo código de función puede comportarse de forma diferente según dónde se despliegue:

```json
{
  "targetOrigin": "https://api.example.com",
  "cacheTTL": 300,
  "allowedRoles": ["admin", "editor"]
}
```

Su función lee estos valores en tiempo de ejecución:

```js
addEventListener("fetch", (event) => {
  const { targetOrigin, cacheTTL, allowedRoles } = event.args;

  // utilizar los valores de configuración...
});
```

### Validación de argumentos

El runtime no valida la estructura de `event.args`. Usted es responsable de validar la presencia y los tipos de los campos esperados.

```js
const handleRequest = async (request, args) => {
  const origin = args.targetOrigin;

  if (typeof origin !== "string" || !origin.startsWith("https://")) {
    console.error("targetOrigin inválido en args:", origin);
    return new Response("Función mal configurada", { status: 500 });
  }

  return fetch(`${origin}${new URL(request.url).pathname}`);
};
```

### Límite de tamaño

El objeto JSON de Argumentos está sujeto a un límite de tamaño máximo. Mantenga los argumentos concisos — están pensados para valores de configuración (URLs, flags, claves), no para grandes volúmenes de datos. Consulte [Límites](../limits.md) para conocer el límite actual.

---

## 3. Comportamiento en el Rules Engine

Una Instancia de Función no se invoca por defecto para cada solicitud. Es activada por una **Regla** en el Rules Engine de una Edge Application o Edge Firewall. La regla especifica:

1. **Criterios**: Qué solicitudes deben coincidir (ej. la ruta comienza con `/api`, está presente una cabecera específica).
2. **Comportamiento**: Qué hacer cuando se cumplen los criterios — en este caso, "Run Function" con una Instancia de Función específica.

Esta configuración se realiza en la pestaña **Rules Engine** de su Edge Application o Edge Firewall, no en la propia función. Consulte [Vinculación de Instancias a Reglas](../platform-integration/linking-instances-to-rules.md) para obtener instrucciones paso a paso.

---

## 4. Funciones Activas frente a Inactivas

Una función marcada como **inactiva** en la Consola de Azion no puede instanciarse ni ejecutarse. Esto es útil para:

- Retirar una función de producción sin eliminarla permanentemente.
- Mantener versiones en borrador de funciones que aún no están listas para ser desplegadas.

Las Instancias de Función existentes que hagan referencia a una función inactiva fallarán cuando coincida la regla que las invoca — el runtime devolverá una respuesta de error en lugar de ejecutar la función.

---

## 5. Versionado y Despliegue

No existe un sistema de versionado integrado para el código de las funciones. Guardar una nueva versión de una función en la Consola de Azion **sobrescribe** el código actual inmediatamente. Todas las Instancias de Función que referencian esa función utilizarán el nuevo código en la siguiente invocación.

Prácticas recomendadas para despliegues seguros:

- **Use una aplicación de staging**: Cree una Edge Application (or Edge Firewall) independiente apuntando a un dominio de staging, con las mismas instancias de función. Pruebe allí antes de actualizar la función de producción.
- **Use la CLI de Azion con un pipeline de CI/CD**: La CLI le permite gestionar el código de la función como parte de su flujo de trabajo de control de código fuente, proporcionándole un historial de cambios a través de su sistema de control de versiones (ej. Git).
- **Blue/green mediante múltiples instancias**: Cree una nueva función con el código actualizado, redirija una pequeña porción del tráfico a una instancia de la nueva función mediante criterios del Rules Engine y luego transfiera el tráfico gradualmente.

---

## Relacionado

- [Variables de Entorno](../development/environment-variables.md) — cómo usar `event.args` para secretos y configuración.
- [Instancia de Función](../platform-integration/what-is-a-function-instance.md) — explicación detallada de las instancias de función.
- [Vinculación de Instancias a Reglas](../platform-integration/linking-instances-to-rules.md) — cómo activar una función para solicitudes específicas.
