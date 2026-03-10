---
title: WebAssembly
sidebar_position: 1
description: Uso de WebAssembly en Azion Edge Functions.
---

# WebAssembly

WebAssembly (Wasm) le permite ejecutar código compilado escrito en lenguajes como C, C++, Rust o Go dentro de una Edge Function a una velocidad cercana a la nativa. Es ideal para tareas intensivas de CPU — procesamiento de imágenes, criptografía, parseo, compresión — que serían demasiado lentas en JavaScript puro.

---

## 1. Cómo Funciona WebAssembly en Edge Functions

El Runtime de Azion expone la [API estándar de JavaScript para WebAssembly](https://developer.mozilla.org/es/docs/WebAssembly/JavaScript_interface). Usted compila su código en un binario `.wasm`, lo embebe en su función, lo instancia y llama a sus funciones exportadas.

El patrón básico:

1. Compile su código fuente a un binario `.wasm` utilizando el conjunto de herramientas (toolchain) de su lenguaje (`wasm-pack`, `emcc`, `tinygo`, etc.).
2. Codifique el binario como una cadena Base64 para embeberlo en el código de su Edge Function (ya que no hay sistema de archivos en tiempo de ejecución).
3. Decodifique e instancie el módulo en el momento de la carga del módulo (una vez por isolate).
4. Llame a las exportaciones de Wasm desde su manejador de eventos.

---

## 2. Embeber e Instanciar un Módulo Wasm

Dado que las Edge Functions no tienen acceso al sistema de archivos, debe embeber el binario `.wasm` directamente en su código JavaScript. El enfoque más práctico es codificar el binario en Base64 y decodificarlo en tiempo de ejecución.

```js
// wasm-module es una cadena Base64 de su archivo .wasm compilado
const WASM_BASE64 = "AGFzbQEAAAABBgFgAX8BfwMCAQAHBwEDYWRkAAA...";

// Decodificar la cadena Base64 a un Uint8Array
const wasmBytes = Uint8Array.from(atob(WASM_BASE64), (c) => c.charCodeAt(0));

// Instanciar en el momento de la carga del módulo (se ejecuta una vez por isolate, no por solicitud)
const wasmModule = new WebAssembly.Module(wasmBytes);
const wasmInstance = new WebAssembly.Instance(wasmModule);

// Exportar la función
const { add } = wasmInstance.exports;

addEventListener("fetch", (event) => {
  const result = add(40, 2); // 42

  event.respondWith(new Response(String(result)));
});
```

:::tip Instanciar a nivel de módulo
`WebAssembly.Module` y `WebAssembly.Instance` son sincrónicos y relativamente costosos. Al instanciarlos a nivel de módulo (fuera del manejador de eventos), paga el coste una vez por la vida útil del isolate en lugar de una vez por solicitud.
:::

---

## 3. Trabajar con la Memoria

WebAssembly opera en su propia memoria lineal. Para pasar cadenas o datos binarios entre JavaScript y Wasm, debe leer y escribir a través de la exportación `memory` del módulo.

El siguiente ejemplo muestra cómo pasar una cadena de JavaScript a una función Wasm y leer el resultado de vuelta:

```js
const WASM_BASE64 = "..."; // su módulo compilado

const wasmBytes = Uint8Array.from(atob(WASM_BASE64), (c) => c.charCodeAt(0));
const wasmModule = new WebAssembly.Module(wasmBytes);
const wasmInstance = new WebAssembly.Instance(wasmModule);

const { memory, process_string, allocate, deallocate } = wasmInstance.exports;

const writeString = (str) => {
  const encoded = new TextEncoder().encode(str);
  const ptr = allocate(encoded.length);
  new Uint8Array(memory.buffer, ptr, encoded.length).set(encoded);
  return { ptr, len: encoded.length };
};

const readString = (ptr, len) => {
  return new TextDecoder().decode(new Uint8Array(memory.buffer, ptr, len));
};

addEventListener("fetch", (event) => {
  const input = new URL(event.request.url).searchParams.get("input") ?? "";

  const { ptr, len } = writeString(input);
  const resultPtr = process_string(ptr, len);
  const resultLen = new Uint32Array(memory.buffer, resultPtr)[0];
  const result = readString(resultPtr + 4, resultLen);

  deallocate(ptr, len);

  event.respondWith(new Response(result));
});
```

La disposición exacta de la memoria depende del ABI de su módulo Wasm. Consulte la documentación de su conjunto de herramientas para conocer las convenciones de llamada esperadas.

---

## 4. Instanciación Asíncrona con `WebAssembly.instantiate`

Para módulos más grandes, es posible que prefiera la API asíncrona para evitar bloquear el isolate durante la inicialización:

```js
const WASM_BASE64 = "...";

// Instanciar asíncronamente a nivel de módulo
const wasmBytes = Uint8Array.from(atob(WASM_BASE64), (c) => c.charCodeAt(0));
const instancePromise = WebAssembly.instantiate(wasmBytes).then(
  (result) => result.instance,
);

addEventListener("fetch", async (event) => {
  const instance = await instancePromise;
  const { compute } = instance.exports;

  const value = compute(10);
  event.respondWith(new Response(String(value)));
});
```

Este patrón asegura que el módulo se compile una vez y la `Promise` resultante se reutilice en las invocaciones en caliente.

---

## 5. Compilación de Rust a WebAssembly

Rust es una elección popular para módulos Wasm debido a sus abstracciones de coste cero, su fuerte sistema de tipos y su excelente conjunto de herramientas para Wasm.

**Configuración:**

```bash
# Instalar el target de Wasm
rustup target add wasm32-unknown-unknown

# Instalar wasm-pack para compilación y empaquetado
cargo install wasm-pack
```

**Ejemplo de código fuente en Rust (`src/lib.rs`):**

```rust
#[no_mangle]
pub extern "C" fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}
```

**Compilación:**

```bash
wasm-pack build --target web --out-dir pkg
```

Esto produce un archivo `.wasm` en `pkg/`. Codifíquelo en Base64:

```bash
base64 -i pkg/your_module_bg.wasm | tr -d '\n'
```

Embeba la cadena resultante en su Edge Function como se muestra en la sección 2.

---

## 6. Compilación de C/C++ a WebAssembly

Use **Emscripten** para compilar código C o C++ a Wasm.

**Ejemplo de código fuente en C (`add.c`):**

```c
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
int add(int a, int b) {
    return a + b;
}
```

**Compilación (genera Wasm independiente, sin pegamento JS):**

```bash
emcc add.c -O3 -o add.wasm \
  -s EXPORTED_FUNCTIONS='["_add"]' \
  -s STANDALONE_WASM
```

Codifique `add.wasm` en Base64 y embébalo en su función.

---

## 7. Casos de Uso

WebAssembly es adecuado cuando:

- La computación es **intensiva en CPU** y una implementación en JavaScript es demasiado lenta (filtros de imagen, generación de miniaturas de video, cálculo de hashes, compresión).
- Tiene lógica existente en C, C++, Rust o Go que sería costoso reescribir en JavaScript.
- Necesita una computación determinista y exacta a nivel de bit (por ejemplo, primitivas criptográficas no cubiertas por la API Web Crypto).

**No** es adecuado para:

- Tareas limitadas por E/S — no hay beneficio en ejecutar `fetch()` desde Wasm en lugar de JavaScript.
- Lógica simple — la sobrecarga de la gestión de memoria y la instanciación del módulo supera cualquier ganancia.
- Binarios muy grandes — el binario Wasm contribuye al límite de tamaño de código de su función.

---

## 8. Consideraciones sobre el Tamaño

El binario `.wasm` pasa a formar parte del código de su función cuando se codifica en Base64. Un binario Wasm de 100 KB se convierte aproximadamente en 133 KB de texto Base64. Mantenga sus módulos ligeros:

- Habilitando las optimizaciones de tamaño en su compilador (`-O3 -Oz` para Emscripten, `opt-level = "z"` for Rust).
- Eliminando los símbolos de depuración del binario (`wasm-strip` del conjunto de herramientas `wabt`).
- Exportando solo las funciones que realmente llama desde JavaScript.

Consulte [Límites](../limits.md) para conocer el límite de tamaño de código que se aplica a su plan.

---

## Relacionado

- [APIs de Runtime](../runtime-reference/runtime-apis.md) — APIs Web disponibles junto con su módulo Wasm.
- [Optimización del Rendimiento](./performance-optimization.md) — técnicas generales para mantener las funciones rápidas.
- [Límites](../limits.md) — límites de tamaño de código y tiempo de ejecución.
