---
title: Ciclo de Vida de la Solicitud
sidebar_position: 3
description: El ciclo de vida de una solicitud en la plataforma Azion y en las Functions.
---

# Ciclo de Vida de la Solicitud

Una solicitud a una aplicación Azion pasa por las siguientes etapas:

1. **Solicitud del Cliente** — El navegador o cliente del usuario envía una solicitud HTTP.
2. **Edge Node** — La solicitud es recibida en el edge node más cercano de Azion.
3. **Aplicación** — La solicitud se asocia a una Edge Application.
4. **Rules Engine** — El Rules Engine evalúa condiciones y aplica comportamientos.
5. **Function Instance** — Si se activa un comportamiento de Function, se invoca una Function Instance.
6. **Ejecución de la Function** — La Edge Function ejecuta su lógica.
7. **Origen / Storage / Respuesta** — La función devuelve una respuesta, hace proxy al origen o obtiene datos del Edge Storage.

Esta página es un marcador de posición y se ampliará con documentación detallada.
