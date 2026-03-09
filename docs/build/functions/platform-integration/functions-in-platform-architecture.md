---
title: Functions in the Platform Architecture
sidebar_position: 1
description: How Functions fit into the broader Azion platform architecture.
---

# Functions in the Platform Architecture

On the Azion platform, Edge Functions do not exist in isolation. They are part of a hierarchical architecture designed to provide centralized management, global distribution, and event-driven execution.

---

## 1. The Architectural Hierarchy

To run a function on the Azion Edge Network, it must be integrated into the following structure:

**Workload > Edge Application / Edge Firewall > Edge Function**

- **Workload**: The top-level container that manages domains, DNS records, digital certificates, and network protocols. It ensures your application is reachable and secure. For more details, see [Deployment](../../applications/deployment.md).
- **Edge Application**: The foundation for building web applications. It serves as the primary context for request processing, caching, and routing. See the [Edge Applications Overview](../../applications/overview.md).
- **Edge Firewall**: A security-specific context where you can implement custom protection logic, rate limiting, and access control.

## 2. Triggering Functions: The Rules Engine

Functions are executed based on logic defined in the **Rules Engine**. Instead of running for every single request by default, you create rules that determine _when_ and _where_ a function should be triggered.

The Rules Engine uses a **Criteria & Behavior** model:

1.  **Criteria**: Conditions based on the request (e.g., "if the path starts with `/api`").
2.  **Behavior**: The action to take when criteria are met (e.g., "Run Edge Function X").

For a deep dive into how rules work, check [Routing and Rules](../../applications/routing-and-rules.md).

## 3. Execution Contexts and Event Types

Edge Functions are event-driven. Depending on where they are instantiated, they respond to different types of events:

### Fetch Events (Edge Applications)

Most functions operate within an Edge Application and respond to `fetch` events. These are triggered by incoming HTTP requests. In this context, functions can manipulate request/response headers, cookies, and bodies in two phases:

- **Request Phase**: Process data before it reaches the cache or the origin.
- **Response Phase**: Modify data before it is delivered to the end-user.

### Firewall Events (Edge Firewall)

Functions can also be used for security logic. In this context, they listen for `firewall` events. This allows for complex filtering, such as verifying custom signatures or implementing advanced bot mitigation logic before the request is even passed to the application layer.

## 4. Why this matters?

This architecture ensures that functions are:

- **Scalable**: Managed as part of high-level workloads.
- **Controllable**: Triggered only when necessary via the Rules Engine.
- **Extensible**: Easily integrated with other Azion products like Edge Storage or Image Processor through the same Application foundation.
