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

Click **Add Workload**. Name it `PokemonOfTheDay`.

### 3. Link to your application

In the **Edge Application** field, select `PokemonOfTheDay - Application`.

### 4. Configure the domain

For this guide, select **Azion domain** as the domain type and use `potd` as the subdomain prefix. Azion will assign `potd.azion.app` as the public address for your workload.

### 5. Save the workload

Click **Save**. Azion will start propagating the configuration to edge nodes worldwide.

In addition to your custom domain (`potd.azion.app`), Azion automatically assigns a **workload domain** in the format `<hash>.map.azionedge.net` (for example, `qzlboudy4am.map.azionedge.net`). This address is shown on the workload detail page and tends to become available sooner than the custom domain — useful for a quick sanity check while propagation is still in progress.

:::info Propagation time
The first time a workload is created, propagation takes a few minutes as the configuration is distributed to edge nodes worldwide. Subsequent updates to the same workload and application propagate significantly faster.

During the initial propagation, requests may return a `404` or timeout — this is expected.
:::

## Next step

Once propagation is complete, proceed to [Test and Observe](./test-and-observe) to access your function and check its logs.
