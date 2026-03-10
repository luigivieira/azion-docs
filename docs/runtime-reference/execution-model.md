---
title: Execution Model
sidebar_position: 4
description: How Azion Edge Functions are executed on the edge network.
---

# Execution Model

Understanding how the runtime executes your function helps you write code that is efficient, predictable, and free of common pitfalls around concurrency, state, and timing.

---

## 1. Request-Driven Execution

Edge Functions are not long-running servers. They execute **on demand**, once per matched request, and are expected to return a response within a bounded time budget.

The lifecycle of a single invocation is:

1. A request arrives at an Azion edge node.
2. The Rules Engine evaluates criteria and determines that a Function Instance should run.
3. The runtime dispatches a `fetch` (or `firewall`) event to your listener.
4. Your handler runs and calls `event.respondWith(...)`.
5. The response is returned to the client.
6. Any tasks scheduled via `event.waitUntil(...)` continue to run until they complete or the time budget is exhausted.

---

## 2. Concurrency

The Azion Runtime handles concurrent requests using **V8 isolates** — lightweight execution contexts that are isolated from each other. A single edge node can run many isolates simultaneously, but each isolate handles **one event at a time**.

Within your function code, concurrency is cooperative and based on JavaScript's single-threaded async model:

- `await` yields control to the event loop, allowing other microtasks to proceed.
- Multiple `fetch()` calls can run concurrently using `Promise.all()`.
- There are no threads, worker threads, or shared memory between invocations.

```js
// Concurrent subrequests — both fetch calls start simultaneously
const [usersRes, statsRes] = await Promise.all([
  fetch("https://api.example.com/users"),
  fetch("https://api.example.com/stats"),
]);
```

---

## 3. Cold Starts and Warm Isolates

When a function is invoked at an edge node for the first time, the runtime must initialize a new isolate, compile the function code, and execute any module-level setup code. This is called a **cold start**.

After the first invocation, the runtime may **reuse the same isolate** for subsequent requests. This is a warm execution — there is no initialization overhead, and module-level variables retain their values from the previous invocation.

Practical consequences:

- **Module-level initialization runs once**, not on every request. Use this for work that is expensive to repeat — parsing configuration, building lookup tables, etc.
- **Module-level mutable state persists across requests** within the same warm isolate. Avoid storing per-request data in global variables.
- **Cold start latency** is proportional to the size and complexity of your code. Keep your function small and avoid large initialization routines.

```js
// This runs once per isolate lifetime, not per request
const config = JSON.parse(JSON.stringify(hardcodedDefaults));

addEventListener("fetch", event => {
  // This runs once per request
  event.respondWith(handle(event.request, event.args, config));
});
```

---

## 4. Async Execution and the Event Loop

Edge Functions use a standard JavaScript event loop. Asynchronous operations — `fetch()`, `crypto.subtle`, timers — are non-blocking. The runtime schedules them and resumes your handler when results are ready.

The function handler itself can be `async`, and `event.respondWith()` can receive a `Promise<Response>`:

```js
const handleRequest = async (request, args) => {
  const data = await fetch("https://api.example.com/resource").then(r => r.json());
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

`event.respondWith()` must be called **synchronously** in the event handler — it cannot be called after an `await`. The pattern above works because you pass a `Promise`, not because `respondWith` is called after awaiting.

---

## 5. Background Tasks

`event.waitUntil(promise)` extends the function's execution lifetime to allow background work to complete after the response has been sent. The runtime will not terminate the isolate until all `waitUntil` promises have settled (or the execution time limit is reached).

```js
addEventListener("fetch", event => {
  const response = handleRequest(event.request, event.args);

  // This runs after the response is delivered
  event.waitUntil(
    fetch("https://analytics.example.com/collect", {
      method: "POST",
      body: JSON.stringify({ url: event.request.url, ts: Date.now() }),
    })
  );

  event.respondWith(response);
});
```

Background tasks consume time from the function's overall execution budget. If a background task takes too long, it is terminated by the runtime.

---

## 6. Error Handling

If your function throws an unhandled exception, the runtime catches it and returns an HTTP `500` response to the client. The error details are captured and appear in **Real-Time Events** under the **Functions Console** data source with a `LINE_SOURCE` of `RUNTIME`.

Best practice is to wrap your handler logic in a try/catch and return a meaningful error response:

```js
const handleRequest = async (request, args) => {
  try {
    const res = await fetch(`${args.API_BASE}/resource`);

    if (!res.ok) throw new Error(`Upstream error: ${res.status}`);

    return new Response(await res.text());
  } catch (err) {
    console.error("Handler error:", err.message);
    return new Response("Internal Server Error", { status: 500 });
  }
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event.args));
});
```

---

## 7. Execution Time

Each function invocation has a **CPU time budget** — the amount of actual computation time the function is allowed to consume. Time spent waiting for `fetch()` responses, timers, or other I/O does not count against the CPU budget, but the total **wall-clock time** (elapsed time from invocation start to response) is also bounded.

If your function exceeds its time limits:

- The invocation is terminated.
- The client receives an error response.
- The termination is logged and visible in Real-Time Events.

See [Limits](../limits.md) for the specific time budgets that apply to your plan.

---

## Related

- [Runtime Environment](./runtime-environment.md) — isolate model, globals, and state.
- [Limits](../limits.md) — CPU time, memory, and subrequest limits.
- [Performance Optimization](../advanced/performance-optimization.md) — techniques to reduce cold start time and execution overhead.
