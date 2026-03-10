---
title: Projeto de Exemplo Completo
sidebar_position: 6
description: Um mergulho profundo em um projeto real de Azion Edge Functions.
---

# Projeto de Exemplo Completo

Para ver o Azion Edge Functions em um contexto de nível de produção, explore o projeto **Augmented Open5e**. Este projeto implementa um mecanismo de busca semântica para feitiços de D&D 5e, usando IA para traduzir e aumentar o conteúdo da API Open5e.

Repositório: [luigivieira/augmentedopen5e](https://github.com/luigivieira/augmentedopen5e)

---

## Principais Recursos

- **Busca Semântica**: Utiliza a API do Groq para processamento impulsionado por IA.
- **Suporte Multilíngue**: Suporta o cache de traduções em múltiplos locais.
- **Edge Native**: Construído especificamente para o Azion Edge Runtime.
- **Alta Performance**: Otimizado com estratégias agressivas de cache usando **Azion KV Storage** para estado centralizado e persistente.

---

## Organização do Código

O projeto segue uma estrutura moderna em TypeScript:

- `src/`: Lógica principal e handlers de eventos.
- `src/lib/`: Utilitários reutilizáveis e clientes de API.
- `src/api/`: Definições de endpoints (ex: `/spells`, `/languages`).
- `test/`: Testes unitários abrangentes usando Vitest.
- `azion/`: Arquivos de estado específicos por ambiente (`azion.json`).

---

## Implementação Técnica

O projeto aproveita recursos avançados do Azion Runtime para alcançar alta performance e baixa latência:

### 1. Estado Centralizado com KV Storage
O projeto utiliza o **Azion KV Storage** como um banco de dados centralizado. Essa infraestrutura é totalmente gerenciada pela plataforma Azion:
- **Leituras Locais**: A plataforma replica automaticamente os dados para os nós da edge mais próximos dos usuários.
- **Escritas Globais**: O código apenas grava no repositório; a Azion gerencia a propagação pela rede com **consistência eventual**.

```javascript
// Lendo do KV centralizado (Leitura local rápida)
const cachedResult = await Azion.kv.get(cacheKey);

// Gravando no KV centralizado (Replicação global)
await Azion.kv.put(cacheKey, JSON.stringify(data));
```

### 2. Processamento Assíncrono com `waitUntil`
A plataforma Azion permite que as funções continuem o processamento após o envio de uma resposta ao cliente através do `event.waitUntil()`. Isso é essencial para manter uma experiência ágil enquanto realiza tarefas de manutenção:

```javascript
async function handleRequest(event) {
  // 1. Lógica para resposta rápida
  const response = await fetchFromOrigin();

  // 2. Transfere manutenção para a plataforma
  event.waitUntil(updateCacheAndLogs(event));

  // 3. Responde imediatamente
  return response;
}
```
- **Gerenciado pela Plataforma**: O edge runtime mantém o contexto de execução vivo até que as tarefas assíncronas terminem.
- **Eficiência na Edge**: O processamento acontece na edge, evitando viagens de ida e volta desnecessárias para origens centrais.

---

## Fluxo de Desenvolvimento

### 1. Gerenciamento Moderno de Pacotes
O projeto utiliza o **pnpm** para um gerenciamento de dependências rápido e determinístico.

```bash
pnpm install
```

### 2. Emulação Local
Em vez de fazer o deploy na edge a cada alteração, o projeto usa o servidor local da Azion CLI:

```bash
pnpm emulate
```

**Persistência local de KV**: Ao emular localmente, os dados de KV são armazenados em `.edge/storage/` dentro da raiz do projeto, permitindo persistir dados entre reinicios sem custos remotos.

### 3. Manipulação de Ambiente
Chaves sensíveis (como a **Groq API Key**) são manipuladas via arquivo `.env.local`, que é automaticamente ignorado pelo Git.

---

## Estratégia de Deploy

O projeto utiliza uma configuração de ambiente dual (Staging e Production) definida em `azion.config.ts`.

- **Staging**: `pnpm deploy:staging` (cria recursos com o sufixo `-staging`).
- **Production**: `pnpm deploy:prod` (automatizado via CI/CD).

Os arquivos de estado `azion.json` são **comitados no repositório**, garantindo que a CLI sempre saiba quais recursos específicos atualizar, independentemente de qual desenvolvedor ou runner de CI esteja executando o deploy.

---

## Pipeline de CI/CD

O projeto inclui workflows do GitHub Actions para:

- **Linting & Formatação**: Garantindo a consistência do código.
- **Testes Automatizados**: Executando testes unitários com Vitest.
- **Validação de Cobertura**: Exigindo um mínimo de **90% de cobertura de testes** antes de permitir um deploy.
- **Deploy Automatizado**: Enviando automaticamente para staging em PRs e para produção em merges na `main`.

---

## Integração com VS Code

O projeto é otimizado para o VS Code, incluindo:
- **Linting Pré-configurado**: ESLint e Prettier para suporte a "formatar ao salvar".
- **Integração com TypeScript**: Segurança de tipos completa para o ambiente Azion Runtime.
- **Scripts Personalizados**: Acesso rápido a tarefas comuns da CLI via scripts do `package.json`.
