---
title: Creating Instances
sidebar_position: 3
description: How to create a Function Instance within an Edge Application or Edge Firewall.
---

# Creating Instances

A Function Instance binds an Edge Function to a specific Edge Application or Edge Firewall. You must create an instance before the Rules Engine can invoke your function.

---

## Prerequisites

Before creating an instance:

- You must have an Edge Function saved in your account. See [Create Your First Function](../getting-started/create-function.md).
- The target Edge Application must have the **Edge Functions** module enabled. You can enable it in the **Main Settings** tab of the application.

:::info Edge Functions module
Without the Edge Functions module enabled, the **Functions** tab does not appear in the application and you cannot create instances. The module must be explicitly turned on for each application that needs it.
:::

---

## Steps

### 1. Open the Edge Application

In **Azion Console**, go to **Build** → **Edge Applications** and open the application where you want to add the instance.

### 2. Go to the Functions tab

Select the **Functions** tab. This lists all existing instances for the application.

### 3. Add a new instance

Click **Add Function**. A form will appear with the following fields:

- **Name**: A descriptive label for this instance (e.g., `AuthFunction - Production`). Choose a name that makes it easy to identify the instance in the Rules Engine.
- **Edge Function**: The function to bind. Select from the list of functions saved in your account.

### 4. Configure Arguments (optional)

After selecting a function, the **Arguments** tab becomes available. Here you can provide a JSON object with configuration values your function will read from `event.args`.

For example:

```json
{
  "redirectTo": "https://login.example.com",
  "tokenHeader": "x-auth-token"
}
```

Leave the Arguments empty if your function does not use `event.args`, or if it defines its own defaults.

### 5. Save the instance

Click **Save**. The instance now appears in the Functions tab and is available to be referenced in the Rules Engine.

---

## Multiple instances from one function

You can create more than one instance from the same function within the same application — each with different Arguments. This is useful when you need the same logic to behave differently depending on the path or context.

For example, a rate-limiting function could have:

- **Instance A** — `{ "limit": 100 }` for the `/api/public` path.
- **Instance B** — `{ "limit": 10 }` for the `/api/admin` path.

Each instance would then be referenced by a different rule in the Rules Engine.

---

## Next step

With the instance created, configure the Rules Engine to invoke it. See [Linking Instances to Rules](./linking-instances-to-rules.md).
