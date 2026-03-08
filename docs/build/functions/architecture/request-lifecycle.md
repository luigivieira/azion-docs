---
title: Request Lifecycle
sidebar_position: 3
description: The lifecycle of a request through the Azion platform and Functions.
---

# Request Lifecycle

A request to an Azion application passes through the following stages:

1. **Client Request** — The user's browser or client sends an HTTP request.
2. **Edge Node** — The request is received at the nearest Azion edge node.
3. **Application** — The request is matched to an Edge Application.
4. **Rules Engine** — The Rules Engine evaluates conditions and applies behaviors.
5. **Function Instance** — If a Function behavior is triggered, a Function Instance is invoked.
6. **Function Execution** — The Edge Function executes its logic.
7. **Origin / Storage / Response** — The function returns a response, proxies to origin, or fetches from Edge Storage.

This page is a placeholder and will be expanded with detailed documentation.
