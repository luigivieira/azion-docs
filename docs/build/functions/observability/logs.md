---
title: Logs
sidebar_position: 1
description: Accessing and understanding logs for Azion Edge Functions.
---

# Logs

Edge Functions on the Azion platform emit logs that are available through two Observe products: **Real-Time Events** for interactive inspection in the Azion Console, and **Data Stream** for forwarding logs to external platforms. Logs are the primary tool for understanding what your function is doing in production — confirming invocations, inspecting computed values, and diagnosing errors.

---

## 1. Writing Logs from Your Function

Inside a function, use the standard `console` API to emit log messages. All `console` output is captured by the runtime and stored under the **Functions Console** data source.

```js
addEventListener("fetch", event => {
  console.log("Function invoked:", event.request.url);
  console.log("Method:", event.request.method);

  event.respondWith(new Response("OK"));
});
```

All four levels are supported and are preserved in the log output:

| Method | Use for |
|---|---|
| `console.log()` | General informational output |
| `console.info()` | Significant lifecycle events |
| `console.warn()` | Non-fatal anomalies |
| `console.error()` | Errors and unexpected conditions |

:::tip Structured logging
Log JSON objects instead of plain strings. This makes your logs filterable in Real-Time Events.

```js
console.log(JSON.stringify({
  event: "cache_miss",
  path: new URL(event.request.url).pathname,
}));
```
:::

---

## 2. Viewing Logs in Real-Time Events

**Real-Time Events** lets you query and inspect raw log data from the last **7 days** (168 hours). Logs are available within approximately **30 seconds** of the invocation.

To view your function logs:

1. Go to **Azion Console** → **Observe** → **Real-Time Events**.
2. Select the **Functions Console** data source.
3. Set the time range and trigger a request to your function.
4. The log entries appear in the results table. Click any row to expand all fields.

### Functions Console fields

| Field | Description |
|---|---|
| `Configuration ID` | Virtual host config identifier |
| `Function ID` | Unique function identifier |
| `ID` | Request identifier — groups all messages from a single invocation |
| `Level` | Log level: `MDN`, `DEBUG`, `INFO`, `ERROR`, `LOG`, or `WARN` |
| `Line` | The log message content — your `console.log()` output |
| `Line Source` | `CONSOLE` (from your code) or `RUNTIME` (platform error) |
| `Solution ID` | Unique Azion solution ID |

### Functions invocation fields

The **Functions** data source (separate from Functions Console) contains invocation metadata — not the log messages themselves:

| Field | Description |
|---|---|
| `Functions Instance ID List` | IDs of function instances invoked |
| `Functions Initiator Type List` | `1` = Application, `2` = Firewall |
| `Functions List` | Functions invoked (left to right), separated by `;` |
| `Functions Time` | Total execution time in seconds |
| `Function Language` | Language used (e.g., `javascript`) |

---

## 3. Streaming Logs with Data Stream

For exporting logs to external platforms — such as Datadog, Elasticsearch, Splunk, or S3 — use **Data Stream**. It continuously forwards log records from your functions to a configured endpoint.

Data Stream's **Functions** data source captures the following variables per invocation:

| Variable | Description |
|---|---|
| `$client` | Unique Azion customer identifier |
| `$edge_function_id` | ID of the executed function |
| `$global_id` | Settings identification |
| `$log_level` | `ERROR`, `WARN`, `INFO`, `DEBUG`, or `TRACE` |
| `$log_message` | The log message content from your function |
| `$message_source` | `CONSOLE` (from your code) or `RUNTIME` (platform error) |
| `$request_id` | Unique request identifier |
| `$time` | Timestamp of the event |

### How Data Stream delivers logs

Data Stream batches log records and sends them to your endpoint every **60 seconds**, or when a batch reaches **2,000 records** — whichever comes first. Supported destinations include: Apache Kafka, AWS Kinesis Data Firehose, Azure Blob Storage, Azure Monitor, Datadog, Elasticsearch, Google BigQuery, IBM QRadar, S3, Splunk, and Standard HTTP/HTTPS POST.

:::info Endpoint availability
Data Stream monitors your endpoint once per minute. If the endpoint is unreachable, records for that window are **discarded** — they are not buffered for later retry.
:::

---

## 4. Logging Patterns

### Avoid logging sensitive data

Never log authentication tokens, passwords, or personally identifiable information:

```js
// ❌ Do not log raw auth headers
console.log("Auth token:", request.headers.get("Authorization"));

// ✅ Log only what you need to confirm authentication state
console.log("Request authenticated:", request.headers.has("Authorization"));
```

### Log at function entry and exit

Bracketing your handler with entry/exit logs makes it easy to detect incomplete executions in Real-Time Events:

```js
const handleRequest = async (request, args) => {
  console.log(JSON.stringify({ event: "start", url: request.url }));

  const response = await processRequest(request, args);

  console.log(JSON.stringify({ event: "end", status: response.status }));
  return response;
};
```

### Use `event.waitUntil()` for non-blocking log shipping

If you forward logs to an external service from within the function itself, use `event.waitUntil()` so the shipping does not delay the response:

```js
addEventListener("fetch", event => {
  const response = handleRequest(event.request, event.args);

  event.waitUntil(
    fetch("https://logs.example.com/ingest", {
      method: "POST",
      body: JSON.stringify({ url: event.request.url, ts: Date.now() }),
      headers: { "Content-Type": "application/json" },
    })
  );

  event.respondWith(response);
});
```

---

## Related

- [Debugging](./debugging.md) — techniques for diagnosing function errors using logs and error handling.
- [Metrics](./metrics.md) — aggregate performance data for your functions.
- [Test and Observe](../getting-started/test-and-observe.md) — how to check logs during the Getting Started flow.
