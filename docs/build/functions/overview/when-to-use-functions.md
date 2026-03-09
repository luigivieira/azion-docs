---
title: When to Use Functions
sidebar_position: 2
description: Understand the use cases and scenarios where Azion Edge Functions shine.
---

# When to Use Functions

Azion Edge Functions are highly versatile, but they are most effective when used for tasks that benefit from being physically close to the user. Understanding when to use them — and when to delegate to a traditional backend — is key to building a high-performance architecture.

---

## 1. High-Value Scenarios (Edge-First)

The primary reason to use Edge Functions is **low latency**. These scenarios represent the "sweet spot" for edge computing:

- **Request & Response Manipulation**: Adding security headers (HSTS, CSP), rewriting URLs, or normalizing query strings before they reach your origin.
- **Authentication & Authorization**: Validating JWTs or API keys at the edge to block unauthorized requests before they consume origin resources.
- **Dynamic Personalization**: Tailoring content based on the user's location (GeoIP), device type, or cookies without a full round-trip to a centralized database.
- **A/B Testing**: Randomizing or segmenting users into different buckets and serving different content or redirecting them instantly.

* **Security Filtering**: Implementing custom WAF rules, rate limiting, or hotlink protection.
* **IoT & Real-time Data**: Pre-processing and filtering telemetry data from IoT devices at the edge before sending it to a central data lake.

## 2. When Functions Are NOT Ideal

Edge Functions are optimized for speed and efficiency, not for heavy lifting. You should avoid using them for:

- **Compute-Intensive Tasks**: Large-scale video encoding or complex simulations.
  :::tip Tip
  In cases where high performance is strictly required for compute-intensive logic, you can use **WebAssembly (Wasm)** to run compiled code from languages like Rust or C++ at near-native speeds.
  :::
- **Long-Running Processes**: Tasks that take several minutes to complete (like generating a massive PDF or running a long data migration).
- **Very Large Payloads**: Processing multi-gigabyte files in memory.
- **Direct Local Filesystem Access**: The Azion Runtime is a sandboxed environment and does not provide traditional persistent disk access.

## 3. Execution Limits & Background Tasks

To maintain high performance across the network, Edge Functions have specific boundaries:

- **CPU Time Limits**: Functions are designed for short bursts of execution (typically measured in milliseconds, though the limits allow for longer bursts depending on the plan).
- **Memory Sandboxing**: Each Isolate has a memory limit. Excessive memory usage will result in the Isolate being terminated.

:::info Background Processing

If you need to perform a task that doesn't need to block the response to the user (like sending telemetry or updating a cache), you can use the `event.waitUntil()` method. This allows the function to continue processing in the background after the response has been delivered.

Detailed examples and implementation guides for `event.waitUntil()` are available in the [Development](../development/function-structure) section of this documentation.
:::

## 4. Migration Tips & Precautions

When moving code from Node.js or other serverless platforms, keep these tips in mind:

- **API Compatibility**: The Azion Runtime implements Web Standard APIs (Fetch, Streams, Web Crypto). Some Node.js-specific modules (like `fs`, `child_process`, or `net`) are not available.
- **Global State**: Do not rely on global variables to persist state between requests. Isolates can be created and destroyed frequently. Use **Azion KV Storage** for persistent state.
- **No Persistent Connections**: Edge functions are short-lived. Avoid keeping long-running WebSocket connections or persistent database connections alive inside the function.
- **Local FS**: If your code expects to read/write to `/tmp` or local directories, you should migrate that logic to use an external storage service or Azion's Edge Storage.

---

### Need more power?

If your task exceeds edge limits, consider a **Hybrid Approach**:

1. Handle the initial request and validation at the **Edge**.
2. Delegate the heavy processing to a **Queue** or a **Traditional Backend** (Origin).
3. Use `event.waitUntil` to trigger these background processes without delaying the user.
