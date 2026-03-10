---
title: Desarrollo Local / Vista Previa
sidebar_position: 5
description: Cómo desarrollar y previsualizar Azion Edge Functions localmente.
---

# Desarrollo Local / Vista Previa

Aunque la Consola de Azion es excelente para cambios rápidos, iterar sobre una lógica compleja directamente en un editor del navegador puede ser limitante. La **CLI de Azion** proporciona un servidor de desarrollo local que ejecuta sus Edge Functions en su máquina, ofreciéndole un ciclo de retroalimentación rápido sin tener que desplegar en la red de borde en cada cambio.

---

## 1. Requisitos Previos

Antes de poder usar el servidor de desarrollo local, asegúrese de tener:

- **Node.js 18+** instalado. Puede verificarlo con `node --version`.
- **CLI de Azion** instalada globalmente:

```bash
npm install -g azion
```

- Una **cuenta de Azion** y un token de API personal. Genere uno en la **Consola de Azion** → **Account** → **Personal Tokens**.

---

## 2. Autenticación

Inicie sesión con su token de API para que la CLI pueda sincronizar sus funciones con su cuenta:

```bash
azion login --token SU_TOKEN_PERSONAL
```

---

## 3. Creación de un Nuevo Proyecto

Si está comenzando desde cero, la CLI puede generar la estructura de un nuevo proyecto de Edge Function:

```bash
azion init
```

Siga las instrucciones para elegir una plantilla inicial (JavaScript, TypeScript o una aplicación basada en un framework). Esto crea una estructura de proyecto local con una función de ejemplo y un archivo de configuración.

---

## 4. Ejecución del Servidor de Desarrollo Local

Dentro del directorio de su proyecto, inicie el servidor de desarrollo local:

```bash
azion dev
```

La CLI:

1. Leerá el código fuente de su función (normalmente `main.js` o `src/index.ts`).
2. Lo empaquetará con sus dependencias.
3. Iniciará un servidor HTTP local que emula el entorno del Azion Runtime.

Verá una salida similar a:

```
[Azion] Starting local development server...
[Azion] Server running at http://localhost:3000
```

Abra `http://localhost:3000` en su navegador o use `curl` para probar su función:

```bash
curl http://localhost:3000
```

Cada vez que guarde un cambio en su archivo fuente, el servidor se recargará automáticamente.

---

## 5. Simulación de `event.args`

En producción, `event.args` se rellena con el JSON configurado en la Instancia de Función. Durante el desarrollo local, puede proporcionar un objeto `args` simulado creando un archivo `azion.config.js` (o editando el existente) en la raíz de su proyecto:

```js
// azion.config.js
export default {
  dev: {
    args: {
      API_KEY: "local-dev-key",
      ORIGIN_URL: "https://api.example.com",
      DEBUG: "true",
    },
  },
};
```

La CLI inyecta estos valores como `event.args` cuando se ejecuta localmente, por lo que su código no necesita ningún cambio entre el entorno local y el de producción.

---

## 6. Construcción para el Despliegue

Cuando esté listo para desplegar, construya el paquete de producción:

```bash
azion build
```

Esto compila y optimiza su función. Para desplegarla en la red de borde:

```bash
azion deploy
```

La CLI sube su función a su cuenta de Azion y, si existe una Edge Application vinculada, actualiza la Instancia de Función asociada automáticamente.

---

## 7. Vinculación con una Aplicación Existente

Si tiene una Edge Application existente en su cuenta y desea vincular el proyecto local a ella:

```bash
azion link
```

Esto almacena localmente los IDs de la aplicación y de la función para que `azion deploy` sepa qué recursos actualizar.

---

## 8. Limitaciones Conocidas del Entorno Local

El servidor de desarrollo local emula fielmente la mayor parte del comportamiento del Azion Runtime, pero algunas características se comportan de forma diferente o no están disponibles:

| Característica              | Comportamiento local                                                               |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `fetch()`                   | Funciona normalmente — llama a APIs externas reales.                               |
| `caches` (API de Cache)     | Solo en memoria. La caché se borra al reiniciar.                                   |
| `Azion.env.get()`           | Devuelve valores de las variables de entorno en su consola o de `azion.config.js`. |
| `console.log()`             | La salida va a su terminal.                                                        |
| Latencia de la red de borde | No simulada — las respuestas se sirven desde `localhost`.                          |
| GeoIP / `request.cf`        | No disponible localmente.                                                          |
| KV Storage                  | Requiere una cuenta de Azion real y un token de API; no se emula en memoria.       |

:::tip Probar la lógica de GeoIP localmente
Si su función se bifurca según los datos geográficos (país, ciudad, etc.), añada un condicional en su código que lea de `event.args` cuando falten los datos de GeoIP:

```js
const country = event.request.cf?.country ?? args.MOCK_COUNTRY ?? "US";
```

Luego, establezca `MOCK_COUNTRY` en los argumentos de su `azion.config.js` local para simular diferentes ubicaciones.
:::

---

## 9. Integración con el Editor

El Azion Runtime implementa las **APIs estándar de la Web** (Fetch, Streams, Web Crypto, Cache). Para obtener la mejor experiencia de edición con TypeScript, instale las definiciones de tipo de Web Workers:

```bash
npm install --save-dev @cloudflare/workers-types
```

Luego, haga referencia a ellas en su `tsconfig.json`:

```json
{
  "compilerOptions": {
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"]
  }
}
```

Esto le proporciona autocompletado completo y comprobación de tipos para `Request`, `Response`, `FetchEvent` y otros globales del runtime.
