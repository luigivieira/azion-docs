---
title: Create a Workload
sidebar_position: 4
description: Create a Workload to expose your Edge Application via a public domain.
---

# Create a Workload

A **Workload** binds your Edge Application to a domain, making it accessible on the internet. Without this step, the application exists but has no public address to receive traffic.

<video width="100%" controls style={{borderRadius: '8px'}}>
  <source src="https://github.com/luigivieira/azion-docs/releases/download/media-v1/Creating.the.workload.mp4" type="video/mp4" />
</video>

## Steps

### 1. Open Workloads

In **Azion Console**, go to **Deliver** → **Workloads** in the left sidebar.

### 2. Create a new workload

Click **Add Workload**. Give it a name — for example, `pokemon-workload`.

### 3. Link to your application

In the **Edge Application** field, select the application you created in the previous step (`pokemon-app`).

### 4. Review the domain

Azion automatically assigns an `azionedge.net` subdomain to your workload. You'll use this domain to access your function once it's deployed.

Take note of the domain shown — you'll need it in the next step.

:::tip Custom domains
For this guide, the automatically assigned domain is enough. When you're ready for production, you can configure a custom domain through the **Domains** section in the Console.
:::

### 5. Save the workload

Click **Save**. Azion will start propagating the configuration to edge nodes worldwide.

:::info Propagation time
It may take a few minutes for the workload to become fully active across the network. During this time, requests to the domain may return a `404` or timeout — this is expected.
:::

## Next step

Once propagation is complete, proceed to [Test and Observe](./test-and-observe) to access your function and check its logs.
