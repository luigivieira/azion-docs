---
title: Function Arguments and Environment Variables
sidebar_label: Arguments and Variables
sidebar_position: 3
description: Using function arguments and environment variables in Azion Edge Functions.
---

# Function Arguments and Environment Variables

Azion provides two distinct ways to handle configuration and sensitive data in your Edge Functions: **Function Arguments** and **Environment Variables**. Understanding the difference between them is key to building reusable and secure applications.

---

## 1. Function Arguments (JSON Args)

Function arguments are local configuration values passed to a function at runtime. They are used to make functions reusable by allowing different instances of the same function to behave differently based on the provided JSON.

### How They Work

- **Scope**: Local to the function and its instances.
- **Storage**: Defined in the **Arguments** tab of the **Function Instance** in the Azion Console.
- **Template Values**: You can also define default arguments at the **Function** definition level. These serve as base values for any instance created from that function. If an instance defines its own arguments, they will be used for that specific execution.
- **Access**: Available via the `event.args` object.

### Setting Arguments in the Console

1. Open **Azion Console** → **Build** → **Edge Applications** and select your application.
2. Go to the **Functions** tab and open the Function Instance you want to configure.
3. In the **Arguments** tab, add your key-value pairs as JSON:

```json
{
  "API_URL": "https://api.example.com",
  "DEBUG_MODE": true,
  "TIMEOUT": 5000
}
```

### Reading Arguments at Runtime

Use `event.args` to access the values:

```js
addEventListener("fetch", event => {
  const { API_URL, DEBUG_MODE } = event.args;
  
  if (DEBUG_MODE) {
    console.log(`Fetching from: ${API_URL}`);
  }
  
  event.respondWith(fetch(API_URL));
});
```

---

## 2. Environment Variables

Environment variables are global configuration settings or secrets (like API keys or database credentials) that are shared across your account or specific applications. They are better suited for sensitive information that shouldn't be part of the function's JSON arguments.

### How They Work

- **Scope**: Account-level (available to all edge applications in your account).
- **Storage**: Defined in the **Build** → **Variables** section of the Azion Console ([console.azion.com/variables](https://console.azion.com/variables)).
- **Security**: You can use the **Secret** toggle to encrypt the value. Once a variable is saved as a secret, its behavior cannot be edited.
- **Access**: Available via the `Azion.env` API.

### Setting Variables in the Console

1. Open **Azion Console** → **Build** → **Variables**.
2. Add your key-value pairs. Enable the **Secret** toggle for sensitive values to ensure they are encrypted and stay hidden.

### Reading Variables at Runtime

Use `Azion.env.get()` to retrieve the value as a string:

```js
addEventListener("fetch", event => {
  const apiKey = Azion.env.get("MY_SECRET_API_KEY");

  if (!apiKey) {
    event.respondWith(new Response("Missing API Key", { status: 500 }));
    return;
  }

  // Use the apiKey in your logic
});
```

:::info Not the same as `process.env`
The Azion Runtime does not have a `process` global. Always use `Azion.env.get(name)` to read environment variables.
:::

---

## 3. Comparison and Best Practices

| Feature | Function Arguments | Environment Variables |
|---|---|---|
| **Best For** | Instance-specific config (URLs, flags) | Account-wide secrets (API keys, IDs) |
| **Format** | JSON Object | Key-Value Pairs (String) |
| **Runtime Access** | `event.args` | `Azion.env.get()` |
| **Location** | Function Instance / Function | Console > Variables |

### Best Practices

- **Separation of Concerns**: Use Arguments for values that change per deployment/instance. Use Environment Variables for sensitive secrets and global configuration.
- **Provide Defaults**: Always handle missing values in your code to prevent runtime errors.
- **Type Coercion**: Values from `Azion.env.get()` are always strings. Values in JSON Args retain their JSON types (number, boolean, etc.).
- **Validation**: Validate required configuration at the start of your function to fail early with a clear message.

```js
const args = event.args;
const timeout = Number(args.TIMEOUT ?? 5000); // Coerce if necessary
const dbUrl = Azion.env.get("DATABASE_URL");

if (!dbUrl) throw new Error("DATABASE_URL variable is required");
```

