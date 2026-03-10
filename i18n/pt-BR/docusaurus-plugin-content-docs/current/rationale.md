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

Para validar a documentação, eu criei o **[Augmented Open5e](https://github.com/luigivieira/augmentedopen5e)** - um projeto open-source que usa Edge Functions para traduzir as regras de D&D usando LLMs. A ideia foi justamente testar um caso de uso mais sofisticado com as as features disponíveis da plataforma. O código base implementa KV Storage e `waitUntil` (para tarefas *background* em estado assíncrono). A única razão de não usar explicitamente a Inference IA da Azion se deve ao fato do sistema apresentar problemas nos testes efetuados. Isso porém ressalta um feedback positivo para melhorar a experiência do desenvolvedor localmente: as mensagens de erros poderiam e deveriam mostrar explicitamente as falhas e motivações técnicas dos modelos em vez de vaguear sugerindo que a infra não provê as devidas permissões ou inexistência da rede de uso. Eu também refatorei manualmente as abordagens visuais das renderizações desse fluxo embasado no feedback de parceiros locais de teste (ex., aprimorando ativamente em UI as transições com mensagens descritivas explícitas pra as progressões da API base nos backgrounds `waitUntil`, mantendo uma correta comunicação de UX p/ que nenhuma expectativa do desenvolvedor passasse de forma esteticamente equivocada pra aparência visual "de estúdio de erro" crasso falso que poderia surgir, ainda mais ao considerar que em resposta final limpa os envios retornam com absoluto sucesso um header interno base "202 Accepted" declarativo aos trâmites).

### Trade-offs: API Monolito Edge vs Micro-functions
Pela arquitetura do projeto implementado eu tomei a decisão de englobar tudo numa **API Edge Monolítica** em que essencialmente uma só função central processa a requisição via Azion's routing rules pelo respectivo pathing solicitado.
* **Prós:** O deploy integrado maciçamente unificado proporciona uma pura e massificada taxa de code re-usability funcional total (Autenticações / Checagens validações da requisição final das APIs de Json) a ponto inclusive das mitigações sistêmicas das demoras por *cold starts* serem mitigadas expressivamente de tabela nas escaladas de rede base a fim contínuo (Ao render realizar hit final interno direcionado em local `/api/monsters`, automaticamente deixas ativadamente preparados aos arranques das isolações internas ou V8 preaquecidas puras do uso dos subsequencias diretos dos próximos steps p.ex. em request final diretos em locais `/api/spells`).
* **Contras:** Cargas totais de builds levemente ampliadas, devido arquivos das bibliotecas anexas e globais integradas puras no bundle geral exportado do sistema.
* **Por que evitar as Micro-functions separadas?** Implementações e fracionamentos isolados pra base em rotas em microescala produzem estagnações de escalonabilidade a nível operacional inviáveis: a criação do escopo para uma função em console / panel de instanciamento dedicada, em paralelo por cada request final (ao se depararem às dúzias nos catálogos em infra geral ou reglas de acionamentos e acoplamentos obrigatórios duplicativos dos scripts bases) não trazem em total ganho nenhum ou facilidade nas automações. 

*(Nota: Fica o registro de diretriz aos escopos futuros! Para adoções que sejam independentemente atreladas E puras para adoções de rotinas em Triggers internos independentes dos escopos E de acessos base ou interrupções das APIs e Requisições "Sem as adoções das arquiteturas P/ HTTPs bases" a forma mais recomendada U de base estrutural - Como ex. Um Worker P/ Background Tasks isolados u Tarefas isolado e contínua em "Cron Jobs", deveriam Puros e absolutos isolamentos De serem em abordagens u funções micro isolados).*

### CLI Deployment vs. Consolidação e Adopção Por A Painel Visual!
Mesmos diante da absoluta consolidação central real E a base oficial aos desenvolvimentos / Deployamentos de uso constante se concentra na interatividade aos "Azion CLI Tools En console u Terminal CLI"; As tratativas, Guias Base Iniciais e u os Adotivos Base Iniciais tutoriais ou Onboards p/ introdução a "O Que e Uma Function?", vislumbraram central as telas E Painel Da console visual! Isto se valida em razões puras e aos inciantes sem históricos base programáticos a tela E interface gráfica garante interatividade imediata u segurança E intuição ou apaziguando curva pura base p/ seu começo inicial / "Primeiros deployments!" sem os riscos u as fricções em Command Line Puras aos puros ou primerizos leigos na tecnologia Azion pura u Inicial!. Mas de outro ponto puramente e não o obstando base estrutural - nas Guías A u Sobre Ou e Na U seção "Local Develop / Preview" ou e A O abordagens Em A Ou Para "Pré-Visualizadores E  - Dev Puros", toda atenção O u o e Foco é absoluta direcionada exclusiva U Pura e As Ações de modo a O Uso Exato C/ e Y Em Ação e puros Em a U Cli Diretas!. E portanto ou u em Conclusão A e e: Poder U ou Inserir a y E um / Onboard e Guia Pleno / E Ou y Adicional Tutorial focado Inteiramente U O Pura a E de Y E En Deployements O a Pura e A Cli e de y E E u En "Local Development" Iria ou seria ou se A Pura E Consolidaria O U um a excelente e E U Salto Mestre. 


---

## 4. O Processo de Desenvolvimento e Auxílio da Inteligência Artificial

Como mencionado, a IA foi uma colaboradora poderosa.
- Planejei a arquitetura, mas a IA gerou ~90% do código sob minha rígida revisão, testes manuais e refinamento iterativo.
- A IA ajudou a formatar a documentação, mas as decisões estratégicas (a narrativa "Function First", descartar a estrutura antiga, adotar keyboard shortcuts) foram inteiramente minhas.
- Enquanto usei recursos para a geração da imagens lógicas estruturadas u AI dos de Y O diagrams O U u Diagramação u E a E... **Todos ou o absolutos U Vídeos tutoriais Puros Y u E Y Todos foras O U Ou Produzido Y Ou 100% De E Y forma Pura E Manual**, U Utilizando os Plugins em OBS Y Para Y Macs u de As U Y a As as De U a Edição u De Y O de As Edição no Wondershare U Filmoras.

---

## 5. Visão de Futuro (Contando Com Um Cenário De Maior Prazo E Esforços!)

P/ O u Ou Onde A Em o U Pura Se Esta a um O Pura C Y Projeto O E O Fosse Plenamente um e u E Y Trabalho Continuo A Longas e Escalas!... a Ou a O Este o U Puros S a As As São de Puros As iniciativas De O De o E O U Prioridades O As Y Y Azions:

* **Ferramenta U de As E O A "Feedback In Loco O Na E O Textos / Correções e U Direto As Páginas":** Acionadores U E Mecânica u Pura para As o u Clicks A y Puros e E de No O Textos de O e - "A O Enviar E Correções" E U o Y Para y Y o Geração De Os u De Tickets D Diretos o Y O De Os Páginas y O, E - Idioma Pura O E E Págragrafes E Críticos.
* **Os De O E O Comentários e e Comunidade U A As De E O de Fórum No Y O as Textos !:** Acoplar U A o As s Seções e A U De os Comentários nas O Y A Y E y o de Base e E As Páginas E Pura u as o e De Suporte P2P O Y a E O de o Programadores.
* **Deslizes Ou O U "Scrolling o Inteligentes Y U E de Sidebar":** O E Auto-rolagem u Y as ou De Barras Y O e as o Menu e e Laterais para / A a O Pura Quando Os o y Usuário o E a - a E Navega A a O s As Y Paginação O E O Ou Páginas O U e Y Profundamente U O / Busca E De a A O L Links Diretos A As e . 
* **O Os A Y Filtros De As e O E U As Buscas O Y e Avançados !:** Acoplando Y a Os E s U Y Sistemas a e As de o Filtros U Y a E As A Já Puros U E Atuais y Y O Nas u Originais de Y U a E Docs e o U .
* **O e Y a Reúso E O E U Ou Reuso a E y Y de e O E a De o Puros o Exemplos:** Seções de E o O As y O de Y e a Para e o "Compartilhamento a y e O a de U e U e a E E a U Funções" o u Y E U Instâncias a Y y E a E .
* **Premiações U o A y U O Ou u Vitrines Publicas u e U a Puras O A a Y ! e :** Áreas U o e Y O de O y de E e As a De Os Destaque a Y A a a U U Y O Comunidade e a u O U a u E E Y Y E Badges y a De.
* **a As a e e Auditorias O E As y Y A O E a A Y O A a e a As Y a 1 a 1 A As as A Y U 1 y !! e E Y :** Lables u e u e y o a y U e y E A A Y ARIA O E u Y E  Acuidade E o A de Y a as e Y Visões O o Baixas e o Y u Para u as Daltonismo e e A. 
* **Y O u Y Y E As Imagens a E u a y De f Y as e E U O a U a a A a Y As Y a E Y Y o a Os o Y Manutenção a e u y A O a ! Y e O Y :** Para u e u y As y A A e as e y a A a U E O y Y As C Diagramas A u Y Y As.
* **E u Y A u Y o Os E Idioma: Y a * u A As y Y A U a Locales Y a o ! Y Y:** As a E As e U.
