---
title: Qué es una Instancia de Función
sidebar_position: 2
description: Entienda qué es una Instancia de Función y por qué es el vínculo clave entre una función y una Edge Application.
---

# Qué es una Instancia de Función

Una **Instancia de Función** es una referencia configurada a una Edge Function dentro de una Edge Application o Edge Firewall. Es la entidad que el Rules Engine invoca — no el código de la función en sí.

---

## 1. Función frente a Instancia de Función

Entender la distinción entre una función y una instancia de función es esencial:

|                                 | **Edge Function**                          | **Instancia de Función**                                  |
| ------------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| **Qué es**                      | El código que escribe y guarda             | Una referencia a ese código, con ámbito en una aplicación |
| **Dónde reside**                | En la biblioteca de funciones de su cuenta | Dentro de una Edge Application o Edge Firewall específica |
| **Qué utiliza el Rules Engine** | —                                          | La instancia                                              |

Piense en la función como un plano (blueprint) y en la instancia como el despliegue de ese plano en un contexto específico. La misma función puede tener múltiples instancias — en diferentes aplicaciones, o incluso múltiples instancias dentro de la misma aplicación.

## 2. Por qué existen las Instancias

Las instancias existen para permitir la **reutilización con configuración por aplicación**.

Imagine que tiene una función de autenticación. En lugar de duplicar el código para cada aplicación que lo necesite, lo guarda una vez y crea una instancia en cada aplicación. Cada instancia puede configurarse de forma diferente utilizando el JSON de **Argumentos** — una instancia podría aplicar una caducidad de token estricta, mientras que otra podría usar una política más relajada para herramientas internas.

## 3. El JSON de Argumentos

Cada Instancia de Función tiene una pestaña **Arguments** donde puede proporcionar un objeto JSON. Este objeto se pasa a la función en tiempo de ejecución a través de `event.args`.

Por ejemplo, si su instancia tiene esta configuración:

```json
{
  "allowedOrigins": ["https://app.example.com"],
  "strictMode": true
}
```

Su función puede leerlo como:

```js
addEventListener("fetch", (event) => {
  const { allowedOrigins, strictMode } = event.args;

  // use la configuración en su lógica
  event.respondWith(new Response(`Modo estricto: ${strictMode}`));
});
```

Esta separación entre código y configuración es lo que hace que las funciones sean reutilizables. La lógica permanece igual; solo cambian los argumentos por instancia.

:::tip Sin valores codificados
Use los Argumentos para cualquier valor que pueda variar entre despliegues: claves de API (vía variables de entorno), orígenes permitidos, feature flags, URLs de destino. Esto mantiene el código de su función genérico y sus instancias específicas.
:::

## 4. Ciclo de Vida de la Instancia

- **Crear una instancia** no despliega ni ejecuta nada por sí mismo. La función solo se ejecuta cuando una regla del Rules Engine con un comportamiento "Run Function" coincide con una solicitud.
- **Eliminar una instancia** la quita de la aplicación. Cualquier regla que hiciera referencia a ella dejará de invocar la función.
- **Actualizar Argumentos** en una instancia surte efecto en la siguiente solicitud que coincida, sin necesidad de volver a desplegar.

## Siguientes pasos

- [Creación de Instancias](./creating-instances.md) — cómo añadir una Instancia de Función a una aplicación.
- [Vinculación de Instancias a Reglas](./linking-instances-to-rules.md) — cómo configurar el Rules Engine para invocar su instancia.
