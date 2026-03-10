---
title: Application Integration
sidebar_position: 5
description: How Edge Functions integrate with Edge Applications and interact with the full request/response lifecycle.
---

# Application Integration

An Edge Function does not replace an Edge Application — it extends it. Functions run as one behavior within the broader request/response pipeline managed by the application. Understanding where functions fit in that pipeline determines how you design them.

---

## 1. The Edge Functions Module

For an Edge Application to support functions, the **Edge Functions** module must be enabled in the application's **Main Settings**. This module unlocks:

- The **Functions** tab, where you create and manage Function Instances.
- The **Run Function** behavior in the Rules Engine.

Disabling the module hides the Functions tab and prevents function behaviors from being evaluated, but does not delete existing instances.

---

## 2. Where Functions Execute in the Pipeline

Each request to an Edge Application passes through the following stages:

```
Incoming Request
      │
      ▼
 Request Phase (Rules Engine)
      │  ← functions can run here
      ▼
  Cache Layer
      │
      ▼
   Origin
      │
      ▼
 Response Phase (Rules Engine)
      │  ← functions can run here
      ▼
 Client Response
```

### Request Phase

Functions in the **Request Phase** execute before the cache is consulted and before any request is forwarded to the origin. This means:

- If the function returns a response via `event.respondWith()`, the cache and origin are bypassed entirely for that request.
- If the function modifies the request (headers, path, body) and does not return a response, the modified request continues through the cache and origin stages.

Use the Request Phase for: authentication and authorization, redirects, A/B testing, request rewriting, computing responses from scratch (e.g., serving from Edge Storage).

### Response Phase

Functions in the **Response Phase** execute after the origin or cache returns a response, before it is sent to the client. At this stage:

- The function receives the full response, including status code, headers, and body.
- It can modify or replace the response before delivery.

Use the Response Phase for: injecting security headers, transforming response bodies, personalization based on response data, logging.

---

## 3. Interacting with Other Behaviors

Functions coexist with other Rules Engine behaviors. A single rule can combine a function with other actions:

- **Cache**: A function in the Request Phase that returns a response short-circuits caching for that request. To cache function responses, configure the cache behavior separately and ensure the function does not call `event.respondWith()` when a cache hit is expected.
- **Compression (Gzip/Brotli)**: Can be applied in the Response Phase alongside or after a function, reducing the size of the function's output before delivery.
- **Headers**: `Add Request Header` or `Add Response Header` behaviors can complement function logic — for example, tagging requests before they reach the function, or adding headers after the function executes.

:::tip Behavior order matters
Within a rule, behaviors execute in the order they are listed. If a function returns a response directly and you need a header added to that response, ensure the header behavior is listed after the function — or add the header inside the function code itself.
:::

---

## 4. Accessing Application Context from Within a Function

Functions have access to the full incoming request through `event.request`. This includes:

- The URL, method, and body.
- All request headers — including any headers added by upstream Rules Engine behaviors.
- The `event.args` object from the Function Instance configuration.

Functions do not have built-in access to the application's cache state or origin configuration — they operate on the request/response data directly. For reading or writing cached content programmatically, use **Edge Storage** via the Azion Storage API.

---

## 5. Edge Firewall vs. Edge Application

Functions can also run inside an **Edge Firewall**, which operates before the request reaches the application layer. The key differences:

| | **Edge Application** | **Edge Firewall** |
|---|---|---|
| **Event type** | `fetch` | `firewall` |
| **Execution point** | During request/response processing | Before the application receives the request |
| **Primary use** | Business logic, personalization, API calls | Security filtering, bot mitigation, access control |
| **Can return responses** | Yes | Yes (to block or challenge requests) |

Use the Edge Firewall when you need to make decisions — allow, block, or challenge — before your application logic is involved at all.

---

## Next steps

- [Function Structure](../development/function-structure.md) — understand how to write functions that interact with the request/response pipeline.
- [Handling Requests and Responses](../development/handling-requests-and-responses.md) — practical patterns for reading and modifying requests and responses.
