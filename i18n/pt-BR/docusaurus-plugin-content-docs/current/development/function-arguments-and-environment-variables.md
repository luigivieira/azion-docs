---
title: Function Arguments and Environment Variables
sidebar_label: Argumentos e Variáveis
sidebar_position: 3
description: Usando argumentos de função e variáveis de ambiente em Azion Edge Functions.
---

# Function Arguments and Environment Variables

A Azion oferece duas formas distintas de lidar com configurações e dados sensíveis em suas Edge Functions: **Function Arguments** (Argumentos de Função) e **Environment Variables** (Variáveis de Ambiente). Entender a diferença entre eles é fundamental para construir aplicações reutilizáveis e seguras.

---

## 1. Function Arguments (JSON Args)

Os argumentos de função são valores de configuração locais passados para uma função em tempo de execução. Eles são usados para tornar as funções reutilizáveis, permitindo que diferentes instâncias da mesma função se comportem de maneira diferente com base no JSON fornecido.

### Como Funcionam

- **Escopo**: Local à função e suas instâncias.
- **Armazenamento**: Definido na aba **Arguments** da **Function Instance** no Azion Console.
- **Valores de Template**: Você também pode definir argumentos padrão no nível de definição da **Function**. Estes servem como valores base para qualquer instância criada a partir dessa função. Se uma instância definir seus próprios argumentos, eles serão usados para aquela execução específica.
- **Acesso**: Disponível através do objeto `event.args`.

### Configurando Argumentos no Console

1. Abra o **Azion Console** → **Build** → **Edge Applications** e selecione sua aplicação.
2. Vá para a aba **Functions** e abra a Function Instance que deseja configurar.
3. Na aba **Arguments**, adicione seus pares chave-valor como JSON:

```json
{
  "API_URL": "https://api.example.com",
  "DEBUG_MODE": true,
  "TIMEOUT": 5000
}
```

### Lendo Argumentos em Tempo de Execução

Use `event.args` para acessar os valores:

```js
addEventListener("fetch", event => {
  const { API_URL, DEBUG_MODE } = event.args;
  
  if (DEBUG_MODE) {
    console.log(`Fetching from: ${API_URL}`);
  }
  
  event.respondWith(fetch(API_URL));
});
```

---

## 2. Environment Variables

Variáveis de ambiente são configurações globais ou segredos (como chaves de API ou credenciais de banco de dados) compartilhados em sua conta ou aplicações específicas. Elas são mais adequadas para informações sensíveis que não devem fazer parte dos argumentos JSON da função.

### Como Funcionam

- **Escopo**: Nível de conta (disponível para todas as edge applications em sua conta).
- **Armazenamento**: Definido na seção **Build** → **Variables** do Azion Console ([console.azion.com/variables](https://console.azion.com/variables)).
- **Segurança**: Você pode usar o botão **Secret** para criptografar o valor. Uma vez que uma variável é salva como secret, seu comportamento não pode ser editado.
- **Acesso**: Disponível através da API `Azion.env`.

### Configurando Variáveis no Console

1. Abra o **Azion Console** → **Build** → **Variables**.
2. Adicione seus pares chave-valor. Ative o botão **Secret** para valores sensíveis para garantir que sejam criptografados e permaneçam ocultos.

### Lendo Variáveis em Tempo de Execução

Use `Azion.env.get()` para recuperar o valor como uma string:

```js
addEventListener("fetch", event => {
  const apiKey = Azion.env.get("MY_SECRET_API_KEY");

  if (!apiKey) {
    event.respondWith(new Response("Missing API Key", { status: 500 }));
    return;
  }

  // Use a apiKey em sua lógica
});
```

:::info Não é o mesmo que `process.env`
O Azion Runtime não possui um global `process`. Sempre use `Azion.env.get(name)` para ler variáveis de ambiente.
:::

---

## 3. Comparação e Boas Práticas

| Recurso | Function Arguments | Environment Variables |
|---|---|---|
| **Ideal Para** | Config específica da instância (URLs, flags) | Segredos da conta (chaves de API, IDs) |
| **Formato** | Objeto JSON | Pares Chave-Valor (String) |
| **Acesso em Runtime** | `event.args` | `Azion.env.get()` |
| **Localização** | Function Instance / Function | Console > Variables |

### Boas Práticas

- **Separação de Preocupações**: Use Arguments para valores que mudam por implantação/instância. Use Variáveis de Ambiente para segredos sensíveis e configuração global.
- **Forneça Padrões**: Sempre trate valores ausentes em seu código para evitar erros em tempo de execução.
- **Coerção de Tipos**: Valores de `Azion.env.get()` são sempre strings. Valores em JSON Args mantêm seus tipos JSON (número, booleano, etc.).
- **Validação**: Valide a configuração obrigatória no início de sua função para falhar rapidamente com uma mensagem clara.

```js
const args = event.args;
const timeout = Number(args.TIMEOUT ?? 5000); // Converta se necessário
const dbUrl = Azion.env.get("DATABASE_URL");

if (!dbUrl) throw new Error("A variável DATABASE_URL é obrigatória");
```

