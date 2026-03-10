---
title: What Is a Function Instance
sidebar_position: 2
description: Understand what a Function Instance is and why it is the key link between a function and an Edge Application.
---

# What Is a Function Instance

A **Function Instance** is a configured reference to an Edge Function within an Edge Application or Edge Firewall. It is the entity that the Rules Engine invokes — not the function code itself.

---

## 1. Function vs. Function Instance

Understanding the distinction between a function and a function instance is essential:

| | **Edge Function** | **Function Instance** |
|---|---|---|
| **What it is** | The code you write and save | A reference to that code, scoped to one application |
| **Where it lives** | Your account's function library | Inside a specific Edge Application or Edge Firewall |
| **What the Rules Engine uses** | — | The instance |

Think of the function as a blueprint and the instance as a deployment of that blueprint in a specific context. The same function can have multiple instances — across different applications, or even multiple instances within the same application.

## 2. Why Instances Exist

Instances exist to enable **reuse with per-application configuration**.

Imagine you have an authentication function. Rather than duplicating the code for each application that needs it, you save it once and create an instance in each application. Each instance can be configured differently using the **Arguments** JSON — one instance might enforce strict token expiry, another might use a relaxed policy for internal tools.

## 3. The Arguments JSON

Every Function Instance has an **Arguments** tab where you can provide a JSON object. This object is passed to the function at runtime via `event.args`.

For example, if your instance has this configuration:

```json
{
  "allowedOrigins": ["https://app.example.com"],
  "strictMode": true
}
```

Your function can read it as:

```js
addEventListener("fetch", event => {
  const { allowedOrigins, strictMode } = event.args;

  // use the configuration in your logic
  event.respondWith(new Response(`Strict mode: ${strictMode}`));
});
```

This separation between code and configuration is what makes functions reusable. The logic stays the same; only the arguments change per instance.

:::tip No hardcoded values
Use Arguments for any value that might differ between deployments: API keys (via environment variables), allowed origins, feature flags, target URLs. This keeps your function code generic and your instances specific.
:::

## 4. Instance Lifecycle

- **Creating an instance** does not deploy or execute anything on its own. The function only runs when a Rules Engine rule with a "Run Function" behavior matches a request.
- **Deleting an instance** removes it from the application. Any rules that referenced it will stop invoking the function.
- **Updating Arguments** on an instance takes effect on the next matching request, with no redeployment required.

## Next steps

- [Creating Instances](./creating-instances.md) — how to add a Function Instance to an application.
- [Linking Instances to Rules](./linking-instances-to-rules.md) — how to configure the Rules Engine to invoke your instance.
