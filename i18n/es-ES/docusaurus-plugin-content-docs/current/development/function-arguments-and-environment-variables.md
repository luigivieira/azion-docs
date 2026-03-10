---
title: Function Arguments and Environment Variables
sidebar_label: Argumentos y Variables
sidebar_position: 3
description: Uso de argumentos de función y variables de entorno en Azion Edge Functions.
---

# Function Arguments and Environment Variables

Azion ofrece dos formas distintas de manejar la configuración y los datos sensibles en sus Edge Functions: **Function Arguments** (Argumentos de Función) y **Environment Variables** (Variables de Entorno). Entender la diferencia entre ambos es clave para construir aplicaciones reutilizables y seguras.

---

## 1. Function Arguments (JSON Args)

Los argumentos de función son valores de configuración locales que se pasan a una función en tiempo de ejecución. Se utilizan para hacer que las funciones sean reutilizables, permitiendo que diferentes instancias de la misma función se comporten de manera distinta según el JSON proporcionado.

### Cómo Funcionan

- **Alcance**: Local a la función y sus instancias.
- **Almacenamiento**: Se definen en la pestaña **Arguments** de la **Function Instance** en la Consola de Azion.
- **Valores de Plantilla**: También puede definir argumentos predeterminados a nivel de definición de la **Function**. Estos sirven como valores base para cualquier instancia creada a partir de esa función. Si una instancia define sus propios argumentos, estos se utilizarán para esa ejecución específica.
- **Acceso**: Disponible a través del objeto `event.args`.

### Configuración de Argumentos en la Consola

1. Abra la **Consola de Azion** → **Build** → **Edge Applications** y seleccione su aplicación.
2. Vaya a la pestaña **Functions** y abra la Instancia de Función que desea configurar.
3. En la pestaña **Arguments**, añada sus pares clave-valor como JSON:

```json
{
  "API_URL": "https://api.example.com",
  "DEBUG_MODE": true,
  "TIMEOUT": 5000
}
```

### Lectura de Argumentos en Tiempo de Ejecución

Use `event.args` para acceder a los valores:

```js
addEventListener("fetch", event => {
  const { API_URL, DEBUG_MODE } = event.args;
  
  if (DEBUG_MODE) {
    console.log(`Fetching from: ${API_URL}`);
  }
  
  event.respondWith(fetch(API_URL));
});
```

---

## 2. Environment Variables

Las variables de entorno son configuraciones globales o secretos (como claves de API o credenciales de base de datos) que se comparten en su cuenta o aplicaciones específicas. Son más adecuadas para información sensible que no debería formar parte de los argumentos JSON de la función.

### Cómo Funcionan

- **Alcance**: Nivel de cuenta (disponible para todas las edge applications en su cuenta).
- **Almacenamento**: Se definen en la sección **Build** → **Variables** de la Consola de Azion ([console.azion.com/variables](https://console.azion.com/variables)).
- **Seguridad**: Puede usar el interruptor **Secret** para cifrar el valor. Una vez que una variable se guarda como secreta, su comportamiento no se puede editar.
- **Acceso**: Disponible a través de la API `Azion.env`.

### Configuración de Variables en la Consola

1. Abra la **Consola de Azion** → **Build** → **Variables**.
2. Añada sus pares clave-valor. Active el interruptor **Secret** para los valores sensibles para asegurar que se cifren y permanezcan ocultos.

### Lectura de Variables en Tiempo de Ejecución

Use `Azion.env.get()` para recuperar el valor como una cadena:

```js
addEventListener("fetch", event => {
  const apiKey = Azion.env.get("MY_SECRET_API_KEY");

  if (!apiKey) {
    event.respondWith(new Response("Falta la clave de API", { status: 500 }));
    return;
  }

  // Use la apiKey en su lógica
});
```

:::info No es lo mismo que `process.env`
El Azion Runtime no tiene un global `process`. Siempre use `Azion.env.get(name)` para leer variables de entorno.
:::

---

## 3. Comparación y Mejores Prácticas

| Característica | Function Arguments | Environment Variables |
|---|---|---|
| **Ideal Para** | Config específica de instancia (URLs, flags) | Secretos de cuenta (claves de API, IDs) |
| **Formato** | Objeto JSON | Pares Clave-Valor (String) |
| **Acceso en Runtime** | `event.args` | `Azion.env.get()` |
| **Ubicación** | Instancia de Función / Función | Consola > Variables |

### Mejores Prácticas

- **Separación de Responsabilidades**: Use Argumentos para valores que cambian por despliegue/instancia. Use Variables de Entorno para secretos sensibles y configuración global.
- **Proporcione Valores Predeterminados**: Maneje siempre los valores faltantes en su código para evitar errores en tiempo de ejecución.
- **Coerción de Tipos**: Los valores de `Azion.env.get()` siempre son cadenas. Los valores en JSON Args conservan sus tipos JSON (número, booleano, etc.).
- **Validación**: Valide la configuración requerida al inicio de su función para fallar rápidamente con un mensaje claro.

```js
const args = event.args;
const timeout = Number(args.TIMEOUT ?? 5000); // Convierta si es necesario
const dbUrl = Azion.env.get("DATABASE_URL");

if (!dbUrl) throw new Error("La variable DATABASE_URL es obligatoria");
```
