---
title: Métricas
sidebar_position: 3
description: Métricas disponibles para Azion Edge Functions.
---

# Métricas

Las métricas le ofrecen una visión agregada del rendimiento de sus Edge Functions a lo largo del tiempo. Mientras que los logs le indican qué ocurrió en una invocación específica, las métricas responden a preguntas de nivel superior: ¿Cuántas solicitudes está manejando mi función? ¿Las invocaciones provienen de aplicaciones o de firewalls?

---

## 1. Métricas en Tiempo Real

**Real-Time Metrics** proporciona visualización basada en gráficos de datos agregados para sus funciones. Los datos se obtienen a través de la API GraphQL de Azion y se muestran casi en tiempo real, con un retraso máximo de agregación de **10 minutos**. Los datos históricos se conservan durante **2 años**.

Para acceder a las métricas de las funciones:

1. Vaya a **Azion Console** → **Observe** → **Real-Time Metrics**.
2. Seleccione la pestaña **Build**.
3. Haga clic en **Functions**.

### Gráficos disponibles

| Gráfico                      | Descripción                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------- |
| **Total Invocations**        | Suma de todas las ejecuciones de funciones en el rango de tiempo seleccionado |
| **Firewall Invocations**     | Invocaciones de funciones vinculadas a un Edge Firewall                       |
| **Applications Invocations** | Invocaciones de funciones vinculadas a una Edge Application                   |

_Total Invocations_ es la suma de _Firewall Invocations_ y _Applications Invocations_.

### Opciones de rango de tiempo

Puede filtrar por: última hora, últimas 24 horas, últimos 7 días, últimos 30 días, últimos 6 meses o un rango personalizado de fecha/hora. La vista de la **Última Hora** se actualiza automáticamente cada minuto.

:::info Métricas frente a facturación
Real-Time Metrics utiliza un enfoque de "como máximo una vez" optimizado para el rendimiento, mientras que la facturación utiliza un modelo de "exactamente una vez". La diferencia media es inferior al 1%. Los datos de facturación son los autoritativos a efectos de costes.
:::

---

## 2. Consulta de Métricas con la API GraphQL

Real-Time Metrics utiliza internamente la **API GraphQL de Azion**. Puede consultar los mismos datos mediante programación para crear cuadros de mando personalizados, alimentar pipelines de alerta o integrar métricas en herramientas externas.

Desde cualquier gráfico en Real-Time Metrics, abra el menú contextual y seleccione **Copy Query** para obtener la consulta GraphQL exacta que genera ese gráfico.

El endpoint de la API GraphQL es:

```
https://api.azionapi.net/metrics/graphql
```

Incluya su token personal en la cabecera `Authorization`.

---

## 3. Correlación de Métricas con Logs

Las métricas y los logs son complementarios:

- **Las métricas** le indican _cuántas_ invocaciones ocurrieron y de _dónde_ vinieron (aplicación frente a firewall).
- **Los logs** le indican _qué ocurrió_ en cada invocación.

Un flujo de trabajo típico al investigar una anomalía:

1. Observa un pico en las invocaciones en Real-Time Metrics.
2. Reduce el rango de tiempo a la ventana del pico.
3. Cambia a **Real-Time Events** → fuente de datos **Functions** para ver los metadatos de la invocación (IDs de instancia, tiempo de ejecución, tipo de iniciador) para esa ventana.
4. Cambia a **Real-Time Events** → **Functions Console** para inspeccionar la salida de `console.log()` y los errores de esa misma ventana.

---

## 4. Identificación del Upstream en los Logs de la Aplicación

Cuando se invoca una función desde una Edge Application, la fuente de datos **HTTP Requests** en Real-Time Events registra el upstream como:

```
Upstream Addr = 127.0.0.1:1666
```

Este valor (`127.0.0.1:1666`) es la dirección del **Azion Cells Runtime** — el entorno de ejecución de las Edge Functions. Puede usarlo para filtrar los logs a nivel de aplicación e aislar solo las solicitudes que activaron una función.

---

## 5. Uso del Plugin de Grafana

Para los equipos que prefieren un stack de observabilidad local, Azion proporciona un **plugin de Grafana** que se conecta a la misma API GraphQL utilizada por Real-Time Metrics. Con él, puede:

- Crear dashboards personalizados combinando las invocaciones de funciones con otras métricas de Azion (WAF, DNS, Cache).
- Definir reglas de alerta basadas en umbrales de invocación.
- Compartir dashboards con su equipo.

Consulte la documentación de Azion para las instrucciones de instalación y configuración.

---

## Relacionado

- [Logs](./logs.md) — detalle por invocación y salida de `console.log()` a través de Real-Time Events y Data Stream.
- [Depuración](./debugging.md) — técnicas para diagnosticar errores específicos.
- [Optimización del Rendimiento](../advanced/performance-optimization.md) — estrategias para reducir el tiempo de computación y el uso de recursos.
