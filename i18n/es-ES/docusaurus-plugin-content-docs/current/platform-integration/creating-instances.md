---
title: Creación de Instancias
sidebar_position: 3
description: Cómo crear una Instancia de Función dentro de una Edge Application o Edge Firewall.
---

# Creación de Instancias

Una Instancia de Función vincula una Edge Function a una Edge Application o Edge Firewall específica. Debe crear una instancia antes de que el Rules Engine pueda invocar su función.

---

## Requisitos Previos

Antes de crear una instancia:

- Debe tener una Edge Function guardada en su cuenta. Consulte [Crear su Primera Función](../getting-started/create-function.md).
- La Edge Application de destino debe tener habilitado el módulo **Edge Functions**. Puede habilitarlo en la pestaña **Main Settings** de la aplicación.

:::info Módulo Edge Functions
Sin el módulo Edge Functions habilitado, el tab **Functions** no aparecerá en la aplicación y no podrá crear instancias. El módulo debe activarse explícitamente para cada aplicación que lo necesite.
:::

---

## Pasos

### 1. Abrir la Edge Application

En **Azion Console**, vaya a **Build** → **Edge Applications** y abra la aplicación donde desea añadir la instancia.

### 2. Ir a la pestaña Functions

Seleccione la pestaña **Functions**. Aquí se listan todas las instancias existentes para la aplicación.

### 3. Añadir una nueva instancia

Haga clic en **Add Function**. Aparecerá un formulario con los siguientes campos:

- **Name**: Una etiqueta descriptiva para esta instancia (ej. `AuthFunction - Producción`). Elija un nombre que facilite la identificación de la instancia en el Rules Engine.
- **Edge Function**: La función a vincular. Seleccione de la lista de funciones guardadas en su cuenta.

### 4. Configurar Argumentos (opcional)

Después de seleccionar una función, la pestaña **Arguments** estará disponible. Aquí puede proporcionar un objeto JSON con los valores de configuración que su función leerá desde `event.args`.

Por ejemplo:

```json
{
  "redirectTo": "https://login.example.com",
  "tokenHeader": "x-auth-token"
}
```

Deje los Argumentos vacíos si su función no utiliza `event.args` o si define sus propios valores por defecto.

### 5. Guardar la instancia

Haga clic en **Save**. La instancia aparecerá ahora en la pestaña Functions y estará disponible para ser referenciada en el Rules Engine.

---

## Múltiples instancias de una misma función

Puede crear más de una instancia a partir de la misma función dentro de la misma aplicación — cada una con diferentes Argumentos. Esto es útil cuando necesita que la misma lógica se comporte de forma diferente según la ruta o el contexto.

Por ejemplo, una función de limitación de tasa (rate-limiting) podría tener:

- **Instancia A** — `{ "limit": 100 }` para la ruta `/api/public`.
- **Instancia B** — `{ "limit": 10 }` para la ruta `/api/admin`.

Cada instancia será referenciada por una regla diferente en el Rules Engine.

---

## Siguiente paso

Con la instancia creada, configure el Rules Engine para invocarla. Consulte [Vinculación de Instancias a Reglas](./linking-instances-to-rules.md).
