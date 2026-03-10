---
title: Variables de Entorno
sidebar_position: 3
description: Uso de variables de entorno en Azion Edge Functions.
---

# Variables de Entorno

Las variables de entorno le permiten inyectar configuración y secretos en sus Edge Functions sin codificar valores en el código fuente. Este es el patrón estándar para separar el código de la configuración y para mantener los valores sensibles — como las claves de API o las credenciales de la base de datos — fuera de su repositorio.

---

## 1. Cómo se almacenan las variables

Azion almacena las variables de entorno a nivel de **Edge Application**, dentro de una **Instancia de Función (Function Instance)**. Los valores que introduce se cifran en reposo. Cuando el runtime inicializa su función, pone esos valores a disposición a través de la API `Azion.env`.

:::info No es lo mismo que `process.env`
El Azion Runtime no tiene un global `process` (ese es un concepto de Node.js). Para leer las variables de entorno, use `Azion.env.get()` en su lugar.
:::

---

## 2. Configuración de Variables en la Consola

1. Abra la **Consola de Azion** → **Build** → **Edge Applications** y seleccione su aplicación.
2. Vaya a la pestaña **Functions** y abra la Instancia de Función que desea configurar.
3. En la pestaña **Arguments**, añada sus pares clave-valor como JSON — o use la sección **Environment Variables** si su plan la incluye.

Para la configuración a nivel de función (el objeto `event.args`), añada los pares clave-valor directamente en el editor JSON de la pestaña **Arguments**:

```json
{
  "API_KEY": "sk-your-key-here",
  "ORIGIN_URL": "https://api.example.com",
  "CACHE_TTL": 300
}
```

Estos valores estarán disponibles en tiempo de ejecución como `event.args`.

---

## 3. Lectura de Variables en Tiempo de Ejecución

### A través de `event.args` (Recomendado para configuración específica de la función)

El enfoque más común es pasar la configuración a través de la pestaña **Arguments** de la Instancia de Función. Esto hace que cada instancia sea configurable de forma independiente.

```js
const handleRequest = async (request, args) => {
  const apiKey = args.API_KEY;
  const originUrl = args.ORIGIN_URL ?? "https://api.example.com";
  const cacheTtl = args.CACHE_TTL ?? 60;

  const res = await fetch(`${originUrl}/data`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${cacheTtl}`,
    },
  });
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

### A través de `Azion.env.get()` (Variables a nivel de aplicación)

Para variables compartidas entre múltiples instancias de función (o establecidas fuera del JSON de Argumentos), Azion proporciona un objeto global `Azion.env`:

```js
addEventListener("fetch", (event) => {
  const apiKey = Azion.env.get("MY_API_KEY");

  if (!apiKey) {
    event.respondWith(new Response("Error de configuración", { status: 500 }));
    return;
  }

  event.respondWith(
    new Response(`La clave comienza con: ${apiKey.slice(0, 4)}...`),
  );
});
```

`Azion.env.get(name)` devuelve el valor como una cadena, o `undefined` si la variable no está configurada.

---

## 4. Proporcionar Valores Predeterminados y Validar al Inicio

Siempre proporcione valores predeterminados razonables y valide las variables requeridas de forma temprana. Una función que falla con un error claro es mucho más fácil de depurar que una que devuelve silenciosamente datos erróneos.

```js
const getConfig = (args) => {
  const required = ["API_KEY", "ORIGIN_URL"];

  for (const key of required) {
    if (!args[key]) {
      throw new Error(`Falta configuración requerida: ${key}`);
    }
  }

  return {
    apiKey: args.API_KEY,
    origin: args.ORIGIN_URL,
    cacheTtl: Number(args.CACHE_TTL ?? 60),
    debug: args.DEBUG === "true",
  };
};

const handleRequest = async (request, args) => {
  let config;

  try {
    config = getConfig(args);
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }

  if (config.debug) {
    console.log("Configuración cargada:", {
      origin: config.origin,
      cacheTtl: config.cacheTtl,
    });
  }

  const res = await fetch(`${config.origin}/data`, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
  });

  return res;
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

---

## 5. Secretos y Mejores Prácticas de Seguridad

- **Nunca registre valores secretos**. Use `console.log` solo para metadatos no sensibles (URLs sin credenciales, códigos de estado, etc.).
- **Nunca ponga secretos en el código fuente**. Almacénelos solo en el JSON de Argumentos o en las variables de entorno a nivel de aplicación.
- **Rote las claves regularmente**. Cuando actualiza el JSON de Argumentos de una Instancia de Función, el nuevo valor entra en vigor en la siguiente solicitud — no se requiere volver a desplegar.
- **Use diferentes instancias para diferentes entornos**. Cree Instancias de Función separadas para staging y producción, cada una con su propio conjunto de claves. Esto evita fugas accidentales de datos entre entornos.

---

## 6. Coerción de Tipos

Todos los valores que introduce en el JSON de Argumentos se tipan tal cual (las cadenas siguen siendo cadenas, los números siguen siendo números). Los valores leídos de `Azion.env.get()` siempre son cadenas. Recuerde convertir los tipos explícitamente cuando sea necesario:

```js
const args = event.args;

const timeout = Number(args.TIMEOUT_MS ?? "5000"); // string → number
const debug = args.DEBUG === "true"; // string → boolean
const items = JSON.parse(args.ALLOWED_IPS ?? "[]"); // string → array
```
