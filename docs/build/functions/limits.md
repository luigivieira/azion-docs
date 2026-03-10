---
title: Limits
sidebar_position: 10
description: Technical limits and quotas for Azion Edge Functions.
---

# Limits

This page describes the technical limits that apply to Azion Edge Functions. Understanding these boundaries helps you design functions that are reliable under production conditions.

:::info Plan-specific limits
Some limits vary by plan. The values listed here reflect the defaults. Contact [Azion Support](https://www.azion.com/en/support/) or check your plan documentation for limits specific to your account.
:::

---

## Code and Configuration

| Limit | Value |
|---|---|
| Maximum function code size | 1 MB |
| Maximum Function Instance Arguments size | 32 KB |
| Maximum number of functions per account | 100 |
| Maximum number of function instances per Edge Application | 10 |
| Maximum number of function instances per Edge Firewall | 10 |

Function code is measured as the raw JavaScript text saved to the platform. If you use a bundler, the bundled output must fit within 1 MB. WebAssembly modules embedded as Base64 strings count toward this limit.

---

## Execution Time

| Limit | Value |
|---|---|
| Maximum wall-clock time per invocation | 30 seconds |
| Maximum CPU time per invocation | See plan |

**Wall-clock time** is the total elapsed time from when the event is dispatched to when the response is delivered and all `waitUntil` promises have settled. I/O wait time (time waiting for `fetch()` responses, DNS lookups, etc.) counts against the wall-clock limit.

**CPU time** is the actual computation time used by your code — time spent running JavaScript, not waiting for I/O. CPU time limits are enforced separately and typically much lower than wall-clock limits. If your function exceeds the CPU time budget, it is terminated.

For functions that call slow external APIs, set explicit timeouts on outbound `fetch()` calls using `AbortController` to prevent the wall-clock limit from being hit. See [Calling External APIs](./development/calling-external-apis.md) for the pattern.

---

## Memory

| Limit | Value |
|---|---|
| Maximum memory per isolate | 128 MB |

This limit applies to all memory used by a single isolate instance — the JavaScript heap, WebAssembly linear memory, and any cached or streamed data held in memory during execution.

If your function processes large request or response bodies, consider streaming them rather than buffering the entire body into memory. See [Performance Optimization](./advanced/performance-optimization.md) for streaming patterns.

---

## Subrequests

| Limit | Value |
|---|---|
| Maximum subrequests per invocation | 50 |
| Maximum subrequest response body size held in memory | See wall-clock and memory limits |

A **subrequest** is any outbound `fetch()` call made from within a function. Each call counts against the subrequest limit for that invocation. Subrequests to Azion services (such as KV Storage) count the same as subrequests to external hosts.

To stay within the limit:
- Cache responses for frequently accessed resources using the Cache API.
- Parallelize independent subrequests with `Promise.all()` (they still count individually, but you reduce total latency).
- Avoid recursive or fan-out patterns where a single invocation triggers a cascade of `fetch()` calls.

---

## Logs

| Limit | Value |
|---|---|
| Maximum total `console` output per invocation | 100 KB |
| Log retention in Real-Time Events | 7 days (168 hours) |
| Log availability after invocation | ~30 seconds |

Log output that exceeds 100 KB per invocation may be truncated. Prefer structured, compact log entries (JSON with specific fields) over verbose plain-text logging.

---

## Function Instance Arguments

| Limit | Value |
|---|---|
| Maximum Arguments JSON size | 32 KB |

Arguments are meant for configuration values — API base URLs, feature flags, signing keys. They are not a substitute for a database or a large configuration file. If your configuration exceeds 32 KB, move it to an external storage service accessible via `fetch()`.

---

## What Happens When a Limit Is Exceeded

| Limit exceeded | Behavior |
|---|---|
| CPU time | Function is terminated; client receives HTTP 500; error logged in Real-Time Events |
| Wall-clock time | Function is terminated; client receives HTTP 504; error logged in Real-Time Events |
| Memory | Function is terminated; client receives HTTP 500; error logged in Real-Time Events |
| Subrequest count | The `fetch()` call that exceeds the limit throws an error |
| Code size | The function cannot be saved; the Azion Console or CLI returns a validation error |

In all termination cases, the error is visible in **Real-Time Events** under the **Functions Console** data source with a `LINE_SOURCE` of `RUNTIME`.

---

## Increasing Limits

Some limits can be increased for accounts on higher plans or through custom agreements. To request a limit increase, contact [Azion Support](https://www.azion.com/en/support/) with details about your use case and expected traffic profile.

---

## Related

- [Execution Model](./runtime-reference/execution-model.md) — how CPU time and wall-clock time are enforced.
- [Performance Optimization](./advanced/performance-optimization.md) — techniques for staying within memory and subrequest limits.
- [Logs](./observability/logs.md) — log retention and format details.
