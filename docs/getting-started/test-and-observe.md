---
title: Test and Observe
sidebar_position: 5
description: Access your deployed function via its domain and observe execution logs.
---

# Test and Observe

With the workload created and propagated, your function is live. In this final step, you'll access it via the browser and check the real-time logs to confirm it's running correctly.

## Access your domain

Open a browser and navigate to `potd.azion.app/pokemon-of-the-day`. You should see a page with a Pokémon's sprite, name, and type — fetched live from the PokéAPI at the edge.

<video width="100%" controls style={{borderRadius: '8px'}}>
  <source src="https://github.com/luigivieira/azion-docs/releases/download/media-v1/Acessing.the.domain.mp4" type="video/mp4" />
</video>

Refresh the page a few times — each request picks a random Pokémon, so you should see a different one each time.

:::tip Not loading yet?
If the page returns a `404` or doesn't load, wait a couple of minutes for propagation to complete and try again.
:::

## Check the logs

Azion provides real-time execution logs for your functions. This is useful to confirm your function is being invoked, inspect its behavior, and debug issues.

<video width="100%" controls style={{borderRadius: '8px'}}>
  <source src="https://github.com/luigivieira/azion-docs/releases/download/media-v1/Seeing.the.logs.in.the.function.mp4" type="video/mp4" />
</video>

To view logs:

1. In **Azion Console**, go to **Observe** → **Real-Time Logs** (or navigate to your function's detail page and open the **Logs** tab, depending on your Console version).
2. Trigger a new request by refreshing your domain in the browser.
3. Watch the log entries appear in real time.

:::info What you'll see in the logs
Each invocation generates a log entry with details about the request — including timestamp, status, and any output from your function. If your function throws an error, the stack trace will appear here.
:::

## What you accomplished

You've completed the full Getting Started flow for Azion Edge Functions:

| Step | What you did |
|------|-------------|
| **Prerequisites** | Set up your Azion account |
| **Create a Function** | Wrote a function that fetches and renders Pokémon data |
| **Create an Application** | Created an Edge Application and configured it to run your function |
| **Create a Workload** | Exposed the application via a public domain |
| **Test and Observe** | Accessed the live function and inspected its logs |

## Where to go next

- **[Platform Architecture](../platform-integration/functions-in-platform-architecture)** — understand how Edge Functions fit into the broader Azion architecture.
- **[Execution Model](../runtime-reference/execution-model)** — learn how functions are initialized, executed, and terminated.
- **[Runtime APIs](../runtime-reference/runtime-apis)** — explore the APIs available inside the function runtime.
