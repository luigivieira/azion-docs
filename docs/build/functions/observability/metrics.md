---
title: Metrics
sidebar_position: 3
description: Metrics available for Azion Edge Functions.
---

# Metrics

Metrics give you an aggregated view of how your Edge Functions are performing over time. While logs tell you what happened in a specific invocation, metrics answer higher-level questions: How many requests is my function handling? Are invocations coming from applications or firewalls?

---

## 1. Real-Time Metrics

**Real-Time Metrics** provides chart-based visualization of aggregated data for your functions. Data is fetched via the Azion GraphQL API and displayed in near real time, with a maximum aggregation delay of **10 minutes**. Historical data is retained for **2 years**.

To access function metrics:

1. Go to **Azion Console** → **Observe** → **Real-Time Metrics**.
2. Select the **Build** tab.
3. Click **Functions**.

### Available charts

| Chart | Description |
|---|---|
| **Total Invocations** | Sum of all function executions in the selected time range |
| **Firewall Invocations** | Invocations from functions tied to an Edge Firewall |
| **Applications Invocations** | Invocations from functions tied to an Edge Application |

Total Invocations is the sum of Firewall and Applications Invocations.

### Time range options

You can filter by: Last Hour, Last 24 Hours, Last 7 Days, Last 30 Days, Last 6 Months, or a custom date/time range. The **Last Hour** view auto-refreshes every minute.

:::info Metrics vs. billing
Real-Time Metrics uses an at-most-once approach optimized for performance, while billing uses an exactly-once model. The average difference is less than 1%. Billing data is authoritative for cost purposes.
:::

---

## 2. Querying Metrics with the GraphQL API

Real-Time Metrics uses the **Azion GraphQL API** under the hood. You can query the same data programmatically to build custom dashboards, feed alerting pipelines, or integrate metrics into external tools.

From any chart in Real-Time Metrics, open the context menu and select **Copy Query** to get the exact GraphQL query that populates that chart.

The GraphQL API endpoint is:

```
https://api.azionapi.net/metrics/graphql
```

Include your personal token in the `Authorization` header.

---

## 3. Correlating Metrics with Logs

Metrics and logs are complementary:

- **Metrics** tell you _how many_ invocations occurred and _where_ they came from (application vs. firewall).
- **Logs** tell you _what happened_ in each invocation.

A typical workflow when investigating an anomaly:

1. Notice a spike in invocations in Real-Time Metrics.
2. Narrow the time range to the spike window.
3. Switch to **Real-Time Events** → **Functions** data source to see invocation metadata (instance IDs, execution time, initiator type) for that window.
4. Switch to **Real-Time Events** → **Functions Console** to inspect `console.log()` output and errors from the same window.

---

## 4. Identifying the Upstream in Application Logs

When a function is invoked from an Edge Application, the **HTTP Requests** data source in Real-Time Events records the upstream as:

```
Upstream Addr = 127.0.0.1:1666
```

This value (`127.0.0.1:1666`) is the address of the **Azion Cells Runtime** — the execution environment for Edge Functions. You can use this to filter application-level logs and isolate only requests that triggered a function.

---

## 5. Using the Grafana Plugin

For teams that prefer a local observability stack, Azion provides a **Grafana plugin** that connects to the same GraphQL API used by Real-Time Metrics. With it, you can:

- Build custom dashboards combining function invocations with other Azion metrics (WAF, DNS, Cache).
- Define alert rules based on invocation thresholds.
- Share dashboards across your team.

Refer to the Azion documentation for installation and configuration instructions.

---

## Related

- [Logs](./logs.md) — per-invocation detail and `console.log()` output via Real-Time Events and Data Stream.
- [Debugging](./debugging.md) — techniques for diagnosing specific errors.
- [Performance Optimization](../advanced/performance-optimization.md) — strategies for reducing compute time and resource usage.
