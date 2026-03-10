---
title: Create an Application
sidebar_position: 3
description: Create an Edge Application and instantiate your function.
---

# Create an Application

An **Edge Application** is the container that runs at the edge and determines how incoming requests are handled. In this step, you'll create one, instantiate your function inside it, and configure the rules that define when and how the function runs.

<video width="100%" controls style={{borderRadius: '8px'}}>
  <source src="https://github.com/luigivieira/azion-docs/releases/download/media-v1/Creating.the.application.mp4" type="video/mp4" />
</video>

## Steps

### 1. Open Edge Applications

In **Azion Console**, go to **Build** → **Edge Applications** in the left sidebar.

### 2. Create a new application

Click **Add Application**. Name it `PokemonOfTheDay - Application`.

:::info Edge Functions must be enabled
On the application settings page, make sure the **Edge Functions** module is enabled. This allows the application to execute functions in response to requests.
:::

### 3. Create a Function Instance

Before the application can run your function, you need to create an **instance** — a reference that binds the function to this specific application.

Go to the **Functions** tab inside your application and click **Add Function**. Name the instance `PokemonOfTheDay - Function - Instance` and select `PokemonOfTheDay - Function` from the function list.

:::note What is a Function Instance?
A Function Instance is not the function itself — it's a pointer to it within the context of an application. This allows the same function to be reused across multiple applications with different configurations.
:::

### 4. Create the Request Rule

Go to the **Rules Engine** tab and create a new rule for the **Request Phase**. Name it `PokemonOfTheDay - Rule - Request`.

Configure it as follows:

- **Criteria**: `If Request URI` → `starts with` → `/pokemon-of-the-day`
- **Behavior**: `Run Function` → select `PokemonOfTheDay - Function - Instance`

Save the rule.

This rule tells the application: whenever a request comes in for `/pokemon-of-the-day`, run the function.

### 5. Create the Response Rule

Still in **Rules Engine**, create a second rule for the **Response Phase**. Name it `PokemonOfTheDay - Response`.

Configure it as follows:

- **Criteria**: same path — `If Request URI` → `starts with` → `/pokemon-of-the-day`
- **Behavior**: `Enable Gzip`

Save the rule.

:::tip Why Gzip?
Enabling Gzip compression on the response phase reduces the size of the HTML payload delivered to the browser, improving load time — especially useful for responses that include repeated markup patterns.
:::

### 6. Save the application

All changes in Rules Engine are saved per-rule. Make sure both rules are saved before moving on.

## Next step

The application is configured but not yet reachable from the internet. Proceed to [Create a Workload](./create-workload) to expose it.
