---
title: Create an Application
sidebar_position: 3
description: Create an Edge Application and instantiate your function.
---

# Create an Application

An **Edge Application** is the container that runs at the edge and determines how incoming requests are handled. In this step, you'll create one and attach the function you wrote in the previous step.

<video width="100%" controls style={{borderRadius: '8px'}}>
  <source src="https://github.com/luigivieira/azion-docs/releases/download/media-v1/Creating.the.application.mp4" type="video/mp4" />
</video>

## Steps

### 1. Open Edge Applications

In **Azion Console**, go to **Build** → **Edge Applications** in the left sidebar.

### 2. Create a new application

Click **Add Application**. Give it a name — for example, `pokemon-app`.

:::info Edge Functions must be enabled
On the application settings page, make sure the **Edge Functions** module is enabled. This allows the application to execute functions in response to requests.
:::

### 3. Add a Rule to invoke the function

Go to the **Rules Engine** tab inside your application. You'll use a rule to tell the application when to run your function.

1. Under **Default Rule**, click to edit it or create a new rule for the **Request Phase**.
2. Set the criteria to match all requests (the default `If Request URI starts with /` works for this guide).
3. In the **Behavior** section, select **Run Function**.
4. Choose the function you created (`pokemon-function`) from the list.
5. Save the rule.

:::note Why Rules Engine?
Rules Engine is what connects your application to its behaviors. A function only runs when a rule triggers it — this gives you control to run different functions for different paths, methods, or conditions.
:::

### 4. Save the application

Click **Save** to apply your changes. The application is now configured to run your function on every incoming request.

## Next step

The application is set up, but it's not yet reachable from the internet. Proceed to [Create a Workload](./create-workload) to expose it.
