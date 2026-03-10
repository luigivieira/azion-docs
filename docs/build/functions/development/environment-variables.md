---
title: Environment Variables
sidebar_position: 3
description: Using environment variables in Azion Edge Functions.
---

# Environment Variables

Environment variables let you inject configuration and secrets into your Edge Functions without hardcoding values in the source code. This is the standard pattern for separating code from configuration and for keeping sensitive values — like API keys or database credentials — out of your repository.

---

## 1. How Variables Are Stored

Azion stores environment variables at the **Edge Application** level, inside a **Function Instance**. Values you enter are encrypted at rest. When the runtime initializes your function, it makes those values available via the `Azion.env` API.

:::info Not the same as `process.env`
The Azion Runtime does not have a `process` global (that is a Node.js concept). To read environment variables, use `Azion.env.get()` instead.
:::

---

## 2. Setting Variables in the Console

1. Open **Azion Console** → **Build** → **Edge Applications** and select your application.
2. Go to the **Functions** tab and open the Function Instance you want to configure.
3. In the **Arguments** tab, add your key-value pairs as JSON — or use the **Environment Variables** section if your plan includes it.

For function-level configuration (the `event.args` object), add key-value pairs directly in the JSON editor of the **Arguments** tab:

```json
{
  "API_KEY": "sk-your-key-here",
  "ORIGIN_URL": "https://api.example.com",
  "CACHE_TTL": 300
}
```

These values become available at runtime as `event.args`.

---

## 3. Reading Variables at Runtime

### Via `event.args` (Recommended for Function-Specific Config)

The most common approach is to pass configuration through the **Arguments** tab of the Function Instance. This makes each instance independently configurable.

```js
const handleRequest = async (request, args) => {
  const apiKey     = args.API_KEY;
  const originUrl  = args.ORIGIN_URL ?? "https://api.example.com";
  const cacheTtl   = args.CACHE_TTL ?? 60;

  const res = await fetch(`${originUrl}/data`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${cacheTtl}`,
    },
  });
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

### Via `Azion.env.get()` (Application-Level Variables)

For variables shared across multiple function instances (or set outside of the Arguments JSON), Azion provides a global `Azion.env` object:

```js
addEventListener("fetch", event => {
  const apiKey = Azion.env.get("MY_API_KEY");

  if (!apiKey) {
    event.respondWith(new Response("Configuration error", { status: 500 }));
    return;
  }

  event.respondWith(new Response(`Key starts with: ${apiKey.slice(0, 4)}...`));
});
```

`Azion.env.get(name)` returns the value as a string, or `undefined` if the variable is not set.

---

## 4. Providing Defaults and Validating at Startup

Always provide sensible defaults and validate required variables early. A function that fails with a clear error is much easier to debug than one that silently returns wrong data.

```js
const getConfig = (args) => {
  const required = ["API_KEY", "ORIGIN_URL"];

  for (const key of required) {
    if (!args[key]) {
      throw new Error(`Missing required configuration: ${key}`);
    }
  }

  return {
    apiKey:   args.API_KEY,
    origin:   args.ORIGIN_URL,
    cacheTtl: Number(args.CACHE_TTL ?? 60),
    debug:    args.DEBUG === "true",
  };
};

const handleRequest = async (request, args) => {
  let config;

  try {
    config = getConfig(args);
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }

  if (config.debug) {
    console.log("Config loaded:", { origin: config.origin, cacheTtl: config.cacheTtl });
  }

  const res = await fetch(`${config.origin}/data`, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
  });

  return res;
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

---

## 5. Secrets and Security Best Practices

- **Never log secret values**. Use `console.log` only for non-sensitive metadata (URLs without credentials, status codes, etc.).
- **Never put secrets in source code**. Store them in the Arguments JSON or application-level environment variables only.
- **Rotate keys regularly**. When you update the Arguments JSON of a Function Instance, the new value takes effect on the next request — no redeployment required.
- **Use different instances for different environments**. Create separate Function Instances for staging and production, each with their own set of keys. This avoids accidental cross-environment data leaks.

---

## 6. Type Coercion

All values you enter in the Arguments JSON are typed as-is (strings remain strings, numbers remain numbers). Values read from `Azion.env.get()` are always strings. Remember to coerce types explicitly when needed:

```js
const args = event.args;

const timeout = Number(args.TIMEOUT_MS ?? "5000");   // string → number
const debug   = args.DEBUG === "true";                // string → boolean
const items   = JSON.parse(args.ALLOWED_IPS ?? "[]"); // string → array
```
