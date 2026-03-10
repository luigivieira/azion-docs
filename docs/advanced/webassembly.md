---
title: WebAssembly
sidebar_position: 1
description: Using WebAssembly in Azion Edge Functions.
---

# WebAssembly

WebAssembly (Wasm) lets you run compiled code written in languages like C, C++, Rust, or Go inside an Edge Function at near-native speed. It is a good fit for CPU-intensive tasks — image processing, cryptography, parsing, compression — that would be too slow in pure JavaScript.

---

## 1. How WebAssembly Works in Edge Functions

The Azion Runtime exposes the standard [WebAssembly JavaScript API](https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface). You compile your code to a `.wasm` binary, embed it in your function, instantiate it, and call its exported functions.

The basic pattern:

1. Compile your source code to a `.wasm` binary using the toolchain for your language (`wasm-pack`, `emcc`, `tinygo`, etc.).
2. Encode the binary as a Base64 string to embed it in your Edge Function code (since there is no file system at runtime).
3. Decode and instantiate the module at module load time (once per isolate).
4. Call the Wasm exports from your event handler.

---

## 2. Embedding and Instantiating a Wasm Module

Since Edge Functions have no access to the file system, you must embed the `.wasm` binary directly in your JavaScript code. The most practical approach is to Base64-encode the binary and decode it at runtime.

```js
// wasm-module is a Base64 string of your compiled .wasm file
const WASM_BASE64 = "AGFzbQEAAAABBgFgAX8BfwMCAQAHBwEDYWRkAAA...";

// Decode the Base64 string to a Uint8Array
const wasmBytes = Uint8Array.from(atob(WASM_BASE64), c => c.charCodeAt(0));

// Instantiate at module load time (runs once per isolate, not per request)
const wasmModule = new WebAssembly.Module(wasmBytes);
const wasmInstance = new WebAssembly.Instance(wasmModule);

// Export the function
const { add } = wasmInstance.exports;

addEventListener("fetch", event => {
  const result = add(40, 2); // 42

  event.respondWith(new Response(String(result)));
});
```

:::tip Instantiate at module level
`WebAssembly.Module` and `WebAssembly.Instance` are synchronous and relatively expensive. By instantiating at module level (outside the event handler), you pay the cost once per isolate lifetime rather than once per request.
:::

---

## 3. Working with Memory

WebAssembly operates on its own linear memory. To pass strings or binary data between JavaScript and Wasm, you must read and write through the module's `memory` export.

The following example shows how to pass a string from JavaScript into a Wasm function and read the result back:

```js
const WASM_BASE64 = "..."; // your compiled module

const wasmBytes = Uint8Array.from(atob(WASM_BASE64), c => c.charCodeAt(0));
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

addEventListener("fetch", event => {
  const input = new URL(event.request.url).searchParams.get("input") ?? "";

  const { ptr, len } = writeString(input);
  const resultPtr = process_string(ptr, len);
  const resultLen = new Uint32Array(memory.buffer, resultPtr)[0];
  const result = readString(resultPtr + 4, resultLen);

  deallocate(ptr, len);

  event.respondWith(new Response(result));
});
```

The exact memory layout depends on your Wasm module's ABI. Refer to your toolchain's documentation for the expected calling conventions.

---

## 4. Async Instantiation with `WebAssembly.instantiate`

For larger modules, you may prefer the async API to avoid blocking the isolate during initialization:

```js
const WASM_BASE64 = "...";

// Instantiate asynchronously at module level
const wasmBytes = Uint8Array.from(atob(WASM_BASE64), c => c.charCodeAt(0));
const instancePromise = WebAssembly.instantiate(wasmBytes).then(
  result => result.instance
);

addEventListener("fetch", async event => {
  const instance = await instancePromise;
  const { compute } = instance.exports;

  const value = compute(10);
  event.respondWith(new Response(String(value)));
});
```

This pattern ensures the module is compiled once and the resulting `Promise` is reused across warm invocations.

---

## 5. Compiling Rust to WebAssembly

Rust is a popular choice for Wasm modules because of its zero-cost abstractions, strong type system, and excellent Wasm toolchain.

**Setup:**

```bash
# Install the Wasm target
rustup target add wasm32-unknown-unknown

# Install wasm-pack for building and packaging
cargo install wasm-pack
```

**Example Rust source (`src/lib.rs`):**

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

**Build:**

```bash
wasm-pack build --target web --out-dir pkg
```

This produces a `.wasm` file in `pkg/`. Base64-encode it:

```bash
base64 -i pkg/your_module_bg.wasm | tr -d '\n'
```

Embed the output string into your Edge Function as shown in section 2.

---

## 6. Compiling C/C++ to WebAssembly

Use **Emscripten** to compile C or C++ code to Wasm.

**Example C source (`add.c`):**

```c
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
int add(int a, int b) {
    return a + b;
}
```

**Build (output standalone Wasm, no JS glue):**

```bash
emcc add.c -O3 -o add.wasm \
  -s EXPORTED_FUNCTIONS='["_add"]' \
  -s STANDALONE_WASM
```

Base64-encode `add.wasm` and embed it in your function.

---

## 7. Use Cases

WebAssembly is appropriate when:

- The computation is **CPU-intensive** and a JavaScript implementation is too slow (image filters, video thumbnailing, hash computation, compression).
- You have existing logic in C, C++, Rust, or Go that would be expensive to rewrite in JavaScript.
- You need deterministic, bit-exact computation (e.g., cryptographic primitives not covered by the Web Crypto API).

It is **not** appropriate for:

- I/O-bound tasks — there is no benefit to running `fetch()` from Wasm instead of JavaScript.
- Simple logic — the overhead of memory management and module instantiation outweighs any gains.
- Very large binaries — the Wasm binary contributes to your function's code size limit.

---

## 8. Size Considerations

The `.wasm` binary becomes part of your function code when Base64-encoded. A 100 KB Wasm binary becomes approximately 133 KB of Base64 text. Keep your modules lean by:

- Enabling size optimizations in your compiler (`-O3 -Oz` for Emscripten, `opt-level = "z"` for Rust).
- Stripping debug symbols from the binary (`wasm-strip` from the `wabt` toolkit).
- Only exporting the functions you actually call from JavaScript.

See [Limits](../limits.md) for the code size limit that applies to your plan.

---

## Related

- [Runtime APIs](../runtime-reference/runtime-apis.md) — Web APIs available alongside your Wasm module.
- [Performance Optimization](./performance-optimization.md) — general techniques for keeping functions fast.
- [Limits](../limits.md) — code size and execution time limits.
