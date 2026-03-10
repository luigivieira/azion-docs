---
title: Functions in the Platform Architecture
sidebar_position: 1
description: How Functions fit into the broader Azion platform architecture.
---

# Functions in the Platform Architecture

On the Azion platform, Edge Functions do not exist in isolation. They are part of a hierarchical architecture designed to provide centralized management, global distribution, and event-driven execution.

At a high level, a request flows like this:

> **User** → **Workload** (domain) → **Edge Application or Edge Firewall** → **Rules Engine** → **Edge Function**

![Azion Platform Architecture](https://github.com/luigivieira/azion-docs/releases/download/media-v1/general-architecture.jpg)

---

## 1. The Architectural Hierarchy

To run a function on the Azion Edge Network, it must be integrated into the following structure:

**Workload > Edge Application / Edge Firewall > Function Instance > Edge Function**

- **Workload**: The top-level container that manages domains, DNS records, digital certificates, and network protocols. It is the entry point for all traffic.
- **Edge Application**: The foundation for request processing, caching, and routing. Functions used for business logic — redirects, personalization, API proxying — live here.
- **Edge Firewall**: A security-focused context for implementing custom protection logic, rate limiting, and access control. Functions here execute before requests even reach the application layer.
- **Function Instance**: A reference that binds a specific function to an application or firewall. This is what the Rules Engine invokes. See [What Is a Function Instance](./what-is-a-function-instance.md).

## 2. Triggering Functions: The Rules Engine

Functions are not executed for every request by default. The **Rules Engine** determines _when_ and _where_ a function runs, using a **Criteria & Behavior** model:

1. **Criteria**: Conditions evaluated against the request — for example, "if the path starts with `/api`".
2. **Behavior**: The action taken when criteria are met — for example, "Run Function Instance X".

This conditional model means you have precise control over execution. A single application can have multiple rules targeting different paths, with each rule invoking a different function instance.

For more on how rules work, see [Linking Instances to Rules](./linking-instances-to-rules.md).

## 3. Execution Contexts and Event Types

Edge Functions are event-driven. The events they receive depend on where they are instantiated.

### Fetch Events (Edge Applications)

Functions inside an Edge Application respond to `fetch` events, triggered by incoming HTTP requests. They can inspect and modify requests and responses in two phases:

- **Request Phase**: Runs before the request reaches the cache or origin. Use this for authentication checks, redirects, request rewriting, or computing a response directly.
- **Response Phase**: Runs after the origin or cache produces a response, before delivery to the client. Use this for header injection, response transformation, or logging.

### Firewall Events (Edge Firewall)

Functions inside an Edge Firewall respond to `firewall` events. They execute at the network edge before the request is handed off to the application layer — making them ideal for bot mitigation, custom signature verification, IP blocking, and other security logic.

## 4. Why This Architecture Matters

This layered design ensures that functions are:

- **Conditional**: The Rules Engine prevents unnecessary executions. Functions only run when relevant criteria are matched, keeping latency and compute usage low.
- **Reusable**: The same function code can be instantiated in multiple applications or firewalls, each with its own configuration via the Arguments JSON.
- **Composable**: Functions coexist with other behaviors in the Rules Engine — caching, compression, redirects — giving you fine-grained control over the full request/response lifecycle.
