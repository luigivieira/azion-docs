---
title: Proyecto de Ejemplo Completo
sidebar_position: 6
description: Una inmersión profunda en un proyecto real de Azion Edge Functions.
---

# Proyecto de Ejemplo Completo

Para ver Azion Edge Functions en un contexto de nivel de producción, explore el proyecto **Augmented Open5e**. Este proyecto implementa un motor de búsqueda semántica para hechizos de D&D 5e, utilizando IA para traducir y aumentar el contenido de la API de Open5e.

Repositorio: [luigivieira/augmentedopen5e](https://github.com/luigivieira/augmentedopen5e)

---

## Características Principales

- **Búsqueda Semántica**: Utiliza la API de Groq para el procesamiento impulsado por IA.
- **Soporte Multilingüe**: Admite el almacenamiento en caché de traducciones en múltiples configuraciones regionales.
- **Edge Native**: Construido específicamente para el Azion Edge Runtime.
- **Alto Rendimiento**: Optimizado con estrategias de caché agresivas utilizando **Azion KV Storage** para un estado centralizado y persistente.

---

## Organización del Código

El proyecto sigue una estructura moderna de TypeScript:

- `src/`: Lógica central y manejadores de eventos.
- `src/lib/`: Utilidades reutilizables y clientes de API.
- `src/api/`: Definiciones de puntos finales (ej. `/spells`, `/languages`).
- `test/`: Pruebas unitarias completas utilizando Vitest.
- `azion/`: Archivos de estado específicos del entorno (`azion.json`).

---

## Implementación Técnica

El proyecto aprovecha las funciones avanzadas de Azion Runtime para lograr un alto rendimiento y una baja latencia:

### 1. Estado Centralizado con KV Storage
El proyecto utiliza **Azion KV Storage** como base de datos centralizada. Esta infraestructura es gestionada íntegramente por la plataforma Azion:
- **Lecturas Locales**: La plataforma replica automáticamente los datos en los nodos del edge más cercanos a los usuarios.
- **Escrituras Globales**: El código simplemente escribe en el almacén; Azion gestiona la propagación por la red con **consistencia eventual**.

```javascript
// Lectura desde el KV centralizado (Lectura local rápida)
const cachedResult = await Azion.kv.get(cacheKey);

// Escritura en el KV centralizado (Replicación global)
await Azion.kv.put(cacheKey, JSON.stringify(data));
```

### 2. Procesamiento Asíncrono con `waitUntil`
La plataforma Azion permite que las funciones continúen procesando después de enviar una respuesta al cliente mediante `event.waitUntil()`. Esto es esencial para mantener una experiencia de usuario ágil mientras se realizan tareas de mantenimiento:

```javascript
async function handleRequest(event) {
  // 1. Lógica para respuesta rápida
  const response = await fetchFromOrigin();

  // 2. Delegar el mantenimiento a la plataforma
  event.waitUntil(updateCacheAndLogs(event));

  // 3. Responder inmediatamente
  return response;
}
```
- **Gestionado por la Plataforma**: El edge runtime mantiene vivo el contexto de ejecución hasta que finalizan las tareas asíncronas.
- **Eficiencia en el Edge**: El procesamiento ocurre en el edge, evitando viajes de ida y volta innecesarios a los orígenes centrales.

---

## Flujo de Trabajo de Desarrollo

### 1. Gestión Moderna de Paquetes
El proyecto utiliza **pnpm** para una gestión de dependencias rápida y determinista.

```bash
pnpm install
```

### 2. Emulación Local
En lugar de desplegar en el borde para cada cambio, el proyecto utiliza el servidor local de la CLI de Azion:

```bash
pnpm emulate
```

**Persistencia de KV local**: Al emular localmente, los datos de KV se almacenan en `.edge/storage/` dentro de la raíz del proyecto, lo que permite persistir los datos entre reinicios sin costes remotos.

### 3. Manejo del Entorno
Las claves sensibles (como la **Groq API Key**) se manejan a través de un archivo `.env.local`, que Git ignora automáticamente.

---

## Estrategia de Despliegue

El proyecto utiliza una configuración de entorno dual (Staging y Production) definida en `azion.config.ts`.

- **Staging**: `pnpm deploy:staging` (crea recursos con el sufijo `-staging`).
- **Production**: `pnpm deploy:prod` (automatizado a través de CI/CD).

Los archivos de estado `azion.json` se **envían al repositorio**, lo que garantiza que la CLI siempre sepa qué recursos específicos actualizar, independientemente de qué desarrollador o ejecutor de CI esté realizando el despliegue.

---

## Pipeline de CI/CD

El proyecto incluye flujos de trabajo de GitHub Actions para:

- **Linting y Formateo**: Garantizar la coherencia del código.
- **Pruebas Automatizadas**: Ejecución de pruebas unitarias con Vitest.
- **Validación de Cobertura**: Se requiere un mínimo del **90% de cobertura de pruebas** antes de permitir un despliegue.
- **Despliegue Automatizado**: Envío automático a staging en las PR y a producción en las fusiones a `main`.

---

## Integración con VS Code

El proyecto está optimizado para VS Code, incluyendo:
- **Linting Preconfigurado**: ESLint y Prettier para el soporte de "formatear al guardar".
- **Integración con TypeScript**: Seguridad de tipos completa para el entorno Azion Runtime.
- **Scripts Personalizados**: Acceso rápido a tareas comunes de la CLI a través de los scripts de `package.json`.
