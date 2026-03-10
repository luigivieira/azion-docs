---
title: Linking Instances to Rules
sidebar_position: 4
description: How to configure the Rules Engine to invoke a Function Instance.
---

# Linking Instances to Rules

A Function Instance does not execute automatically. You must configure a rule in the **Rules Engine** that invokes the instance under specific conditions. This is what connects the "what" (the instance) to the "when" (the request criteria).

---

## Prerequisites

- A Function Instance already created in the application. See [Creating Instances](./creating-instances.md).
- The **Edge Functions** module enabled in the application's Main Settings.

---

## How the Rules Engine works

The Rules Engine evaluates each incoming request against a list of rules. Each rule has:

- **Criteria**: One or more conditions that must be true for the rule to apply (e.g., request path, method, headers, cookies).
- **Behavior**: The action to take when all criteria match (e.g., run a function, set a header, redirect).

Rules are evaluated in order. The first matching rule's behavior is applied. If no rule matches, the request is processed normally.

---

## Steps

### 1. Open Rules Engine

Inside the Edge Application, go to the **Rules Engine** tab.

### 2. Create a new rule

Click **Add Rule**. Choose the **phase** in which the rule should run:

- **Request Phase**: Evaluated before the request is forwarded to the cache or origin. Use this when the function needs to inspect or modify the incoming request, authenticate the user, or return a response directly.
- **Response Phase**: Evaluated after the origin or cache returns a response, before delivery to the client. Use this when the function needs to modify or enrich the outgoing response.

### 3. Configure the criteria

Define the conditions that must be true for the rule to apply. Each condition is composed of a **variable** (what to inspect), an **operator** (how to compare), and a **value** (what to compare against).

Available operators:

| Operator | Requires a value | Description |
|---|:---:|---|
| `is equal` | ✓ | The variable's value exactly matches the specified string. |
| `is not equal` | ✓ | The variable's value does not exactly match the specified string. |
| `starts with` | ✓ | The variable's value begins with the specified string. |
| `does not start with` | ✓ | The variable's value does not begin with the specified string. |
| `matches` | ✓ | The variable's value matches the specified regular expression. |
| `does not match` | ✓ | The variable's value does not match the specified regular expression. |
| `exists` | — | The variable has any value. |
| `does not exist` | — | The variable has no value. |

Common examples using `Request URI`:

| Operator | Value | Meaning |
|---|---|---|
| `starts with` | `/api` | Matches any path under `/api` |
| `is equal` | `/login` | Matches only the `/login` path |
| `does not start with` | `/public` | Matches any path that is not under `/public` |
| `matches` | `^/products/[0-9]+$` | Matches paths like `/products/42` using a regex |

You can combine multiple conditions using **And** (all must match) or **Or** (any must match).

### 4. Add the "Run Function" behavior

In the **Behaviors** section, click **Add Behavior** and select **Run Function**. Then choose the instance from the dropdown.

:::note One function per rule
Each rule can invoke one function instance. If you need to run multiple functions for the same request, create separate rules — one per function — that share the same criteria.
:::

### 5. Save the rule

Click **Save**. The rule is immediately active and will be evaluated on the next matching request.

---

## Example: running a function for a specific path

The following configuration invokes the `AuthFunction - Production` instance for all requests to paths starting with `/protected`:

- **Phase**: Request
- **Criteria**: `If Request URI` → `starts with` → `/protected`
- **Behavior**: `Run Function` → `AuthFunction - Production`

Any request to `/protected/dashboard` or `/protected/settings` will trigger the function. Requests to `/public` or `/` will not.

---

## Combining functions with other behaviors

A rule can have multiple behaviors. For example, you can run a function and also add a request header in the same rule:

- **Behavior 1**: `Run Function` → `MyFunction - Instance`
- **Behavior 2**: `Add Request Header` → `X-Processed-By: edge`

Behaviors are applied in the order they are listed. If your function uses `event.respondWith()` to return a response directly, behaviors that come after it in the response pipeline may not apply.

The following table lists the behaviors available in the Rules Engine:

| Behavior | Required Module | Description |
|---|---|---|
| **Add Request Cookie** | Application Accelerator | Adds a cookie to the request before it reaches the origin. |
| **Add Request Header** | — | Adds or overwrites a header on the incoming request. |
| **Bypass Cache** | Application Accelerator | Forces the request to skip the cache and go directly to the origin. |
| **Capture Match Groups** | Application Accelerator | Captures parts of the URI using a regex, making the captured groups available to other behaviors in the same rule. |
| **Deliver** | — | Delivers the response to the client and ends rule evaluation. |
| **Deny (403 Forbidden)** | — | Immediately returns a 403 response to the client. |
| **Filter Request Cookie** | Application Accelerator | Removes a cookie from the request. |
| **Filter Request Header** | — | Removes a header from the request. |
| **Forward Cookies** | Application Accelerator | Forwards client cookies to the origin server. |
| **No Content (204)** | — | Immediately returns a 204 No Content response to the client. |
| **Optimize Images** | Application Accelerator | Applies automatic image optimization — format conversion, resizing, and compression — to image responses. |
| **Redirect HTTP to HTTPS** | — | Redirects HTTP requests to HTTPS with a 301 response. |
| **Redirect To (301 Moved Permanently)** | — | Permanently redirects the client to a specified URL. |
| **Redirect To (302 Found)** | — | Temporarily redirects the client to a specified URL. |
| **Rewrite Request** | Application Accelerator | Rewrites the request URI before it reaches the cache or origin. |
| **Run Function** | Edge Functions | Invokes a Function Instance. |
| **Set Cache Policy** | — | Applies a specific cache TTL configuration to the request. |
| **Set Connector** | — | Routes the request through a specific connector, such as a private origin or load balancer. |

---

## Next step

To understand how functions interact with caching, origin, and other modules throughout the full request lifecycle, see [Application Integration](./application-integration.md).
