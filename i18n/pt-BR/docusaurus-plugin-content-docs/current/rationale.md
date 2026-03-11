import useBaseUrl from '@docusaurus/useBaseUrl';

# Racional: Redesenhando a Documentação do Azion Functions

:::info Sobre Autenticidade e Uso de Inteligência Artificial
Para garantir total transparência em relação ao meu processo de pensamento e decisões estratégicas, estou disponibilizando o <a target="_blank" href={useBaseUrl('/rationale-draft.pdf')}><strong>rascunho original e não editado deste racional (PDF)</strong></a>. 

Também estou incluindo uma <a target="_blank" href={useBaseUrl('/interaction-example.pdf')}><strong>exportação do registro de interação com a IA (PDF)</strong></a> para demonstrar como trabalhamos ativamente em pair-programming e refinamos a documentação juntos.

Embora eu utilize IA de forma extensiva no meu fluxo de trabalho como um acelerador - para formatar textos, gerar boilerplates de código e criar diagramas - a arquitetura central, as decisões estruturais e o rascunho original deste racional são inteiramente meus. A IA ajudou a organizar este documento final, mas o humano continua no comando.
:::

Bem-vindo ao racional por trás da proposta de documentação do **Azion Functions**. Esta página detalha meu processo de tomada de decisão para redesenhar o fluxo de onboarding, as melhorias arquiteturais de UX/UI da documentação, os trade-offs técnicos dos exemplos de código escolhidos e uma visão para o futuro da experiência do desenvolvedor (DevEx) na Azion.

:::tip Sobre "Experiência do Desenvolvedor" vs. "Documentação"
Embora este desafio seja focado no redesign da **Documentação** e na melhoria do fluxo de onboarding, a verdadeira Experiência do Desenvolvedor (DevEx) engloba muito mais - desde a ergonomia do SDK até a UI/UX do Console e os tempos de execução do CLI. Minha abordagem aqui é expandir os limites do que a documentação pode fazer, com o entendimento de que uma transformação holística de DevEx exige uma colaboração contínua e próxima com as equipes de Engenharia e Produto para alinhar os recursos da plataforma às expectativas dos desenvolvedores.
:::

---

## 1. Arquitetura de Informação e A Nova Narrativa

A documentação atual tenta mapear o modelo organizacional que a Azion usa no seu console (Build, Secure, Store, Deploy, Observe). No entanto, essa organização não é ideal para o aprendizado, especialmente para iniciantes. O redesign muda o foco para tornar a **Function** (Função) a entidade principal de onde tudo deriva.

### A Abordagem "A Função é a Estrela"
A jornada do desenvolvedor deve começar com o que faz a mágica acontecer: escrever código. A nova estrutura introduz conceitos de forma progressiva com base nisso:
1. **Overview (Visão Geral):** O que são as Edge Functions e o que elas fazem?
2. **Getting Started (Primeiros Passos):** Vitórias rápidas. Aprenda os pré-requisitos, escreva a função, configure a aplicação e teste em minutos. (Vídeos tutoriais curtos também foram incluídos para facilitar o funil do registro de conta até o primeiro deploy, focando em pessoas que aprendem visualmente).
3. **Development (Desenvolvimento):** A referência principal. Guias detalhados sobre a estrutura da função, argumentos, variáveis de ambiente, roteamento e requisições.
4. **Platform Integration (Integração com a Plataforma):** Unindo as peças ao introduzir instâncias, regras (rules), aplicações e workloads *nessa ordem*, demonstrando como eles constem sobre e reutilizam a função.

### Consolidando "Limits" e "API Reference"
Atualmente, os limites da plataforma aparecem de forma redundante em várias páginas, frequentemente ofuscando a navegação. Já que eles são cruciais, o ideal seria que vivessem diretamente dentro da UI do console - junto do consumo atual desses mesmos limites! Para a documentação, eles pertencem a uma página raiz única e dedicada. De maneira semelhante, a **Referência de API** é vital, mas não deve interromper o caminho principal de aprendizado; ela foi realocada para sua própria seção no menu principal para evitar confusões ("Por que há duas documentações?").

### Tópicos Avançados e Observabilidade
Tópicos como integrações com Sentry/Grafana, WebAssembly, ou IA Inference foram intencionalmente isolados em seções de "Advanced Topics" e "Observability". São mergulhos profundos (deep-dives) para usuários que já dominam o básico, mantendo a curva de aprendizado inicial mais suave.

---

## 2. UX e Melhorias de Usabilidade na Documentação

Uma parte significativa do meu esforço foi dedicada a refinar a experiência de leitura. A documentação atual sofre de trocas bruscas de contexto e de navegação oculta. Implementei diversas melhorias de UI/UX:

### Navegação Inteligente e Contexto da Barra Lateral
- **Correção de Links Internos:** Nos docs atuais, links internos costumam abrir novas janelas, o que eu considero disruptivo. O meu redesign assegura que todos os links internos permaneçam na mesma aba, preservando o histórico de navegação do navegador. Apenas links externos abrem em novas abas.
- **Barra Lateral Contextual:** A barra lateral (sidebar) agora serve como a âncora principal do usuário. Ela utiliza um leve tom laranja (da paleta da Azion) para todas as páginas "irmãs" e marcadores de alto contraste para as hierarquias ancestrais, respondendo instantaneamente à pergunta "Onde estou?".
- **Paginação em Destaque:** Os botões "Anterior" e "Próximo" foram movidos do final da página (onde ficavam ocultos embaixo de 'Limites') para o topo, logo abaixo dos *breadcrumbs*. O usuário agora sabe imediatamente que pode navegar sequencialmente antes mesmo de começar a ler.

### Breadcrumbs e Comportamento Responsivo
Estruturas profundas de documentação ou títulos longos frequentemente "quebram" os breadcrumbs em dispositivos móveis.
- Implementei reticências textuais (`...`) para a página ativa ou pros links intermediários para garantir que tudo caiba em apenas uma única linha.
- Caso o usuário venha a clicar ou tocar nesses links menores, os breadcrumbs expandem-se para um layout de múltiplas linhas com a hierarquia de leitura inteira.

### Atalhos de Teclado
Para *power users* em suas estações de trabalho:
- **`CMD/CTRL` + `Seta Esquerda/Direita`:** Navega instantaneamente entre as páginas anterior ou posterior. O recurso é visualmente comunicado usando pequenos ícones de teclado colocados do lado do título.
- **`CMD/CTRL` + `K`:** Abre a pesquisa global de busca, reproduzindo comportamentos e padrões de mercado.

### Glossários e Diagramas
- **Glossário Automatizado:** Acrônimos sempre travam o aprendizado de iniciantes. Por isso eu criei uma página de glossário que explica termos específicos do mundo da Azion juntamente com referências internas.
- **Arquitetura Visual:** Adicionei também diagramas gerados por IA para "Funções na Arquitetura da Plataforma" e no "Projeto Base Exemplo" para atender melhor aos chamados "visual learners".

---

## 3. O Projeto de Referência: Augmented Open5e

Para validar a documentação, eu criei o **[Augmented Open5e](https://github.com/luigivieira/augmentedopen5e)** - um projeto open-source que usa Edge Functions para traduzir as regras de D&D usando LLMs. A ideia era experimentar um caso de uso mais complexo das funcionalidades disponíveis na plataforma. Ele usa KV Storage, `waitUntil` (para processamento assíncrono em background), e a única razão pela qual não usa a AI Inference da Azion é porque encontrei problemas durante os testes. Isso serve como um bom lembrete para melhorar a experiência do desenvolvedor nesse ponto: as mensagens de erro devem indicar explicitamente o motivo técnico da falha de um modelo, em vez de sugerir vagamente que ele não existe ou não é permitido. Também iterei manualmente na interface do usuário deste projeto com base no feedback de colegas (por exemplo, ajustando as mensagens do indicador de progresso para a tarefa `waitUntil` em background para que gerenciem melhor as expectativas do usuário e não se assemelhem visualmente a mensagens de erro - especialmente porque a API retorna corretamente um `202 Accepted` indicando que o trabalho está em andamento).

### Trade-offs: Monolith Edge API vs. Micro-functions
Para a arquitetura do projeto, optei por uma **API Edge Monolítica** onde uma única função lida com todos os endpoints com base nas regras de roteamento da Azion e no caminho da requisição.
* **Prós:** Um único deploy, perfeita reutilização de código (autenticação, validação de JSON) e redução de "cold starts" gerais (um hit em `/api/monsters` aquece o V8 Isolate para um hit subsequente em `/api/spells`).
* **Contras:** O tamanho final do bundle fica um pouco maior.
* **Por que não Micro-functions?** Construir uma função separada para cada endpoint cria uma imensa sobrecarga de gerenciamento (dezenas de instâncias separadas no console e regras) e força a duplicação de bibliotecas.

*(Nota: Se a Azion introduzir triggers não-HTTP no futuro, como cron jobs, a arquitetura ideal separaria esses processamentos do Monolito HTTP).*

### Deploy via CLI vs. Onboarding no Console
Embora o projeto real utilize o Azion CLI, o "Primeiros Passos" da documentação guia intencionalmente os usuários através do Console. Para iniciantes absolutos, interfaces visuais proporcionam uma experiência de onboarding mais intuitiva e tranquilizadora. No entanto, a página "Desenvolvimento Local / Preview" foca diretamente em como fazer isso via CLI, e adicionar um tutorial de onboarding totalmente focado no CLI ali seria um ótimo próximo passo.

---

## 4. O Processo de Desenvolvimento e Auxílio da Inteligência Artificial

Como observado acima, a IA foi uma colaboradora poderosa.
- Eu arquitetei o código, mas a IA gerou ~90% dele sob minha revisão rigorosa, testes manuais e refinamento iterativo.
- A IA ajudou a formatar esta documentação, mas as decisões estratégicas (a narrativa "Função em Primeiro Lugar", descartar a estrutura antiga, implementar atalhos de teclado) foram inteiramente minhas.
- Apesar de ter usado a IA para gerar os diagramas, **todos os vídeos tutoriais foram criados inteiramente de forma manual** usando o OBS Studio com plugins no Mac para efeitos, e editados no Wondershare Filmora.

---

## 5. Visão de Futuro (A Lista "Se Eu Tivesse Mais Tempo")

Se este fosse um projeto de longo prazo em grande escala, aqui estão as iniciativas que eu priorizaria para elevar a Experiência do Desenvolvedor da Azion:

* **Feedback e Correções na Página:** Um mecanismo onde os usuários podem selecionar um texto e clicar em "Enviar Correção", gerando automaticamente um ticket com a página exata, o idioma e o parágrafo problemático.
* **Comentários da Comunidade:** Adicionar seções de comentários em nível de página (como a documentação tradicional do PHP) para suporte imediato ponto a ponto entre desenvolvedores.
* **Rolagem Inteligente da UI:** Rolagem automática da barra lateral para a visualização quando um usuário vai para uma página profundamente aninhada via pesquisa ou links diretos.
* **Filtros de Pesquisa Avanzados:** Implementar os filtros de pesquisa granulares que existem atualmente e funcionam muito bem na documentação original da Azion.
* **Foco em Exemplos de Reutilização:** Guias dedicados sobre como compartilhar/reutilizar corretamente funções e instâncias entre aplicações.
* **Recompensas e Vitrines Públicas:** Uma vitrine dedicada para projetos notáveis da comunidade, com badges/créditos para gamificar as contribuições.
* **Auditorias Rigorosas de Acessibilidade e Contraste de Cores:** Garantir labels ARIA adequadas e legibilidade perfeita para desenvolvedores com visão reduzida ou daltonismo.
* **Imagens de Fácil Manutenção:** Refazer os diagramas para separar os elementos visuais da camada de texto, removendo a dependência de geração via IA para correções simples de digitação ou localizações.
* **Mais Idiomas:** Expandir o suporte de idiomas para democratizar o acesso.
