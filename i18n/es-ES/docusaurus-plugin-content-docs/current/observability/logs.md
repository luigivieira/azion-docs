---
title: Logs
sidebar_position: 1
description: Cómo acceder y entender los logs de Azion Edge Functions.
---

# Logs

Las Edge Functions en la plataforma Azion emiten logs que están disponibles a través de dos productos de Observe: **Real-Time Events**, para la inspección interactiva en la Consola de Azion, y **Data Stream**, para el envío de logs a plataformas externas. Los logs son la herramienta principal para entender qué está haciendo su función en producción — confirmar invocaciones, inspeccionar valores calculados y diagnosticar errores.

---

## 1. Escritura de Logs desde su Función

Dentro de una función, utilice la API estándar `console` para emitir mensajes de log. Toda la salida de `console` es capturada por el runtime y almacenada bajo la fuente de datos **Functions Console**.

```js
addEventListener("fetch", (event) => {
  console.log("Función invocada:", event.request.url);
  console.log("Método:", event.request.method);

  event.respondWith(new Response("OK"));
});
```

Se soportan los cuatro niveles, que se conservan en la salida del log:

| Método            | Uso para                                 |
| ----------------- | ---------------------------------------- |
| `console.log()`   | Salida informativa general               |
| `console.info()`  | Eventos significativos del ciclo de vida |
| `console.warn()`  | Anomalías no fatales                     |
| `console.error()` | Errores y condiciones inesperadas        |

:::tip Registro estructurado
Registre objetos JSON en lugar de cadenas simples. Esto hace que sus logs sean filtrables en Real-Time Events.

```js
console.log(
  JSON.stringify({
    event: "cache_miss",
    path: new URL(event.request.url).pathname,
  }),
);
```

:::

---

## 2. Visualización de Logs en Real-Time Events

**Real-Time Events** le permite consultar e inspeccionar datos de logs sin procesar de los últimos **7 días** (168 horas). Los logs están disponibles aproximadamente **30 segundos** después de la invocación.

Para ver los logs de su función:

1. Vaya a **Azion Console** → **Observe** → **Real-Time Events**.
2. Seleccione la fuente de datos **Functions Console**.
3. Establezca el rango de tiempo y dispare una solicitud a su función.
4. Las entradas de log aparecerán en la tabla de resultados. Haga clic en cualquier fila para expandir todos los campos.

### Campos de Functions Console

| Campo              | Descripción                                                                      |
| ------------------ | -------------------------------------------------------------------------------- |
| `Configuration ID` | Identificador de la configuración del host virtual                               |
| `Function ID`      | Identificador único de la función                                                |
| `ID`               | Identificador de la solicitud — agrupa todos los mensajes de una sola invocación |
| `Level`            | Nivel de log: `MDN`, `DEBUG`, `INFO`, `ERROR`, `LOG` o `WARN`                    |
| `Line`             | El contenido del mensaje de log — su salida de `console.log()`                   |
| `Line Source`      | `CONSOLE` (desde su código) o `RUNTIME` (error de la plataforma)                 |
| `Solution ID`      | ID de solución único de Azion                                                    |

### Campos de invocación de Functions

La fuente de datos **Functions** (separada de Functions Console) contiene metadatos de la invocación — no los mensajes de log en sí:

| Campo                           | Descripción                                                     |
| ------------------------------- | --------------------------------------------------------------- |
| `Functions Instance ID List`    | IDs de las instancias de función invocadas                      |
| `Functions Initiator Type List` | `1` = Aplicación, `2` = Firewall                                |
| `Functions List`                | Funciones invocadas (de izquierda a derecha), separadas por `;` |
| `Functions Time`                | Tiempo total de ejecución en segundos                           |
| `Function Language`             | Lenguaje utilizado (ej. `javascript`)                           |

---

## 3. Streaming de Logs con Data Stream

Para exportar logs a plataformas externas — como Datadog, Elasticsearch, Splunk o S3 — utilice **Data Stream**. Este reenvía continuamente los registros de log de sus funciones a un endpoint configurado.

La fuente de datos **Functions** de Data Stream captura las siguientes variables por invocación:

| Variable            | Descripción                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `$client`           | Identificador único de cliente de Azion                          |
| `$edge_function_id` | ID de la función ejecutada                                       |
| `$global_id`        | Identificación de la configuración                               |
| `$log_level`        | `ERROR`, `WARN`, `INFO`, `DEBUG` o `TRACE`                       |
| `$log_message`      | El contenido del mensaje de log de su función                    |
| `$message_source`   | `CONSOLE` (desde su código) o `RUNTIME` (error de la plataforma) |
| `$request_id`       | Identificador único de la solicitud                              |
| `$time`             | Marca de tiempo del evento                                       |

### Cómo entrega los logs Data Stream

Data Stream agrupa los registros de log y los envía a su endpoint cada **60 segundos**, o cuando un lote alcanza los **2.000 registros** — lo que ocurra primero. Los destinos soportados incluyen: Apache Kafka, AWS Kinesis Data Firehose, Azure Blob Storage, Azure Monitor, Datadog, Elasticsearch, Google BigQuery, IBM QRadar, S3, Splunk y HTTP/HTTPS POST estándar.

:::info Disponibilidad del endpoint
Data Stream monitoriza su endpoint una vez por minuto. Si el endpoint no es alcanzable, los registros de esa ventana son **descartados** — no se almacenan para un reintento posterior.
:::

---

## 4. Patrones de Registro (Logging)

### Evite registrar datos sensibles

Nunca registre tokens de autenticación, contraseñas o información de identificación personal:

```js
// ❌ No registre cabeceras de autenticación sin procesar
console.log("Auth token:", request.headers.get("Authorization"));

// ✅ Registre solo lo necesario para confirmar el estado de autenticación
console.log("Request authenticated:", request.headers.has("Authorization"));
```

### Registre al inicio y al final de la función

Enmarcar su manejador con logs de inicio y fin facilita la detección de ejecuciones incompletas en Real-Time Events:

```js
const handleRequest = async (request, args) => {
  console.log(JSON.stringify({ event: "start", url: request.url }));

  const response = await processRequest(request, args);

  console.log(JSON.stringify({ event: "end", status: response.status }));
  return response;
};
```

### Use `event.waitUntil()` para el envío de logs no bloqueante

Si reenvía logs a un servicio externo desde dentro de la propia función, use `event.waitUntil()` para que el envío no retrase la respuesta:

```js
addEventListener("fetch", (event) => {
  const response = handleRequest(event.request, event.args);

  event.waitUntil(
    fetch("https://logs.example.com/ingest", {
      method: "POST",
      body: JSON.stringify({ url: event.request.url, ts: Date.now() }),
      headers: { "Content-Type": "application/json" },
    }),
  );

  event.respondWith(response);
});
```

---

## Relacionado

- [Depuración](./debugging.md) — técnicas para diagnosticar errores de funciones usando logs y manejo de errores.
- [Métricas](./metrics.md) — datos agregados de rendimiento para sus funciones.
- [Probar y Observar](../getting-started/test-and-observe.md) — cómo comprobar los logs durante el flujo de Inicio Rápido.
