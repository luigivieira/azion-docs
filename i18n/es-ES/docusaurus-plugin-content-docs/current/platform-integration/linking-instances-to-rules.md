---
title: Vinculación de Instancias a Reglas
sidebar_position: 4
description: Cómo configurar el Rules Engine para invocar una Instancia de Función.
---

# Vinculación de Instancias a Reglas

Una Instancia de Función no se ejecuta automáticamente. Debe configurar una regla en el **Rules Engine** que invoque la instancia bajo condiciones específicas. Esto es lo que conecta el "qué" (la instancia) con el "cuándo" (los criterios de la solicitud).

---

## Requisitos Previos

- Una Instancia de Función ya creada en la aplicación. Consulte [Creación de Instancias](./creating-instances.md).
- El módulo **Edge Functions** habilitado en la pestaña Main Settings de la aplicación.

---

## Cómo funciona el Rules Engine

El Rules Engine evalúa cada solicitud entrante frente a una lista de reglas. Cada regla tiene:

- **Criterios**: Una o más condiciones que deben ser verdaderas para que la regla se aplique (ej. ruta de la solicitud, método, cabeceras, cookies).
- **Comportamiento**: La acción a realizar cuando todos los criterios coinciden (ej. ejecutar una función, establecer una cabecera, redirigir).

Las reglas se evalúan en orden. Se aplica el comportamiento de la primera regla que coincida. Si ninguna regla coincide, la solicitud se procesa normalmente.

---

## Pasos

### 1. Abrir el Rules Engine

Dentro de la Edge Application, vaya a la pestaña **Rules Engine**.

### 2. Crear una nueva regla

Haga clic en **Add Rule**. Elija la **fase** en la que debe ejecutarse la regla:

- **Request Phase**: Evaluada antes de que la solicitud sea reenviada a la caché o al origen. Use esto cuando la función necesite inspeccionar o modificar la solicitud entrante, autenticar al usuario o devolver una respuesta directamente.
- **Response Phase**: Evaluada después de que el origen o la caché devuelvan una respuesta, antes de la entrega al cliente. Use esto cuando la función necesite modificar o enriquecer la respuesta saliente.

### 3. Configurar los criterios

Defina las condiciones que deben cumplirse para que se aplique la regla. Cada condición está compuesta por una **variable** (qué inspeccionar), un **operador** (cómo comparar) y un **valor** (contra qué comparar).

Operadores disponibles:

| Operador              | Requiere valor | Descripción                                                                 |
| --------------------- | :------------: | --------------------------------------------------------------------------- |
| `is equal`            |       ✓        | El valor de la variable coincide exactamente con la cadena especificada.    |
| `is not equal`        |       ✓        | El valor de la variable no coincide exactamente con la cadena especificada. |
| `starts with`         |       ✓        | El valor de la variable comienza con la cadena especificada.                |
| `does not start with` |       ✓        | El valor de la variable no comienza con la cadena especificada.             |
| `matches`             |       ✓        | El valor de la variable coincide con la expresión regular especificada.     |
| `does not match`      |       ✓        | El valor de la variable no coincide con la expresión regular especificada.  |
| `exists`              |       —        | La variable tiene cualquier valor.                                          |
| `does not exist`      |       —        | La variable no tiene valor.                                                 |

Ejemplos comunes usando `Request URI`:

| Operador              | Valor                 | Significado                                              |
| --------------------- | --------------------- | -------------------------------------------------------- |
| `starts with`         | `/api`                | Coincide con cualquier ruta bajo `/api`                  |
| `is equal`            | `/login`              | Coincide solo con la ruta `/login`                       |
| `does not start with` | `/public`             | Coincide con cualquier ruta que no esté bajo `/public`   |
| `matches`             | `^/productos/[0-9]+$` | Coincide con rutas como `/productos/42` usando una regex |

Puede combinar múltiples condiciones usando **And** (todas deben coincidir) u **Or** (cualquiera debe coincidir).

### 4. Añadir el comportamiento "Run Function"

En la sección **Behaviors**, haga clic en **Add Behavior** y seleccione **Run Function**. Luego elija la instancia en el desplegable.

:::note Una función por regla
Cada regla puede invocar una instancia de función. Si necesita ejecutar múltiples funciones para la misma solicitud, cree reglas separadas — una por función — que compartan los mismos criterios.
:::

### 5. Guardar la regla

Haga clic en **Save**. La regla se activa inmediatamente y se evaluará en la siguiente solicitud que coincida.

---

## Ejemplo: ejecutar una función para una ruta específica

La siguiente configuración invoca la instancia `AuthFunction - Producción` para todas las solicitudes a rutas que comiencen con `/protegido`:

- **Fase**: Request
- **Criterios**: `If Request URI` → `starts with` → `/protegido`
- **Comportamiento**: `Run Function` → `AuthFunction - Producción`

Cualquier solicitud a `/protegido/dashboard` o `/protegido/ajustes` activará la función. Las solicitudes a `/public` o `/` no lo harán.

---

## Combinación de funciones con otros comportamientos

Una regla puede tener múltiples comportamientos. Por ejemplo, puede ejecutar una función y también añadir una cabecera de solicitud en la misma regla:

- **Comportamiento 1**: `Run Function` → `MiFuncion - Instancia`
- **Comportamiento 2**: `Add Request Header` → `X-Processed-By: edge`

Los comportamientos se aplican en el orden en que aparecen listados. Si su función utiliza `event.respondWith()` para devolver una respuesta directamente, es posible que los comportamientos que aparezcan después en el pipeline de respuesta no se apliquen.

La siguiente tabla lista los comportamientos disponibles en el Rules Engine:

| Comportamiento                          | Módulo Requerido        | Descripción                                                                                                                                     |
| --------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Add Request Cookie**                  | Application Accelerator | Añade una cookie a la solicitud antes de que llegue al origen.                                                                                  |
| **Add Request Header**                  | —                       | Añade o sobrescribe una cabecera en la solicitud entrante.                                                                                      |
| **Bypass Cache**                        | Application Accelerator | Obliga a la solicitud a omitir la caché e ir directamente al origen.                                                                            |
| **Capture Match Groups**                | Application Accelerator | Captura partes de la URI mediante una regex, haciendo que los grupos capturados estén disponibles para otros comportamientos en la misma regla. |
| **Deliver**                             | —                       | Entrega la respuesta al cliente y finaliza la evaluación de reglas.                                                                             |
| **Deny (403 Forbidden)**                | —                       | Devuelve inmediatamente una respuesta 403 al cliente.                                                                                           |
| **Filter Request Cookie**               | Application Accelerator | Elimina una cookie de la solicitud.                                                                                                             |
| **Filter Request Header**               | —                       | Elimina una cabecera de la solicitud.                                                                                                           |
| **Forward Cookies**                     | Application Accelerator | Reenvía las cookies del cliente al servidor de origen.                                                                                          |
| **No Content (204)**                    | —                       | Devuelve inmediatamente una respuesta 204 No Content al cliente.                                                                                |
| **Optimize Images**                     | Application Accelerator | Aplica optimización automática de imágenes — conversión de formato, redimensionamiento y compresión — a las respuestas de imagen.               |
| **Redirect HTTP to HTTPS**              | —                       | Redirige las solicitudes HTTP a HTTPS con una respuesta 301.                                                                                    |
| **Redirect To (301 Moved Permanently)** | —                       | Redirige permanentemente al cliente a una URL especificada.                                                                                     |
| **Redirect To (302 Found)**             | —                       | Redirige temporalmente al cliente a una URL especificada.                                                                                       |
| **Rewrite Request**                     | Application Accelerator | Reecreibe la URI de la solicitud antes de que llegue a la caché o al origen.                                                                    |
| **Run Function**                        | Edge Functions          | Invoca una Instancia de Función.                                                                                                                |
| **Set Cache Policy**                    | —                       | Aplica una configuración específica de TTL de caché a la solicitud.                                                                             |
| **Set Connector**                       | —                       | Enruta la solicitud a través de un conector específico, como un origen privado o un balanceador de carga.                                       |

---

## Siguiente paso

Para entender cómo interactúan las funciones con la caché, el origen y otros módulos a lo largo de todo el ciclo de vida de la solicitud, consulte [Integración con Aplicaciones](./application-integration.md).
