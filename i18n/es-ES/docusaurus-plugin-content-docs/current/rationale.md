import useBaseUrl from '@docusaurus/useBaseUrl';

# Justificación: Rediseño de la Documentación de Azion Functions

:::info Una Nota sobre la Autenticidad y la Asistencia de IA
Para garantizar la total transparencia con respecto a mi proceso de pensamiento y decisiones estratégicas, proporciono el <a target="_blank" href={useBaseUrl('/rationale-draft.pdf')}><strong>borrador original sin editar de esta justificación (PDF)</strong></a>. 

También proporciono una <a target="_blank" href={useBaseUrl('/interaction-example.pdf')}><strong>exportación del registro de interacción con la IA (PDF)</strong></a> para demostrar cómo programamos activamente en pareja y refinamos la documentación juntos.

Aunque aprovecho ampliamente la IA en mi flujo de trabajo como un acelerador - para formatear textos, generar código repetitivo y crear diagramas - la arquitectura central, las decisiones estructurales y el borrador original de esta justificación son enteramente míos. La IA ayudó a organizar este documento final, pero el humano sigue siendo el conductor.
:::

Bienvenido a la justificación detrás de la documentación propuesta para **Azion Functions**. Esta página detalla mi proceso de toma de decisiones para rediseñar el flujo de inducción, las mejoras arquitectónicas en la UX/UI de la documentación, las compensaciones técnicas de los ejemplos de código elegidos y una visión para el futuro de la experiencia del desarrollador en Azion.

:::tip Sobre "Experiencia del Desarrollador" vs. "Documentación"
Aunque este desafío se centra en rediseñar la **Documentación** y mejorar el flujo de inducción, la verdadera Experiencia del Desarrollador (DevEx) abarca mucho más - desde la ergonomía del SDK hasta la interfaz de la Consola y los tiempos de ejecución de la CLI. Mi enfoque aquí es ampliar los límites de lo que puede hacer la documentación, sabiendo que una transformación holística de la DevEx requiere una colaboración continua y estrecha con los equipos de Ingeniería y Producto para alinear las capacidades de la plataforma con las expectativas de los desarrolladores.
:::

---

## 1. Arquitectura de la Información y La Nueva Narrativa

La documentación actual intenta mapearse al modelo organizativo de Azion utilizado en su consola (Build, Secure, Store, Deploy, Observe). Sin embargo, esta organización no es ideal para el aprendizaje, especialmente para principiantes. El rediseño cambia el enfoque para hacer de la **Función** (Function) la entidad principal de la que fluye todo lo demás.

### El Enfoque "La Función es la Estrella"
El recorrido del desarrollador debe comenzar con lo que hace que ocurra la magia: escribir código. La nueva estructura introduce conceptos progresivamente basados en esta premisa:
1. **Descripción General:** ¿Qué son las Edge Functions y qué hacen?
2. **Primeros Pasos:** Pequeñas victorias rápidas. Aprender los requisitos previos, escribir la función, configurar la aplicación y probarla en minutos. (También se incluyen tutoriales breves en video para facilitar el proceso desde el registro de la cuenta hasta el primer despliegue).
3. **Desarrollo:** La referencia central. Guías detalladas sobre la estructura de la función, variables de entorno, enrutamiento y solicitudes.
4. **Integración con la Plataforma:** Uniendo todo al introducir instancias, reglas, aplicaciones y cargas de trabajo *en ese orden*, demostrando cómo se basan en la función y la reutilizan.

### Consolidación de "Límites" y "Referencia de API"
Actualmente, los límites de la plataforma aparecen de manera redundante en varias páginas, dificultando a menudo la navegación. Ya que son cruciales, lo ideal es que vivan directamente dentro de la interfaz de la consola. En cuanto a la documentación, deben pertenecer a una página única en la raíz. Del mismo modo, la **Referencia de API** es vital pero no debería interrumpir el camino de aprendizaje principal; se ha reubicado en su propia sección en el menú principal.

### Temas Avanzados y Observabilidad
Los temas como integraciones de Sentry/Grafana, WebAssembly o AI Inference están asilados intencionalmente en las secciones de "Temas Avanzados" y "Observabilidad". Son inmersiones profundas para usuarios que ya entienden los conceptos básicos, manteniendo así una curva de aprendizaje sencilla.

---

## 2. Mejoras de Usabilidad y UX de la Documentación

Le dediqué una gran parte de mi esfuerzo a refinar la experiencia de lectura. La documentación actual sufre de saltos abruptos de contexto y navegación oculta. Implementé varias mejoras de interfaz de usuario y experiencia (UI/UX):

### Navegación Inteligente y Contexto de la Barra Lateral
- **Corrección de Enlaces Internos:** Aseguré que todos los enlaces internos se mantengan en la misma pestaña preservando el historial de navegación. Solamente los enlaces externos abren ventanas nuevas.
- **Barra Lateral Contextual:** La barra lateral (sidebar) es la máxima ancla. Utiliza un tinte anaranjado sutil y marcadores de alto contraste para las jerarquías.
- **Paginación Prominente:** Los botones de "Anterior" y "Siguiente" se han movido a la parte superior de las páginas para mayor visibilidad intuitiva.

### Migas de Pan (Breadcrumbs)
- Implementé el truncamiento de texto (con puntos suspensivos `...`) para los nodos intermedios de páginas profundas para que ajusten correctamente en pantallas de dispositivos móviles.
- Si el usuario los toca, se expanden para mostrar toda la jerarquía de lectura en líneas múltiples.

### Atajos de Teclado
Para usuarios en estaciones de desarrollo:
- **`CMD/CTRL` + `Flecha Izquierda/Derecha`:** Navega al instante hacia la página anterior o la siguiente, resaltado contextualmente con un ícono estético de teclado cerca de los encabezados de página.
- **`CMD/CTRL` + `K`:** Activa sin demoras la barra global de búsqueda universal.

### Glosario y Cuadros Explicativos
- **Glosario Automático:** Sabemos que las siglas generan miedos al aprendizaje. Estructure la creación automatizada de un glosario con significados técnicos y ligas cruzadas.
- **Diagramas Generados IA:** Complemente esquemas y modelos por IA para el recorrido arquitectónico general e interacciones estructurales sobre el proyecto de base.

---

## 3. El Proyecto de Referencia: Augmented Open5e

Para validar la reescritura de los documentos construí el proyecto **[Augmented Open5e](https://github.com/luigivieira/augmentedopen5e)** - un experimento aplicable Open-Source de funcionalidad Serverless integral ejecutando codificaciones Edge Functions con uso de Reglas tipo D&D cruzadas a un uso intenso con procesamiento LLM. Logrando así probar el límite de su arquitectura nativa: Usos profundos referenciando el Storage "Key-Values / KV" y la espera funcional para resoluciones de API y funciones sin bloquear con `waitUntil` limitándose de manera aislada solamente sobre imposibilidades técnicas frente al "AI Inference". Aproveché esos fallos nativos limitantes del motor base para invitar fuertemente en este raciocinio al ecosistema de directrices del Azion Panel (Error Logs / Developers Logs Analytics) informando por consiguiente que es imperativo ser más precisos con los dev teams frente a los Errores Técnicos y no culpar vagas "Permisologías Limitadas" si un Modelo Local nativo por API llega a fallar. Igualmente iteré el diseño, en especial para manejar correctamente las indicaciones visuales (loaders de procesos) de carga en base al retorno de `202 Accepted` garantizando una correcta gestión del usuario previniendo percepciones irreales visuales (falsos errores del Loader de proceso Background `WaitUntil`).

### API Edge Monolítica VS Funciones Miniaturizadas (Micro-Funcs)
Opté el estructuramiento de código aplicando el concepto único Macro Central. En un Arquitectura general por "Monolito HTTP API o Single Endpoint" logrando un simple flujo manejado al núcleo interno del Engine y Rules.
* **Prós:** Inversiones exclusivas hacia a una labor principal simplificada - Una sola compilación Deploy/Auth. Logros vitales erradicando drásticamente perdidas asíncronas o Demoras de "Cold-Starts" - pues la consulta central única de `/api/1` acelera e inicializa (precalienta las Islas de aislamientos `Isolate-V8 Servers`) facilitando llamadas ultra rápidas inmediatas en los `routes` adyacentes de APIs .
* **Contras:** Aumento moderado de tamaño pesado global sobre las paqueterías bundles exportadas.
* **¿Por qué Evitar Funciones Múltiples Reducidas?:** Arquitecturas diminutas distribuidas separadas escalan las gestiones a pesadillas laberínticas, requiriendo implementaciones manuales clonadas en la Console Rule Panel sumado a exigidas copias y requerimientos excesivos a re-escrituras locales en las exportaciones de Javascript.

### Console vs CLI Empleo
Incluso usando diariamente para el sistema, el ambiente y empleo del recurso principal CLI, optamos en la inducción orientar principalmente la atención de iniciados al ecosistema Gráfico Consola "Panel Interface"; reduciendo fricciones iniciales técnicas que asustan al iniciante de Terminales CLI locales. Entendiendo aun pero que, a lo mismo también en "Preview Environments", su aplicación central al desarrollarse las pruebas directrices, recaen exclusivamente a los Command Lines y CLIs y valdrían aditividad futuras crear un bloque enterísimo focalizado de inicio y Getting Started de despliegues inmediatos e absolutos desde Terminales.

---

## 4. Colaboración Con El Desarrollo Y La Asistencia de Inteligencia Artificiales

- Mientras que por la codificación se originó ~%90 de implementaciones u elaborados brutos de los modelos base (soportado e interconectados bajo revisión rigurosa iterando testeados humanos míos); las elecciones primarias teóricas y narrativas estratégicas absolutas (Function First / Descartes Estructurales y Resoluciones de Usabilidad Web o Menús) fueron purísimas exclusividades mías. 
- Y el uso visual general de Modelajes Asistidos Y Renderizados/Diagramados aplicables se complementa al contraste puro E 100% humanístico / Orgánico en Edición o Cortes puramente Manuales usando plugins OS X / OBS de Apple / Resoluciones y Montajes Finales en editores Wondershare (Filmora). 

---

## 5. El Panorama Hacia A Futuro

Los aditamentos posteriores propuestos a futuro ideal serian enfocados en las siguientes prioridades:

* **Interacciones Corregibles y Feedbacks "En Sitio / Textos Mismos" E In-Pages:** Reportes e O Creaciones O De A Tickets directos basados y enviados al hacer y "Clicks en o textos equivocados".
* **Sistemas De E Debates Puros (Comentarios) O en y O Por Comunidades U E Para Páginas Base Final:** Como en formatos Microsoft y PHP manuales, interacciones comunitarias Dev a Devs para soporte nativo local De Página Mismo.
* **Scrollbars Inteligentes UI y Side-Menus:** Recolocando/focalizando vistas automáticas O directos De los Y Menús al Y abrir U a links E directivos U externos e En ramas Profundas de a Las O Y Docs. 
* **Filtros e Avanzados O A Búsquedas Mistas O Por E Categoría:** Funcionalidad granular de los excelentes y actuales Motores presentes en la plataforma Principal Actual De Azion.
* **Resoluciones Y Exhibición - Y - Expositores Públicos:** Enfoques gamificados (Medallas por aportes comunitarios). Visibilización a En Los Casos Exitosos Públicos Reales De Aplicatividad Compleja.
* **Y Chequeos / Auditorías Plenas en Accesibilidad y Conraste de Etiquetas ARiA (Visual-Blindness).**
* **Inclusión Universal: Múltiples expansiones de localizaciones y configuraciones regionales completas para accesibilidad a nuevos idiomas sin limites geográficos.**
