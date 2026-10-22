# Implementação Giz: web e Expo

Integração iniciada em 16/10/2026, com validações finais em 17/10/2026, baseada em `giz-handoff/README.md`, nos documentos do pacote e nos protótipos. A implementação mantém o frontend Next.js existente e acrescenta um modo explícito de feedback à API de simulados. O conteúdo editorial continua no repositório da API; as questões de exemplo dos protótipos não entram nos simulados reais.

Este registro distingue o que foi implementado do que ainda depende de contrato da API, validação em aparelho ou decisão de lançamento. Não é uma declaração de que todo o checklist de aceite está concluído.

## Decisões e divergências registradas

- **Redesenho da Início (21/10/2026, branch `giz/inicio-redesenho`):** sem trilha de navegação na raiz; três níveis de ação compartilhados (`.btn`, `SecondaryLink`/`.btn--more`, `ActionRow`/`.giz-action-row`, em `components/giz/ui.tsx` e `mobile/src/ui.tsx`); cartão de simulado inteiro como um link com tile da disciplina (`subjectOf` em `lib/gizTrack.ts` e `mobile/src/core/track.ts`); "Conheça o Giz" no rodapé do menu lateral e, no celular, no Eu. Tokens novos `--geo/his/mat/por/cie-bg/-ink` (contraste escuro conferido, mínimo 7,5:1) e medidas do protótipo em `layout`. **Regra de dados:** "Continuar de onde parou" só com ao menos 1 resposta salva; tentativa sem respostas volta a "Novo". **Divergências:** o protótipo `inicio.html` não estava no repositório, então valeu o texto do pedido; o `scripts/audit-giz-web.mjs` exige 56 px e acusa os alvos de 48 px pedidos (botão secundário, linha de ação no celular, "Conheça o Giz"); com o menu de 320 px, a grade de simulados tem 1 coluna entre 1024 e ~1300 px; nomes longos ("Língua Portuguesa") terminam em reticências no celular e no tablet; selo com padding 4 × 12 (escala) em vez de 4 × 10; título de seção e botão primário seguem os tokens h2/h3 (24 e 20 px no computador, em vez de 22 e 18). O Catálogo continua com o cartão anterior.
- **Redesenho da tela Simulados (22/10/2026, branch `giz/simulados-redesenho`, a partir de `giz/inicio-redesenho`):** os quatro filtros viram etapas (disciplina em cartões com ícone, ano em círculos, bimestre em pedras num caminho, avaliação em cartões), com visto verde no número e na opção, toque de novo para tirar e o ano sempre preenchido; chips removíveis e "Limpar escolhas" só quando há algo a limpar; grade de 6 em 6 com "Mostrar mais"; sem trilha de navegação (`AppShell topLevel`); "Monte seu simulado" deixa de ser link. No celular, fileira rolável de disciplinas e painel inferior (`Modal sheet` em `components/giz/ui.tsx`; `StepsSheet` no Expo). As regras ficam em `lib/gizCatalog.ts`, espelhadas em `mobile/src/core/catalog.ts` e conferidas por `tests/giz-catalog.test.ts`; a Início passou a usar o mesmo estado por simulado. **Dados:** os cartões usam `discipline`, `bimester`, `assessment` e `totalQuestions`; `/me/attempts` já devolvia `correctCount` (só faltava no contrato) e "N de 30 respondidas" conta as respostas salvas, como a Início. Escolhas na URL (`?d=geografia&ano=4&b=2&a=1`), nunca a busca; o "Voltar" do detalhe volta com elas. **Divergências:** a trilha Kids inclui a Educação Infantil quando há simulados (pílulas "4 anos" e "5 anos"; sem bimestre e avaliação, que são prova única); Escola mostra do 6º ano à 3ª série e Técnico só a disciplina. O ano inicial vem da turma; sem turma, 3º ano na Kids e o primeiro ano com simulados nas outras trilhas. A etapa 1 lista as disciplinas do ano escolhido (ano sem conteúdo usa as do ano inicial), não cinco fixas; disciplinas sem cor própria usam o tile neutro. Dentro de cada grupo de estado, os simulados da turma vêm primeiro e levam "Da sua turma" na linha do período. A busca também olha o título e ignora acentos. As etapas 2 a 4 ficam lado a lado a partir de ~900 px de painel (~1270 px de tela) e empilhadas abaixo disso; a etapa 1 tem 6 colunas a partir de 720 px de painel. Medidas sem token equivalente seguem a escala: ano e nome de disciplina 16 px (17), nome de disciplina no celular e "1ª avaliação" 12 px (13), contagem 18 px no celular e 24 px no computador (20 e 22), título das etapas 18/24 no celular, raio do cartão de avaliação 12 px (16), véu `--overlay`. Visto branco usa o token novo `on-ok` (4,1:1 sobre `ok`). O selo "Concluído" ganhou visto de 14 px também na Início. Anos (44 px) e botões secundários (48 px) seguem o pedido; o `audit-giz-web.mjs` (56 px) os acusa. No Expo, o desenho do celular vale em todas as larguras (grade de 2 ou 3 colunas no tablet e no computador) e as escolhas não vão para a rota. **Conteúdo:** Matemática do 3º ano, 1º bimestre, AV2, tem 29 questões (as demais têm 30); fica com o responsável. Evidências: [antes](validacao/simulados-antes-1440.png) e [depois](validacao/simulados-depois-1440.png) em 1440 px, [antes](validacao/simulados-antes-390.png), [depois](validacao/simulados-depois-390.png) e [painel](validacao/simulados-depois-painel-390.png) em 390 px.
- **Aceite web E07 (19/10/2026):** tema claro fixado desde o HTML e seletor de tema oculto até conferir o escuro tela a tela. Correções de foco do convite, alvos de toque, texto ampliado e tamanho do Tuca no perfil. Evidências, comandos e roteiro manual de leitor de tela em [aceite web](validacao/aceite-web-2026-10-19.md).

- **Trilhas (decisão do responsável em 19/10/2026, etapa E01):** as três trilhas estão liberadas. **Giz Kids** reúne a Educação Infantil (`schoolYear` -1 e -2) e o Fundamental I (1–5), com o Tuca; **Giz Escola** reúne o 6º ano à 3ª série do Médio (6–12); **Giz Técnico**, os cursos técnicos (0). A trilha só muda a cor de destaque (`--track-accent`, de `color.trilha` nos tokens) e a presença do Tuca. A classificação fica em `lib/gizTrack.ts` (web) e `mobile/src/core/track.ts` (Expo); um teste garante que as duas concordam.
- **Mensagens de resultado:** os cortes foram confirmados pelo responsável em **80% e 50%** de acertos: “Mandou bem!” a partir de 80%, “Bom caminho!” a partir de 50%, “Vale tentar de novo!” abaixo disso. O total vem das questões da tentativa, sem assumir as cinco questões fictícias do protótipo. A nota percentual e a regra de pontuação do servidor são preservadas.
- **Ranking:** os pontos fictícios do protótipo foram substituídos pela **média percentual real** retornada pela API. Continuam valendo a melhor tentativa por simulado, a quantidade mínima e a turma definidos pelo backend. Não foi criada regra de “pts”.
- **Feedback durante a questão:** novas tentativas solicitam `immediateFeedback: true`. A API confirma, corrige e libera a resposta correta daquela questão, Dica de Ouro para erro/branco ou curiosidade para acerto. A web e o Expo aguardam essa resposta antes de apresentar a correção. Tentativas anteriores mantêm o modo legado e a correção ao concluir. A solução nunca é inferida pelo cliente.
- **Rotas:** foram preservadas as rotas Next existentes de autenticação e execução. Resultado e revisão usam parâmetros na rota da tentativa; não foi exigida uma migração de URLs para os caminhos sugeridos no handoff.
- **Landing:** está em `/sobre`, fora da navegação do app. O CTA centralizado aponta para `/simulados`. Não há preços, planos, depoimentos, contagens de usuários ou prazos inventados. O pequeno cartão de questão é identificado como exemplo ilustrativo.
- **Marca e publicação:** não houve publicação, troca de domínio, cadastro em loja ou deploy. A checagem de marca, domínio e nomes em lojas continua pendente com o responsável. Os identificadores nativos são provisórios de desenvolvimento/interno.

## Rotas web

| Tela | Rota implementada | Observações |
|---|---|---|
| Entrar | `/login`, alias `/entrar` | Validação, mostrar senha, retorno local seguro após autenticar. |
| Criar conta | `/registro` | Preserva convite/retorno; primeiro acesso passa pela trilha quando aplicável. |
| Recuperar senha | `/recuperar-senha` | Mensagem genérica; usa o serviço existente de recuperação da API. |
| Redefinir senha | `/redefinir-senha` | Consome o token de recuperação e envia a nova senha pelo BFF. |
| Trilha | `/trilha` | Kids, Escola e Técnico; sem trilha escolhida, início e catálogo levam para cá. Troca pelo perfil (exceto quem entrou por convite de turma). |
| Início | `/` | Catálogo real, tentativa em andamento, números e último resultado. |
| Catálogo | `/simulados` | Escolha em quatro etapas (disciplina, ano, bimestre, avaliação) combinadas com E, busca, chips removíveis e escolhas na URL; 6 resultados por vez. |
| Detalhe | `/simulados/[id]` | Quantidade real de questões, estimativa de tempo, cronômetro e tentativas. |
| Execução | `/simulado/[simulationId]` | `attemptId` retoma uma tentativa específica; `timer=0` ou `timer=1` inicia com a opção escolhida. |
| Resultado | `/simulado/[simulationId]?attemptId=...&view=result` | Busca a tentativa existente, sem iniciar outra. |
| Revisão | `/simulado/[simulationId]?attemptId=...&view=review` | Filtros Todas/Erradas/Em branco e índice de questões. |
| Histórico | `/historico` | Ordenação por data/nota, filtro de disciplina e abertura da tentativa correta. |
| Ranking | `/ranking` | Seletor de turma, pódio/vizinhança retornados pela API; Geral “Em breve”. |
| Perfil | `/eu` | Conquistas reais, preferências, histórico, saída e entrada para painel dos pais. |
| Painel dos pais | `/pais` | Somente entrada “Em breve”; o painel e a barreira de adulto não estão liberados. |
| Montar simulado | `/simulados/novo` | Somente entrada “Em breve”; não fabrica simulados. |
| Prática | `/pratica`, `/quizzes`, `/quiz/[quizId]`, `/quizzes/historico`, `/progresso`, `/colecao` | Quizzes, XP, missões, habilidades e coleção dentro do layout Giz, com submenu próprio (E05, decisão de 19/10/2026). `/aprender` redireciona para `/pratica`; `/esqueci-senha`, para `/recuperar-senha`. Membros de turma não recebem entrada para a Prática. |
| Divulgação | `/sobre` | Página independente com FAQ e CTA para o catálogo. |
| Convite existente | `/convite` | Fluxo preservado e integrado à identidade visual. |

O app web usa quatro itens de navegação: Início, Simulados, Ranking e Eu. A Prática fica sob Início (cartão no Início e link em Eu), sem quinto item. Telas de fluxo ocultam a navegação inferior. Histórico destaca Eu na navegação.

## Fundação e arquivos principais

- Fonte dos tokens: `giz-handoff/tokens/tokens.json`; `tokens.css` do handoff é a referência original; as cores e medidas em produção são geradas diretamente do JSON, mantendo web e Expo sincronizados. Medidas de layout adicionais foram centralizadas na fonte dos tokens.
- `npm run tokens:generate` gera `app/giz-tokens.css` e `lib/gizTokens.generated.ts`.
- O mesmo `npm run tokens:generate` também executa `scripts/generate-giz-mobile.mjs`, gerando tokens e SVGs empacotados em `mobile/src/generated/`, a partir do mesmo handoff.
- Fontes web: Fredoka e Nunito por `next/font/google`, com `display: swap`. O aplicativo Expo empacota os TTFs e suas licenças OFL.
- Assets web: `public/giz/{brand,tuca,icones,ilustracoes}`. Os logotipos claro/escuro usam os SVGs aprovados.
- Componentes comuns: `components/giz/ui.tsx`; estilos globais e específicos das telas consomem variáveis do design system.
- Execução: `components/SimuladoRunner.tsx`, `components/giz/QuestionAnswers.tsx`, `components/giz/RunnerResult.tsx` e `lib/gizRunner.ts`.
- Descoberta: `HomeScreen`, `CatalogScreen`, `SimulationDetail`, `DiscoveryCards`, `TrailScreen` e `useCatalog`, em `components/giz/`.
- Acompanhamento: `components/HistoricoList.tsx`, `components/RankingView.tsx` e `components/giz/Profile.tsx`.

Há foco visível, foco nos títulos de entrada, estados de lista, ícones/texto para os estados de resposta, respeito a movimento reduzido e áreas seguras. A fonte usa unidades relativas para permitir ampliação. A navegação e os cabeçalhos tratam o texto ampliado sem reduzir o tamanho solicitado pelo usuário.

## Contratos e limites da API

A web passa pelo BFF em `/api/auth/*` e `/api/backend/*`. Credenciais de autenticação não são expostas no JSON do navegador; o fluxo existente de sessão/cookies é preservado. A prova nativa usa sua sessão própria com refresh protegido no SecureStore e acesso em memória, sem reaproveitar cookies do navegador.

| Necessidade | Contrato atual | Tratamento na interface |
|---|---|---|
| Catálogo | `GET /simulations/available` | Lista real; filtro pela trilha escolhida no cliente. |
| Iniciar/retomar | `POST /simulations/:id/attempts` com `{immediateFeedback:true}`, `GET /attempts/:id`, `GET /attempts/:id/questions` | Preserva IDs e política; recupera respostas/feedback confirmados do servidor. |
| Responder | `POST /attempts/:id/questions/:questionId/answer` com `{ answer }` | Quatro tipos; confirmação imutável e idempotente no modo novo. Em branco/timeout é `{}` no servidor e `-1` local. Um `409` recupera a confirmação que prevaleceu no servidor. |
| Concluir/rever | `POST /attempts/:id/finish`, `GET /attempts/:id/result` | Modo novo inclui opções e gabarito do snapshot, tema por questão, `topics` e `unclassifiedQuestions`; legado mantém degradação compatível. |
| Histórico e números | `GET /me/attempts`, `GET /me/pontuacao` | Datas, notas e médias reais; sem tempo fictício em tentativas antigas. |
| Ranking | `GET /me/turmas`, `GET /me/turmas/:id/ranking` | Respeita mínimo, pódio e vizinhança da API. Sem inventar uma lista completa que o endpoint não devolve. |
| Conquistas | `GET /me/achievements` | Usa títulos, progresso e critérios do serviço; não replica conquistas fictícias do HTML. |
| Recuperação | `POST /auth/forgot-password`, `POST /auth/reset-password` | BFF web com validação, resposta sem cache e erros recuperáveis. O envio real depende do serviço da API. |

O modo novo da API guarda snapshots privados no início da tentativa. Nenhum gabarito é liberado para questões ainda não confirmadas. O feedback confirmado pode ser restaurado em outro aparelho, prevalece sobre cache local e destaca a alternativa correta mesmo em erro/branco, incluindo os mapas dos tipos compostos. A finalização é idempotente e confirma questões restantes como branco. Alterações editoriais posteriores não modificam a correção ou a nota dessa tentativa.

O resultado usa os temas cadastrados editorialmente e mostra quantas questões estão sem tema. Não há classificação automática de conteúdo. Resultados legados sem opções/gabarito/temas continuam sendo exibidos sem preencher lacunas com dados fictícios.

**Dependência de instalação:** aplicar primeiro a migration `20261017120000_simulation_immediate_feedback`, depois a API compatível e então web/Expo. O campo opt-in pode ser recusado por uma API anterior. Não foi aplicada migration em nenhuma base existente. Contrato e ordem operacional: [guia da API](../../../simulados-bernardo-api/docs/guia-feedback-giz.md) e [ADR 016](../../../simulados-bernardo-api/docs/decisions/016-feedback-confirmado-de-simulado-giz.md).

Limites que continuam abertos:

1. **Tempo:** o tempo médio aparece somente quando há registro local completo da tentativa. Tentativas antigas sem esses dados mostram indisponibilidade.
2. **Ranking geral/períodos:** não há endpoint correspondente para os números do protótipo. Geral está como “Em breve”; não se simulam pontos ou períodos Semana/Mês.
3. **Pós-MVP:** painel dos pais e montagem de simulado dependem de trabalho posterior e das decisões do responsável (E11).

Respostas de crianças no ranking aparecem com primeiro nome e inicial do último nome, sem foto; a própria linha informa “(você)”. Os snapshots de execução são separados por usuário e tentativa, com fila de envio quando a conexão retorna. Se o armazenamento falhar, a interface não afirma que o progresso está salvo para uso offline.

## Expo: escopo e execução local

O responsável confirmou Expo. A implementação nativa está em `mobile/`, usando a infraestrutura de sessão existente e componentes React Native; não é um empacotamento do site em WebView. As telas MVP e a integração nativa foram implementadas. TypeScript, testes de unidade/UI e exportações Android/iOS passaram; a execução física e a validação nativa completa contra um ambiente da API seguem pendentes.

Rotas implementadas:

| Área | Rotas Expo |
|---|---|
| Entrada e autenticação | `/`, `/recovery`, `/entry` |
| Trilha/descoberta | `/track`, `/simulations`, `/detail/[id]` |
| Acompanhamento | `/history`, `/ranking`, `/profile` |
| Entradas futuras | `/parents`, `/create` |
| Execução/revisão | `/simulation/[id]?attempt=...&timer=0\|1`, `/result/[attemptId]`, `/review/[attemptId]` |

Configuração local (veja os detalhes em `mobile/README.md`):

```bash
npm --prefix mobile ci
cp mobile/.env.example mobile/.env
# Edite as duas origens públicas abaixo no arquivo local.
npm run mobile:start
```

- `EXPO_PUBLIC_API_URL`: origem da API acessível pelo dispositivo. `localhost` de um telefone não é o computador de desenvolvimento.
- `EXPO_PUBLIC_WEB_ORIGIN`: origem web esperada para validar links de convite/recuperação.
- `MOBILE_APP_ENV=development`: configuração local. O modo interno exige origens HTTPS válidas.
- Nenhum JWT, senha ou chave de e-mail deve entrar em variáveis `EXPO_PUBLIC_*`.
- Links sensíveis são validados pela origem e pelo formato esperado e mantidos em memória; não entram como parâmetros persistentes do navegador nativo.
- Os identificadores/esquemas de desenvolvimento são provisórios e separados da prova nativa existente para evitar sobrescrevê-la. Sua existência local não autoriza publicar a marca em lojas.
- O tema nativo começa em claro. A liberação de escuro depende de avaliação visual e de acessibilidade no aparelho.

O runner nativo possui integração de estado/cache por usuário e tentativa em `mobile/src/simulation/`, com resultado, revisão e journal de dois checkpoints para preservar a última gravação íntegra. Executar o bundle Expo ou exportar JavaScript não equivale a testar um binário Android/iOS em aparelho.

## Temas editoriais — pacote de três lotes (22/10/2026)

História, Geografia e Arte/7º ano receberam 720 temas em 24 simulados, com vocabulários fechados e preservação dos campos anteriores. História (api#251) e Geografia (api#252) já foram integradas; Arte (api#253) aguarda revisão. A composição dos três lotes foi validada sem conflitos: 7.709/23.444 questões com tema e 257/780 simulados completos. A E04 segue parcial. Cobertura, verificações, issues de revisão pedagógica e próximos lotes estão no [registro do pacote](validacao/temas-7ano-historia-geografia-arte-2026-10-22.md).

## Evidências de validação e aceite pendente

Validação registrada nesta implementação:

- `npm run build` web aprovado: todas as rotas compiladas.
- Expo: TypeScript aprovado, **65 testes de unidade e 25 testes de UI aprovados**; bundles Hermes Android e iOS exportados com fontes e assets locais. Esses bundles não são APK/IPA e não comprovam execução em aparelho.
- O link temporário de dependências foi removido. Uma instalação própria de 850 pacotes passou com `npm ci --offline --ignore-scripts --no-audit --no-fund`, usando o lockfile do app; as validações finais foram repetidas com essa instalação independente. Em uma nova máquina, use `npm ci --prefix mobile`.

- **45 testes automatizados aprovados, incluindo subcasos**, após incluir verificação de contraste e o contrato de feedback: sessão/renovação, destinos locais seguros, senha, preferências, restauração/cache de respostas e pares de cores. O comando reproduzível é `npm test`.
- TypeScript web executado com `npx tsc --noEmit` durante a integração.
- Playwright com APIs controladas: **25 verificações de descoberta** e **15 combinações de histórico/ranking/landing** nos tamanhos 360, 390, 768, 1024 e 1440 px. Foram conferidos overflow, imagens ausentes, erros de execução e interações relevantes.
- Histórico: filtro/ordenação, abertura do resultado correto, vazio, erro e nova tentativa de carregamento. Ranking: turma, privacidade e Geral indisponível sem requisição fictícia.
- Runner: quatro tipos de questão, teclado A–D/Enter, foco, modal/Esc, pausa de cronômetro, timeout em branco, retomada após recarregar, fila offline/sincronização e filtros de revisão.
- Fonte ampliada a 200%: verificações de layouts; o overflow encontrado no título de detalhe foi corrigido com quebra de palavra no cabeçalho. Os testes com mocks não substituem a integração contra a API real.
- API compatível: **702 unitários e 410 testes reais em 23 suítes Nest/PostgreSQL aprovados**, além de lint, TypeScript, build e Prisma validate. A cadeia de 15 migrations passou em PostgreSQL 16 descartável, incluindo preservação de registros legados. Não se usou uma base existente.
- Jornada real web/BFF/API/PostgreSQL: login, catálogo/detalhe, erro e acerto com feedback, retomada, resultado por tema/sem tema e revisão com gabarito aprovados em Chromium, com conferência a 390 e 1440 px. O PostgreSQL e os dados foram criados só para essa prova.
- Novo fluxo em APIs controladas: gabarito após confirmação, foco, timeout/branco, fila offline até sincronizar, mapas, conflito 409, retomada, temas, revisão por link direto e fallback legado; sem overflow entre 360 e 1440 px. Os mapas de execução/revisão também passaram com 30 células, índices de dois dígitos e texto em 200%: símbolos/legendas visíveis, sem overflow e alvos mínimos preservados.
- Contraste: **26 pares de cores** verificados automaticamente. A validação completa com leitor de tela e em dispositivos continua separada.
- `npm run lint` foi configurado sem interação, com ESLint 8.57.1 e `eslint-config-next` 14.2.35, compatíveis com o Next instalado. O comando inclui as fontes web, testes, scripts e contratos compartilhados e exige zero avisos. As imagens SVG usam `next/image` com dimensões intrínsecas; o efeito de perfil usa dependências explícitas. Veja [LINT.md](LINT.md).

Pendente de conclusão/evidência:

- Execução Android/iOS em aparelho/emulador, toque, safe areas, texto a 200%, leitura por tecnologia assistiva e comportamento ao ir ao fundo/retornar.
- Verificação manual por leitor de tela na web (NVDA/VoiceOver/TalkBack conforme ambiente) e aceite visual final com o responsável.
- Validação de recuperação e conquistas contra o ambiente autorizado da API, entrega real de e-mail e jornada nativa completa de sessão. A autenticação web do percurso de simulado foi validada com a API real descartável.
- Temas editoriais ainda não cadastrados, decisões de marca, domínio, loja e política de público infantil.

Nada neste documento marca como concluído um item dependente dessas verificações ou de ativação em ambiente real.
