---
title: What are Functions
sidebar_position: 1
description: Learn what Azion Edge Functions are and how they work.
---

# What are Functions

Azion Edge Functions are event-driven, serverless functions that execute logic on the Azion Edge Network. By running close to your users, they provide a powerful way to customize how requests and responses are handled, implement security logic, or build entire microservices at the edge.

---

## 1. What is Serverless?

Serverless is a cloud execution model where you can write and deploy code without worrying about the underlying infrastructure.

- **Zero Management**: You don't need to provision, configure, or scale servers.
- **Automatic Scaling**: The platform automatically handles traffic spikes by scaling the execution environment as needed.
- **Pay-as-you-go**: Instead of paying for idle server time, you only pay for the execution time and resources your functions actually use.

In the Azion ecosystem, this means you focus solely on your business logic, while Azion handles the global distribution and execution.

## 2. The Runtime: Powered by V8

Azion Edge Functions run on the **Azion Runtime**, which is built on the **V8 engine** — the same high-performance JavaScript engine that powers Google Chrome and Node.js.

### Why V8 Isolates?

Unlike traditional serverless platforms that use containers (like Docker) or Virtual Machines, Azion uses **V8 Isolates**. This technology allows hundreds of functions to run securely within a single process.

- **Efficiency**: Isolates use significantly less memory than containers.
- **Security**: Each function runs in its own sandboxed environment, isolated from others.
- **Speed**: Because Isolates don't need to boot an entire operating system, they start almost instantly.

## 3. Performance: Cold vs Warm Starts

One of the biggest challenges in serverless computing is the **Cold Start**.

- **Cold Start**: Occurs when a function is executed for the first time in a new environment. Traditional container-based platforms can take seconds to "boot up." Because Azion uses V8 Isolates, cold starts are negligible (near-zero).
- **Warm Start**: Occurs when a request is handled by an already initialized Isolate. Azion keeps your functions "warm" after the first execution, ensuring that subsequent requests are processed with even lower latency.

## 4. Why Run Logic at the Edge?

Execution at the Edge means your code runs at the point of presence (PoP) nearest to the user, rather than a centralized data center (the "origin").

1.  **Lower Latency**: Round-trip times are minimized because data travels a shorter distance.
2.  **Reduced Load on Origin**: You can handle validation, caching logic, and redirecting at the edge, so only necessary requests reach your main servers.
3.  **Real-time Processing**: Ideal for A/B testing, personalization, and security filtering (like blocking malicious IPs) before they even hit your infrastructure.

---

## Supported Languages

Azion Edge Functions are designed to be fast and flexible. You can write them in:

- **JavaScript (ES6+)**: The native language of the V8 engine.
- **TypeScript**: Supported via transpilation.
- **WebAssembly (Wasm)**: Allowing you to run code written in languages like Rust, C, or Go for compute-intensive tasks.
