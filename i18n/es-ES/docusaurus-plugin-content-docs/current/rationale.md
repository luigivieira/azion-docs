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
- **Diagramas Generados IA:** Complemente esquemas y modelos por IA## 3. El Proyecto de Referencia: Augmented Open5e

Para validar la documentación, construí **[Augmented Open5e](https://github.com/luigivieira/augmentedopen5e)** - un proyecto de código abierto que utiliza Edge Functions para traducir las reglas de D&D a través de LLMs. La idea era experimentar con un caso de uso más complejo de las funciones disponibles en la plataforma. Utiliza KV Storage, `waitUntil` (para el procesamiento asíncrono en segundo plano), y la única razón por la que no utiliza AI Inference de Azion es porque encontré problemas durante las pruebas. Esto sirve como un buen recordatorio para mejorar la experiencia del desarrollador allí: los mensajes de error deben indicar explícitamente la razón técnica por la que un modelo falló, en lugar de sugerir vagamente que no existe o no está permitido. También modifiqué manualmente la interfaz de usuario de este proyecto basándome en los comentarios de los compañeros (por ejemplo, modificando los mensajes del indicador de progreso para la tarea `waitUntil` en segundo plano para manejar mejor las expectativas del usuario y para que no se asemejen visualmente a mensajes de error - especialmente considerando que la API devuelve un código `202 Accepted` de forma correcta para indicar que el trabajo está en progreso).

### Compensaciones: API Edge Monolítica vs. Micro-funcions
Para la arquitectura del proyecto, elegí una **API Edge Monolítica** en la que una única función maneja todos los endpoints basándose en las reglas de enrutamiento de Azion y en la ruta de la solicitud.
* **Pros:** Un solo despliegue, reutilización de código perfecta (autenticación, validación de JSON) y menos "arranques en frío" generales (una solicitud en `/api/monsters` calienta el Isolate de V8 para una solicitud posterior en `/api/spells`).
* **Contras:** El tamaño del bundle final es ligeramente mayor.
* **¿Por qué no usar Micro-functions?** Construir una función separada para cada endpoint crea una inmensa sobrecarga de gestión (docenas de reglas e instancias de consola separadas) y obliga a duplicar las bibliotecas.

*(Nota: Si Azion introduce desencadenantes que no sean HTTP en el futuro, como los cron jobs, la arquitectura ideal separaría esos procesos del Monolito HTTP).*

### Despliegue mediante CLI vs Inducción en Consola
Mientras que el proyecto en sí utiliza la CLI de Azion, los "Primeros Pasos" de la documentación guían intencionalmente a los usuarios a través de la Consola. Para los principiantes absolutos, las interfaces visuales ofrecen una experiencia de inducción más intuitiva y tranquilizadora. Sin embargo, la página "Desarrollo Local / Preview" se enfoca directamente en cómo hacer esto mediante la CLI, y agregar un tutorial completo de inducción que se enfoque en la CLI sería un excelente próximo paso.

---

## 4. El Proceso de Desarrollo y el Uso de Inteligencia Artificial

Como mencioné anteriormente, la IA fue una colaboradora muy poderosa.
- Diseñé la arquitectura del código, pero la IA generó alrededor del 90% del mismo bajo mi estricta revisión, testings manuales y refinamiento iterativo.
- La IA ayudó a formatear esta documentación, pero las decisiones estratégicas (la narrativa centrada en la "Función", descartar la estructura anterior, implementar atajos de teclado) fueron totalmente mías.
- Aunque usé la IA para generar los diagramas, **todos los videos tutoriales fueron creados completamente a mano** utilizando OBS Studio con plugins en Mac para los efectos, y fueron editados en Wondershare Filmora.

---

## 5. Visión para el Futuro (La lista de "Si tuviera más tiempo")

Si esto fuera un proyecto a gran escala y de largo plazo, estas son las iniciativas que priorizaría para mejorar la Experiencia del Desarrollador en Azion:

* **Correcciones y Feedbacks en la Página Misma:** Un mecanismo a través del cual los usuarios puedan resaltar texto y hacer clic en "Enviar Corrección", lo que generaría un ticket de forma automática con la página, la configuración regional y el párrafo exacto con problemas.
* **Comentarios de la Comunidad:** Añadir secciones de comentarios a nivel de página (como la documentación tradicional de PHP) para obtener soporte inmediato (peer-to-peer) entre desarrolladores.
* **Desplazamiento Inteligente de la Interfaz:** Desplazar automáticamente la barra lateral de la vista cuando el usuario haya saltado a una página profundamente anidada tras realizar una búsqueda o seguir un enlace directo.
* **Filtros de Búsqueda Avanzados:** Implementar los excelentes y granulares filtros de búsqueda que actualmente existen en la documentación original de Azion.
* **Un Mayor Enfoque en Casos de Reutilización:** Guías especializadas sobre cómo deberían compartir y reutilizar correctamente las funciones e instancias a lo largo de las aplicaciones.
* **Vitrina y Recompensas Públicas:** Un lugar donde se expongan los proyectos destacados de la comunidad, así como botones/créditos (badges) para incentivar más contribuciones de la comunidad.
* **Auditorías de Accesibilidad y un Excelente Contraste de Colores:** Garantir siempre niveles perfectos de contraste de colores y agregar las etiquetas ARIA correctamente para asistir a los desarrolladores ciegos o con capacidades reducidas.
* **Diagramas Mantenibles:** Volver a generar diagramas para poder separar sus aspectos de texto general y aislar solo su componente gráfico; reduciendo dependencias directas de herramientas de IA.
* **Más Configuración Regional:** Expandir la cantidad de idiomas a los que llega la plataforma para facilitar en gran modo la democratización del acceso.
* **Inclusión Universal: Múltiples expansiones de localizaciones y configuraciones regionales completas para accesibilidad a nuevos idiomas sin limites geográficos.**
