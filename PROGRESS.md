# Estado do Projeto — simulados-bernardo

> Atualizado em: 2026-10-13
> Atualizar este arquivo ao concluir cada feature ou iniciativa relevante.

## Situação consolidada

Os **lotes 01–10 estão implementados e integrados à `main`**. O frontend legado de simulados já estava integrado à API e em produção, com seleção, realização, resultado, histórico e ranking de turma. A evolução acrescentou quizzes, Aprender hoje, missões/XP, coleção, progresso/revisão, acompanhamento por vínculo e recuperação de senha. **Não houve deploy dos novos lotes durante este trabalho**, migration/importação em banco existente ou publicação editorial.

O lote 10 foi integrado em 13/10/2026 nas PRs [API #213](https://github.com/guilhermeborba/simulados-bernardo-api/pull/213) e [web #45](https://github.com/guilhermeborba/simulados-bernardo/pull/45). CI aprovada: [API](https://github.com/guilhermeborba/simulados-bernardo-api/actions/runs/38438311892) e [web](https://github.com/guilhermeborba/simulados-bernardo/actions/runs/38439597355). O [plano canônico da evolução](https://github.com/guilhermeborba/simulados-bernardo-api/blob/main/docs/superpowers/plans/2026-10-12-evolucao-quizzes-gamificacao-mobile-plan.md) fica no repositório da API; a próxima tarefa é o **lote 11 — prova e planejamento mobile**. Lotes 11 e 12 ainda não foram iniciados.

## Entregas por lote

| Lote | Entrega consolidada | Situação |
|---|---|---|
| 01 | Renovação e logout isolados por sessão, incluindo requisições concorrentes | Implementado; [PR web #39](https://github.com/guilhermeborba/simulados-bernardo/pull/39), ADR 006 |
| 02 | Inventário editorial, regressão com Next/API/PostgreSQL, CI e fontes locais | Implementado; [PR web #40](https://github.com/guilhermeborba/simulados-bernardo/pull/40), guia de CI |
| 03 | Modelo aditivo de quiz, versões, autorização e snapshots privados | Implementado na API |
| 04 | Confirmação, correção no servidor, feedback e finalização idempotente | Implementado na API |
| 05 | Catálogo inicial e mídia acessível; ilustrações modernizadas para Infantil | Implementado/preparado na API; revisão editorial pendente |
| 06 | Catálogo/runner web de quizzes, retomada, resultado, histórico e preferências da conta | Implementado; ADR 007 |
| 07 | Aprender hoje, missões semanais e XP persistidos | Implementado; ADR 008; curadoria das missões pendente |
| 08 | Coleção pessoal, cinco conquistas, seis itens e personalização | Implementado; ADR 009 |
| 09 | Progresso por habilidade e prática de revisão separada | Implementado; ADR 010; revisão das habilidades/classificações pendente |
| 10 | Acompanhamento por vínculo e recuperação com Resend | Implementado; ADR 011; envio real pendente |
| 11 | Prova técnica e planejamento mobile | Não iniciado |
| 12 | Implementação do app e beta | Não iniciado |

A jornada de quizzes contempla **15 faixas** desde o desenho inicial: Infantil de 4/5 anos, 1º ao 9º ano, três séries do Médio e Técnico em Enfermagem. Catálogos vazios permanecem vazios até haver conteúdo publicado e autorizado.

## Validação atual

Os totais abaixo são os da validação final do lote 10; os números nas seções históricas correspondem ao fechamento de cada lote e não devem ser somados.

| Verificação | Resultado final |
|---|---|
| Web: TypeScript e build de produção com fontes locais reais | Passou |
| Web: isolamento de sessão/cookies | 30 testes passaram |
| Web: HTTP Next/BFF/Nest/PostgreSQL | 48 casos em 6 suítes passaram |
| Web: Chromium desktop/mobile emulado, teclado e axe | 78 testes passaram |
| API: unitários | 688 testes em 39 suítes passaram |
| API: integração real Nest/PostgreSQL | 395 casos em 21 suítes passaram |

O workflow web fixa o commit compatível da API `e0b19669723de7d67c778fcc08a3f300b0003fa1`. Consulte o [guia de CI e regressão](docs/guia-ci-regressao.md) para os comandos, isolamento do banco e limites. Emulação mobile e axe não comprovam funcionamento em aparelhos Android/iOS físicos, Safari, leitores de tela ou usabilidade com pessoas.

## Pendências de ativação e revisão

| Frente | Estado e próximo passo |
|---|---|
| Quizzes | 45 quizzes e 213 perguntas com revisão `PENDING`; revisar e publicar explicitamente |
| Habilidades | 45 habilidades e 213 classificações de perguntas `PENDING`; revisar antes de publicar o conteúdo associado |
| Missões | 30 rascunhos `PENDING`, dois por faixa; curadoria e publicação pendentes |
| Revisão humana | O responsável pelo projeto assumiu a revisão em 13/10/2026, incluindo Infantil e Enfermagem; atribuição não significa aprovação |
| Recuperação de senha | Resend integrado, desativado por padrão na API; configurar chave, remetente verificado, URL pública e habilitação fora do chat; validar entrega real |
| Limites de recuperação | Os 20 pedidos/minuto por endpoint usam o IP imediato da API; usuários do mesmo BFF compartilham o orçamento. Definir política real de proxy/perímetro antes de ampliar uso |
| Usabilidade/acessibilidade | Avaliar com pessoas de cada segmento, leitores de tela e aparelhos físicos, incluindo as pausas legadas de Infantil após a 10ª/20ª questão |
| Publicação técnica | Planejar migrations e deploy da API compatível antes da web, no processo de implantação autorizado |
| Mobile | Executar o lote 11 para produzir prova técnica e plano; framework e app/beta do lote 12 ainda não foram definidos/implementados |

## Funcionalidades implementadas

| Área | Comportamento atual no código |
|---|---|
| Simulados | Seleção por trilha/ano/bimestre/AV, quatro tipos de questão, cronômetro e navegação por faixa, pausas entre rodadas no Infantil, retomada, resultado, histórico, pontuação/ranking e convite de turma |
| Autenticação e BFF | Cookies httpOnly, renovação coordenada por sessão, proteção de rotas e prevenção de respostas/cookies atrasados após troca de conta ou logout |
| Apresentação | Faixas lúdica/jovem/exame, Bolinha no Infantil e cinco famílias WOFF2 locais com licença OFL |
| Quizzes | `/quizzes`, `/quiz/:quizId` e `/quizzes/historico`: filtros, uma pergunta por vez, seleção editável até confirmar, feedback da API, retomada e histórico separado de simulados |
| Preferências e mídia | Filtros/áudio/movimento dos quizzes salvos por conta na API; SVG/WAV pelo BFF, descrição/transcrição em falha e áudio opcional. Trilha legada de simulados permanece em localStorage |
| Aprender hoje | Quiz em andamento, saldo de XP, duas posições de missão por semana/faixa/turma, próxima atividade e sugestões; recompensas calculadas no servidor |
| Coleção | `/colecao`: seis itens, cinco conquistas, critérios e personalização persistida; itens bloqueados não podem ser selecionados |
| Progresso/revisão | `/progresso`: primeiras respostas, repetições e revisões separadas; revisão selecionada pela API sem XP/missão/itens; evidência inicial não declara domínio |
| Acompanhamento | `/acompanhamento`: responsáveis por vínculo atual; professores por turma atribuída; ADMIN por autorização. Simulados e prática ficam separados, sem responder em nome do aluno |
| Recuperação | `/esqueci-senha` e `/redefinir-senha#token=...`; token removido da URL e mantido em memória, consumo por POST, sem login automático, com revogação das sessões anteriores pela API |
| CI | Tipos, sessão, build, HTTP integrado e Chromium desktop/mobile emulado com teclado/axe em PostgreSQL descartável |

XP de prática: **10 por quiz lógico por dia, até 50 XP/dia**, usando America/Sao_Paulo. Revisões não concedem recompensas e missões não acrescentam bônus de XP no piloto. Recompensas não alteram notas ou ranking de simulados.

## Infraestrutura e decisões

- **Backend:** `BACKEND_API_URL` no servidor web (local: `http://localhost:3333`); conteúdo e correção vêm da API.
- **CI:** [workflow web](.github/workflows/ci.yml), com API fixada em commit compatível e banco/dados sintéticos descartáveis.
- **Deploy:** simulados legados registrados como em produção; publicação dos novos lotes não foi executada neste trabalho. Preview local não confirma deploy.
- **Testes:** `npm run typecheck`, `npm run test:auth`, `npm run build`, `npm run test:e2e` e `npm run test:browser`. `.test-build/` e artefatos de navegador são ignorados pelo Git.
- **Decisões:** [ADRs](docs/decisions/) registram BFF, sentinelas de ano, trilha legada, renovação, quizzes, missões, coleção, progresso e acompanhamento/recuperação.

Referências da navegação legada: [faixas visuais — PR #25](https://github.com/guilhermeborba/simulados-bernardo/pull/25), [cronômetro — #26](https://github.com/guilhermeborba/simulados-bernardo/pull/26), [retomada/histórico — #27](https://github.com/guilhermeborba/simulados-bernardo/pull/27), [trilhas/Técnico — #30](https://github.com/guilhermeborba/simulados-bernardo/pull/30), [convites — #32](https://github.com/guilhermeborba/simulados-bernardo/pull/32), [catálogo da API — #33](https://github.com/guilhermeborba/simulados-bernardo/pull/33), [ranking — #34](https://github.com/guilhermeborba/simulados-bernardo/pull/34) e [Infantil — #36](https://github.com/guilhermeborba/simulados-bernardo/pull/36).

As seções abaixo preservam os detalhes de entrega e validação histórica. Limitações temporárias, como o build de fontes do lote 01, devem ser lidas com sua resolução posterior.

---

## Histórico detalhado — lote 01: correção de sessão

Renovação compartilhada somente por hash do refresh token, com retenção curta e proteção de requisições já em andamento. Falhas temporárias preservam cookies; logout invalida o coordenador antes de revogar a sessão na API e impede regravar tokens na resposta pendente. O estado local do usuário é limpo mesmo em falha de logout.

**Validação no fechamento do lote 01:** `npm run test:auth` passou 25 testes. Smoke HTTP nas rotas Next compiladas confirmou duas contas independentes, um refresh para chamadas da mesma sessão entre rotas e logout concorrente, incluindo cookies HttpOnly/Secure/SameSite. Build completo passou com fixture temporária de fontes locais; build comum falhou no loader Google Fonts de Source Serif 4 em código não alterado. O download real não foi validado; o build com fixture não é um artefato para deploy.

[ADR 006 — Renovação isolada por sessão](docs/decisions/006-renovacao-isolada-por-sessao.md) registra o estado do lote 01: coordenação local a um processo e access JWT válido até expirar. O lote 10 passou a verificar papel/status/versão no banco e bloquear o access anterior no próximo uso após reset. Definir coordenação/recuperação antes de ampliar réplicas do BFF. Não houve deploy.

---

## Histórico detalhado — lote 02: inventário, regressão e CI

No lote 02, GitHub Actions passou a executar instalação pelos lockfiles, checagem de tipos, testes de sessão, build normal e regressão HTTP com o servidor Next de produção, BFF, Nest e PostgreSQL real descartável. A API foi fixada inicialmente no commit público `8f1b47b0708e23d6876cd15d1374b0f45e8e4768` da `main`, com rotação de refresh já integrada. A revisão atual de contratos é identificada pelo `ref` no workflow. Nenhum seed editorial ou banco existente é utilizado.

**Validação no fechamento do lote 02:** `npm run typecheck`, 25 testes de sessão, build normal e 8 jornadas HTTP passaram, inclusive contra o commit exato da API usado na CI. As jornadas verificam registro/login, convites, catálogo por faixa/turma, quatro tipos de questão, início/retomada, edição, conclusão, resultado/histórico, acesso entre contas e cookies de sessão. São testes HTTP; cliques, layout e acessibilidade ainda exigem validação de interface.

As fontes Fredoka, Nunito, Plus Jakarta Sans, Source Serif 4 e IBM Plex Sans são arquivos WOFF2 originais locais, com pesos/variáveis CSS e escopo por rota preservados. Licenças e origem estão em [fontes locais](app/fonts/README.md). O build não depende mais de baixar fontes do Google; a limitação do lote 01 foi resolvida sem fixture substituta.

O inventário da API registra 584 arquivos, 588 simulados publicáveis e 17.684 questões; 192 simulados da 2ª/3ª série do Médio ficam no backlog editorial explícito. Conteúdo local em produção foi preservado. Na conclusão do lote 02, a próxima tarefa técnica era a migração aditiva e os contratos de quiz (lote 03), posteriormente entregues pela API nos lotes 03–05. Missões foram entregues no lote 07; mobile permanece no plano para os lotes 11–12.

Guia de execução e limites: [CI e regressão](docs/guia-ci-regressao.md). Nenhum deploy foi feito.

---

## Histórico detalhado — lote 06: jornada web de quizzes

A página inicial oferece quizzes curtos e os simulados existentes. `/quizzes` apresenta os quizzes publicados e autorizados pela API, com filtros de segmento, ano/idade, disciplina e tema. Atende às 15 faixas previstas: Infantil de 4/5 anos, 1º ao 9º ano, três séries do Médio e Técnico em Enfermagem. A apresentação segue as faixas lúdica, jovem e exame; Infantil recebe o Bolinha e mídia acessível. Catálogos vazios não são preenchidos com atividades fictícias.

`/quiz/:quizId` apresenta uma pergunta por vez: a seleção ainda pode mudar antes de confirmar, a confirmação vem do servidor e libera a explicação, e a resposta confirmada permanece bloqueada. A tentativa fica identificada na URL, pode ser retomada e abre o resultado gravado quando já estiver concluída. Falhas preservam a escolha e permitem repetir a confirmação/conclusão. `/quizzes/historico` separa as rodadas de quizzes; sua paginação de oito itens acontece no cliente, pois o endpoint atual retorna a lista completa.

Filtros de segmento/ano, áudio e movimento são preferências autenticadas da API, isoladas por conta. O frontend serializa alterações, ignora respostas de contas anteriores e mostra falhas sem trocar o valor que havia sido salvo. As escolhas da jornada de quizzes não usam armazenamento local compartilhado entre contas; o fluxo legado de simulados mantém sua trilha existente. Áudio é opcional e nunca inicia sozinho; redução de movimento respeita a conta e a configuração do dispositivo.

Imagens SVG e áudio WAV atravessam o BFF autenticado, incluindo requests de `Range`, sem tokens expostos na URL ou no JSON. Mídia indisponível tem descrição/transcrição e não impede responder. O runner não calcula gabaritos, XP ou recompensas locais.

**Situação editorial:** o acervo inicial da API tem 45 quizzes e 213 questões preparados, todos com revisão `PENDING`. Este lote não os aprova nem publica. A disponibilidade real continua dependendo da revisão e publicação explícita pela equipe.

**Validação no fechamento do lote 06:** tipos, builds, **30 testes de sessão, 16 jornadas HTTP e 24 testes Chromium desktop/mobile emulado** passaram. A suíte cobre os cinco segmentos, filtros das 15 faixas, teclado, axe, confirmação, resposta incorreta, recarga, resultado/histórico, perda de respostas HTTP, fallback de mídia e troca de conta, incluindo cookies atrasados. Os quatro bundles de páginas de quiz foram inspecionados sem gabaritos, identificadores privados de mídia ou fixtures sintéticas. Não houve avaliação com leitores de tela, pessoas ou aparelhos físicos.

[ADR 007 — Jornada web de quizzes](docs/decisions/007-jornada-web-de-quizzes.md) documenta os contratos, isolamento, recuperação de falhas e limites. [CI e regressão](docs/guia-ci-regressao.md) traz os comandos reproduzíveis. O lote 07 implementa missões e XP conforme seção abaixo. Não houve seed em banco existente nem deploy.

---

## Histórico detalhado — lote 07: Aprender hoje, missões e XP

A home do aluno reúne saldo de XP, quiz em andamento, duas posições de missão por semana/faixa/turma, próxima atividade e sugestão de quiz, mantendo acesso ao catálogo e aos simulados. A escolha das 15 faixas usa preferências da conta e, na primeira visita, o ano do perfil quando disponível, sem salvar automaticamente um filtro. Bolinha acompanha Infantil e a apresentação adapta o texto por segmento. Visitantes e outros perfis mantêm a escolha existente de quizzes/simulados.

XP vem do backend: **10 por quiz lógico por dia, até 50 XP/dia**, usando America/Sao_Paulo. O resultado exibe a decisão salva de cada conclusão, inclusive repetição/teto/LEGACY, sem conceder XP no navegador ou alterar notas/ranking. Missões não adicionam bônus de XP no piloto. A home mostra progresso persistido, etapas ordenadas e janela semanal; permite pausar, recarregar e repetir consultas. Troca de sessão cancela requisições e substitui o estado da conta. Resultados de versões anteriores são usados somente quando autorizados; origem indisponível oferece prática no quiz atual e conserva progresso.

Os testes encontraram contraste insuficiente em cartões legados da home e cabeçalho sem quebra de linha que dificultava Sair no celular. Cores e layout do HeroStep foram corrigidos pontualmente; o Axe continua verificando a home inteira pública e autenticada.

**Validação no fechamento do lote 07:** typecheck/build web, **30 testes de sessão, 23 jornadas HTTP Next/BFF/API e 38 Chromium desktop/mobile emulado** passaram. Incluem duas missões sintéticas em cada faixa, progresso/XP, teto sob seis conclusões simultâneas, reenvio estável, retomada, perfil, turma, falha/retry, conta anterior com resposta atrasada e cookies, teclado e Axe, sem violações detectadas ou overflow horizontal. A API passou 479 unitários/267 casos PostgreSQL, migration sem backfill e testes com barreiras reais de concorrência. O CI fixa o commit compatível da API.

O catálogo preparado mantém 45 quizzes/213 perguntas PENDING. A API oferece um exportador offline com 30 rascunhos de missão para curadoria, sem publicar ou acessar banco. Em 2026-10-13, o responsável pelo projeto assumiu a revisão dos quizzes; a atribuição não aprova conteúdo. Publicação editorial, sessões com pessoas, leitor de tela e aparelhos reais continuam pendentes. Não houve seed em base existente ou deploy.

[ADR 008 — Aprender hoje, missões e XP](docs/decisions/008-aprender-hoje-missoes-e-xp.md) registra os contratos e limites. O lote 08 acrescenta a coleção pessoal, conforme seção abaixo.

---

## Histórico detalhado — lote 08: avatar, coleções e conquistas

A rota protegida /colecao reúne seis itens, cinco conquistas, critérios de liberação, progresso e personalização salva na conta. AUTO acompanha as 15 faixas: Bolinha no Infantil, Capelo no Fundamental I e selos nas faixas mais velhas. MASCOT e SEAL são escolhas explícitas disponíveis para qualquer aluno. Os símbolos SVG diferenciam os itens e usam o sistema visual existente. Home e resultado do quiz oferecem acesso à coleção.

Ownership, concessões e contadores vêm da API. Itens bloqueados não podem ser selecionados; os liberados podem ser visualizados e salvos com confirmação do servidor. Falhas preservam a prévia para retry. Troca de conta cancela leituras/gravações pendentes e substitui o estado, inclusive com respostas atrasadas e proteção de cookies. O novo PATCH no BFF rejeita origem externa e aceita a origem pública recebida em Host/protocolo do proxy.

**Validação no fechamento do lote 08:** typecheck/build, 30 testes de sessão, 30 jornadas HTTP Next/BFF/API e 52 Chromium desktop/mobile emulado passaram. Incluem as 15 faixas, itens bloqueados, liberação, estilo explícito, persistência em outro navegador autenticado, versões/repetição, teto de XP e missões, outra conta, teclado, falhas/retry, respostas GET/PATCH atrasadas, cookies, Axe da coleção/home e ausência de overflow. A API passou 513 unitários e 309 casos PostgreSQL, inclusive backfill de progresso do lote 07 e rollback atômico. O workflow fixa o commit compatível da API.

[ADR 009](docs/decisions/009-avatar-colecoes-e-conquistas.md) registra decisões e limites. Conquistas/itens não modificam notas ou XP, não têm compras e não são retirados por pausa. Revisão/publicação dos 45 quizzes e curadoria dos 30 rascunhos de missão continuam pendentes; o responsável pelo projeto assumiu a revisão sem aprovar conteúdo. Não houve seed, migration em base existente ou deploy. Sessões com pessoas, leitor de tela e aparelhos reais seguem pendentes. Na conclusão do lote 08, a próxima tarefa era o lote 09, entregue abaixo.


---

## Histórico detalhado — lote 09: progresso e revisão

A rota protegida /progresso apresenta evidências da própria conta nas 15 faixas: primeiras respostas, repetições e revisões com contagens separadas e indicação de evidência insuficiente. Cinco primeiras respostas distintas permitem registros iniciais disponíveis, sem declarar domínio. Preferências sincronizadas selecionam ano/idade, com fallback ao cadastro; a apresentação acompanha Infantil, Fundamental, Médio e Enfermagem. Home, navegação e resultado oferecem acesso ao progresso.

Começar revisão envia apenas quizId; a API seleciona até cinco perguntas de um quiz autorizado sobre dificuldades recentes da mesma habilidade, priorizando perguntas diferentes e identificando as praticadas. O runner usa practiceMode persistido, confirmação/feedback, retomada após recarga e resultado salvo. REVIEW não concede XP, missões ou itens. Histórico permite filtrar quizzes/revisões e permanece separado de simulados. Uma pergunta vista primeiro em revisão conta como repetição ao reaparecer em quiz normal.

Falhas de consulta/criação permitem retry, inclusive após perder a resposta de um início já salvo. Troca de conta cancela GET/POST e isola estado/navegação pela geração de sessão; respostas atrasadas não restauram dados ou cookies anteriores. O novo POST verifica Origin no BFF.

**Validação no fechamento do lote 09:** typecheck/build, 30 testes de sessão, 39 jornadas HTTP Next/BFF/API e 64 Chromium desktop/mobile emulado passaram. Incluem as 15 faixas, evidências separadas, perguntas inéditas/praticadas, confirmação, retomada, resultado/histórico, acesso, falhas/retry, requisições GET/POST atrasadas entre contas, cookies, teclado, Axe e ausência de overflow. API: 571 unitários e 368 casos PostgreSQL, incluindo migration com histórico e importação editorial atômica. O workflow fixa o commit compatível da API.

[ADR 010](docs/decisions/010-progresso-e-revisao.md) e [guia de CI](docs/guia-ci-regressao.md) descrevem os fluxos e limites. O catálogo proposto mantém 45 quizzes/213 perguntas e 45 habilidades/213 classificações PENDING; os 30 rascunhos de missão aguardam curadoria. Atribuir revisão ao responsável não aprovou conteúdo. Não houve importação em base existente ou deploy; pessoas, leitores de tela e aparelhos físicos seguem pendentes. Na conclusão do lote 09, a próxima tarefa era o lote 10, entregue abaixo.


---

## Histórico detalhado — lote 10: acompanhamento e recuperação

/acompanhamento permite a responsável, professor ou ADMIN escolher os alunos autorizados e consultar simulados concluídos e evidências por habilidade em seções separadas. A API valida vínculos/status/papel atuais e limita o docente a atividades públicas e turmas atribuídas. A web cancela respostas quando muda aluno/conta, lida com vínculos revogados e não permite iniciar atividade em nome do aluno. Login e navegação encaminham esses perfis ao acompanhamento; alunos mantêm sua jornada pessoal.

/esqueci-senha solicita o link de recuperação com mensagem uniforme; /redefinir-senha captura o token do fragmento, remove-o da URL e mantém-o somente em memória. Confirmação de senha, falhas e links inválidos/usados são tratados sem login automático. Rotas públicas BFF validam origem, retornam no-store e não alteram cookies de outra conta. A API invalida sessões anteriores ao trocar senha. Novas senhas exigem oito caracteres Unicode e até 72 bytes UTF-8.

**Validação no fechamento do lote 10:** typecheck/build, 30 testes de sessão, 48 casos HTTP/6 suítes e 78 testes Chromium desktop/mobile emulado passaram. Os 14 cenários novos de navegador cobrem permissões, teclado/Axe/overflow, revogação, separação de métricas, fragmento removido, sessões invalidadas, Unicode/72 bytes, links ausentes/usados, falhas/retry, conta atrasada e resposta de reset anterior retida durante abertura de outro link. Novos fixtures públicos também exercitam a paginação real do catálogo. API: 688 unitários/39 suites e 395 casos Nest/PostgreSQL/21 suites passaram, com CI verde na [PR API #213](https://github.com/guilhermeborba/simulados-bernardo-api/pull/213). A [PR web #45](https://github.com/guilhermeborba/simulados-bernardo/pull/45) também passou na CI; ambas foram integradas à `main` em 13/10/2026. A CI web fixa o commit compatível e0b19669723de7d67c778fcc08a3f300b0003fa1.

[ADR 011](docs/decisions/011-acompanhamento-e-recuperacao.md) e [guia de CI](docs/guia-ci-regressao.md) documentam o lote. Resend foi escolhido pelo usuário e permanece desativado por padrão na API; ativação real exige chave e remetente verificado configurados fora do chat. O limite de 20/min usa IP imediato da API: usuários do mesmo BFF compartilham o orçamento; política de proxy/perímetro deve ser definida antes de ampliar uso. Os testes usam transporte sintético e PostgreSQL descartável. Não houve migration em base existente, seed editorial, e-mail externo ou deploy. Quizzes/habilidades/classificações e missões continuam pendentes de revisão/publicação. Avaliação com pessoas, leitor de tela e aparelhos físicos segue pendente. Próxima tarefa técnica: **lote 11 — prova e planejamento mobile**.
