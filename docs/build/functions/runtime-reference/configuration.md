---
title: Configuration
sidebar_position: 3
description: Configuration options for Azion Edge Functions.
---

# Configuration

Edge Functions are configured at two levels: the **function definition** (the code and its metadata), and the **function instance** (where and how it runs within an application or firewall). This page covers both.

---

## 1. Function Metadata

When you create or edit a function in the Azion Console or via the API, you configure the following properties:

| Property | Description |
|---|---|
| **Name** | A human-readable identifier for the function. Used to find it in the Functions library. |
| **Language** | The language of the function code. Currently, only `JavaScript` is supported (TypeScript must be compiled to JavaScript before saving). |
| **Code** | The function source code. Saved and executed as-is — no server-side bundling is performed by the platform. |
| **Initiator Type** | Whether the function is intended for **Edge Application** (responds to `fetch` events) or **Edge Firewall** (responds to `firewall` events). This controls which event type the runtime dispatches. |
| **Active** | Whether the function is available to be instantiated. Inactive functions cannot be assigned to a Function Instance. |

---

## 2. Function Instance Arguments

Each **Function Instance** has an **Arguments** field — a JSON object that is passed to your function at runtime via `event.args`. This is the primary way to supply environment-specific or instance-specific configuration to a function.

Arguments are configured per instance, so the same function code can behave differently depending on where it is deployed:

```json
{
  "targetOrigin": "https://api.example.com",
  "cacheTTL": 300,
  "allowedRoles": ["admin", "editor"]
}
```

Your function reads these values at runtime:

```js
addEventListener("fetch", event => {
  const { targetOrigin, cacheTTL, allowedRoles } = event.args;

  // use the configuration values...
});
```

### Argument validation

The runtime does not validate the structure of `event.args`. You are responsible for validating the presence and types of expected fields.

```js
const handleRequest = async (request, args) => {
  const origin = args.targetOrigin;

  if (typeof origin !== "string" || !origin.startsWith("https://")) {
    console.error("Invalid targetOrigin in args:", origin);
    return new Response("Function misconfigured", { status: 500 });
  }

  return fetch(`${origin}${new URL(request.url).pathname}`);
};
```

### Size limit

The Arguments JSON object is subject to a maximum size limit. Keep arguments concise — they are meant for configuration values (URLs, flags, keys), not for large data payloads. See [Limits](../limits.md) for the current limit.

---

## 3. Rules Engine Behavior

A Function Instance is not invoked by default for every request. It is triggered by a **Rule** in the Rules Engine of an Edge Application or Edge Firewall. The rule specifies:

1. **Criteria**: Which requests should match (e.g., path starts with `/api`, a specific header is present).
2. **Behavior**: What to do when the criteria match — in this case, "Run Function" with a specific Function Instance.

This configuration is done in the **Rules Engine** tab of your Edge Application or Edge Firewall, not in the function itself. See [Linking Instances to Rules](../platform-integration/linking-instances-to-rules.md) for step-by-step instructions.

---

## 4. Inactive vs. Active Functions

A function marked as **inactive** in the Azion Console cannot be instantiated or executed. This is useful for:

- Removing a function from production without deleting it permanently.
- Keeping draft versions of functions that are not ready to be deployed.

Existing Function Instances that reference an inactive function will fail when the rule that invokes them is matched — the runtime will return an error response instead of executing the function.

---

## 5. Versioning and Deployment

There is no built-in versioning system for function code. Saving a new version of a function in the Azion Console **overwrites** the current code immediately. All Function Instances that reference that function will use the new code on the next invocation.

Recommended practices for safe deployments:

- **Use a staging application**: Create a separate Edge Application (or Edge Firewall) pointing to a staging domain, with the same function instances. Test there before updating the production function.
- **Use Azion CLI with a CI/CD pipeline**: The CLI allows you to manage function code as part of your source control workflow, giving you a history of changes through your version control system (e.g., Git).
- **Blue/green via multiple instances**: Create a new function with the updated code, redirect a small portion of traffic to an instance of the new function via Rules Engine criteria, then gradually shift traffic.

---

## Related

- [Environment Variables](../development/environment-variables.md) — how to use `event.args` for secrets and configuration.
- [Function Instance](../platform-integration/what-is-a-function-instance.md) — detailed explanation of function instances.
- [Linking Instances to Rules](../platform-integration/linking-instances-to-rules.md) — how to activate a function for specific requests.
