---
title: WebAssembly
sidebar_position: 1
description: Usando WebAssembly em Azion Edge Functions.
---

# WebAssembly

WebAssembly (Wasm) permite executar código compilado escrito em linguagens como C, C++, Rust ou Go dentro de uma Edge Function com velocidade quase nativa. É ideal para tarefas intensivas de CPU — processamento de imagens, criptografia, parsing, compressão — que seriam lentas demais em JavaScript puro.

---

## 1. Como o WebAssembly Funciona em Edge Functions

O Azion Runtime expõe a [API JavaScript padrão do WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface). Você compila seu código para um binário `.wasm`, incorpora-o na sua função, instancia e chama as funções exportadas.

O padrão básico:

1. Compile seu código-fonte para um binário `.wasm` usando o toolchain da sua linguagem (`wasm-pack`, `emcc`, `tinygo`, etc.).
2. Codifique o binário como uma string Base64 para incorporá-lo ao código da sua Edge Function (pois não há sistema de arquivos em tempo de execução).
3. Decodifique e instancie o módulo no momento de carregamento do módulo (uma vez por isolate).
4. Chame as exportações do Wasm a partir do seu event handler.

---

## 2. Incorporando e Instanciando um Módulo Wasm

Como Edge Functions não têm acesso ao sistema de arquivos, você deve incorporar o binário `.wasm` diretamente no seu código JavaScript. A abordagem mais prática é codificar o binário em Base64 e decodificá-lo em tempo de execução.

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

:::tip Instancie no nível do módulo
`WebAssembly.Module` e `WebAssembly.Instance` são síncronos e relativamente custosos. Ao instanciar no nível do módulo (fora do event handler), você paga o custo uma vez por tempo de vida do isolate, e não uma vez por requisição.
:::

---

## 3. Trabalhando com Memória

O WebAssembly opera em sua própria memória linear. Para passar strings ou dados binários entre JavaScript e Wasm, você deve ler e escrever por meio da exportação `memory` do módulo.

O exemplo a seguir mostra como passar uma string do JavaScript para uma função Wasm e ler o resultado de volta:

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

O layout exato da memória depende da ABI do seu módulo Wasm. Consulte a documentação do seu toolchain para as convenções de chamada esperadas.

---

## 4. Instanciação Assíncrona com `WebAssembly.instantiate`

Para módulos maiores, você pode preferir a API assíncrona para evitar bloquear o isolate durante a inicialização:

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

Esse padrão garante que o módulo seja compilado uma única vez e a `Promise` resultante seja reutilizada em invocações subsequentes (warm).

---

## 5. Compilando Rust para WebAssembly

Rust é uma escolha popular para módulos Wasm por suas abstrações de custo zero, sistema de tipos robusto e excelente toolchain para Wasm.

**Configuração:**

```bash
# Install the Wasm target
rustup target add wasm32-unknown-unknown

# Install wasm-pack for building and packaging
cargo install wasm-pack
```

**Exemplo de código-fonte Rust (`src/lib.rs`):**

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

Isso gera um arquivo `.wasm` em `pkg/`. Codifique-o em Base64:

```bash
base64 -i pkg/your_module_bg.wasm | tr -d '\n'
```

Incorpore a string resultante na sua Edge Function conforme mostrado na seção 2.

---

## 6. Compilando C/C++ para WebAssembly

Use o **Emscripten** para compilar código C ou C++ para Wasm.

**Exemplo de código-fonte C (`add.c`):**

```c
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
int add(int a, int b) {
    return a + b;
}
```

**Build (saída Wasm standalone, sem código JS auxiliar):**

```bash
emcc add.c -O3 -o add.wasm \
  -s EXPORTED_FUNCTIONS='["_add"]' \
  -s STANDALONE_WASM
```

Codifique `add.wasm` em Base64 e incorpore na sua função.

---

## 7. Casos de Uso

WebAssembly é adequado quando:

- A computação é **intensiva de CPU** e uma implementação em JavaScript é lenta demais (filtros de imagem, thumbnailing de vídeo, cálculo de hash, compressão).
- Você tem lógica existente em C, C++, Rust ou Go que seria custosa de reescrever em JavaScript.
- Você precisa de computação determinística e bit-exata (por exemplo, primitivas criptográficas não cobertas pela Web Crypto API).

**Não** é adequado para:

- Tarefas limitadas por I/O — não há benefício em executar `fetch()` a partir do Wasm em vez de JavaScript.
- Lógica simples — o overhead do gerenciamento de memória e da instanciação do módulo supera qualquer ganho.
- Binários muito grandes — o binário Wasm contribui para o limite de tamanho de código da sua função.

---

## 8. Considerações de Tamanho

O binário `.wasm` passa a fazer parte do código da sua função quando codificado em Base64. Um binário Wasm de 100 KB se torna aproximadamente 133 KB de texto Base64. Mantenha seus módulos enxutos:

- Ativando otimizações de tamanho no compilador (`-O3 -Oz` para Emscripten, `opt-level = "z"` para Rust).
- Removendo símbolos de debug do binário (`wasm-strip` do toolkit `wabt`).
- Exportando apenas as funções que você de fato chama a partir do JavaScript.

Consulte [Limites](../limits.md) para o limite de tamanho de código aplicável ao seu plano.

---

## Relacionados

- [Runtime APIs](../runtime-reference/runtime-apis.md) — Web APIs disponíveis junto ao seu módulo Wasm.
- [Performance Optimization](./performance-optimization.md) — técnicas gerais para manter as funções rápidas.
- [Limites](../limits.md) — limites de tamanho de código e tempo de execução.
