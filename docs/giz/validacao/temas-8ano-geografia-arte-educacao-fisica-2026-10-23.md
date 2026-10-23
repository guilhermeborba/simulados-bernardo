# E04 — Geografia, Arte e Educação Física do 8º ano

Quarto pacote de três lotes, iniciado em 22/10 e concluído em 23/10/2026. Merges api#257–259 e web#129 confirmados antes do início.

Atualização de continuidade (23/10/2026): api#260–262 foram mergeados. As contagens abaixo são as evidências históricas deste pacote; a cobertura e os próximos passos atuais estão no [quinto pacote](temas-8ano-ingles-9ano-portugues-matematica-2026-10-23.md).

## Entregas

| Lote | Arquivos | Questões com tema | Vocabulário | PR |
|---|---:|---:|---:|---|
| Geografia/8º | 8 | 240 | 23 temas | [api#260](https://github.com/guilhermeborba/simulados-bernardo-api/pull/260) |
| Arte/8º | 8 | 240 | 10 temas | [api#261](https://github.com/guilhermeborba/simulados-bernardo-api/pull/261) |
| Educação Física/8º | 8 | 240 | 22 temas | [api#262](https://github.com/guilhermeborba/simulados-bernardo-api/pull/262) |

Branches independentes da main 6f0b2e7dfced8a11e462e6898869803845b61e3d. Leitura individual das 720 questões e alternativas, com mapas manuais por ID, sem classificação por palavras-chave. Somente theme acrescentado; demais campos e estrutura preservados exatamente. Vocabulários e critérios em docs/temas-editoriais.md da API.

Espaço mundial e Relações internacionais mantêm em aberto os conceitos pedidos em Geografia. Arte e história evita antecipar o movimento na revisão. Práticas corporais amplia a classificação para esportes, danças, jogos e aventuras; Ginástica, Dança e Capacidades físicas mantêm em aberto seus subtipos.

## Validação

- Cada branch: seed:dry-run, seed:inventory:json, vocabulário/limites e revisão semântica aprovados; 240/240 questões em 8/8 simulados, sem inválidos.
- Fontes sem as linhas theme idênticas byte a byte à base; dados por export preservados. Temas com 1–4 palavras, inicial maiúscula e até 120 caracteres; comparação normalizada com a alternativa do gabarito aprovada.
- npx jest --runInBand: **713 testes/40 suítes aprovados em cada branch**.
- npm run test:e2e: **418 testes/23 suítes aprovados em cada branch**, na primeira execução, sem mudanças de testes/timeouts. PostgreSQL descartáveis removidos e ausência confirmada.
- Composição sem conflitos; preservação dos 24 arquivos, vocabulários documentados, dry-run e inventário das 780 entradas aprovados. Somente as 24 esperadas receberam 30 temas cada; demais coberturas e metadados preservados.
- Web em worktree separado: typecheck, lint, **74 testes** e build aprovados. Diff sem erros nos dois repositórios. Os três PRs API tiveram CI aprovado; checks do registro web devem ser consultados no PR. Testes locais web não incluem UI Expo.

## Revisões próprias

[#130](https://github.com/guilhermeborba/simulados-bernardo/issues/130): duas divergências de letras, alternativas inadequadas e conceitos de Geografia. [#131](https://github.com/guilhermeborba/simulados-bernardo/issues/131): handebol, impedimento, toques no voleibol e preparação/alongamento, incluindo continuidade das #105/#120. Itens e fontes estão nas issues. Os campos anteriores não foram corrigidos; cobertura temática não certifica sua precisão pedagógica.

## Cobertura e sequência

Na composição validada, ainda pendente dos merges: **9.869/23.444 questões com tema e 329/780 simulados completos**. O 8º chega a **1.680/1.920 em 56/64**; falta somente Inglês (240 questões/oito simulados). Acervo: 780 simulados/776 arquivos/19 disciplinas.

| Público/ano (schoolYear) | Questões com tema | Questões sem tema |
|---|---:|---:|
| Educação Infantil — 5 anos (-2) | 0/150 | 150 |
| Educação Infantil — 4 anos (-1) | 0/150 | 150 |
| Técnico (0) | 0/75 | 75 |
| 1º ano | 0/1.200 | 1.200 |
| 2º ano | 0/1.200 | 1.200 |
| 3º ano | 1.949/1.949 | 0 |
| 4º ano | 1.200/1.200 | 0 |
| 5º ano | 1.200/1.200 | 0 |
| 6º ano | 1.920/1.920 | 0 |
| 7º ano | 1.920/1.920 | 0 |
| 8º ano | 1.680/1.920 | 240 |
| 9º ano | 0/1.920 | 1.920 |
| 1ª série do Médio (10) | 0/2.880 | 2.880 |
| 2ª série do Médio (11) | 0/2.880 | 2.880 |
| 3ª série do Médio (12) | 0/2.880 | 2.880 |

Restam **13.575 questões sem tema em 451 simulados não integralmente classificados**, além das correções editoriais. Os 25 simulados privados da turma Bernardo permanecem classificados no acervo do 3º ano, com dados e metadados preservados.

Próximo trio confirmado no inventário: **Inglês/8º, Português/9º e Matemática/9º**, oito arquivos/240 questões sem tema por lote. Depois seguem as demais disciplinas/9º, Ensino Médio e outros anos/públicos sem tema. A [E04 #56](https://github.com/guilhermeborba/simulados-bernardo/issues/56) permanece parcial; manter/reabrir após merges parciais.

## CI web e demais pendências

No [job mobile do PR #129](https://github.com/guilhermeborba/simulados-bernardo/actions/runs/39881157848/job/120178588981), **46 testes de UI passaram**. A integração real teve 12/13 aprovados; TEXT falhou com actual undefined e expected TEXT. O job web/HTTP/browser foi aprovado. A referência antiga da API no workflow continua com correção local em fix/ci-api-ref, cujo envio exige escopo workflow.

Esse resultado difere da falha anterior de temporizador [#125](https://github.com/guilhermeborba/simulados-bernardo/issues/125), ainda aberta. Uma passagem da UI não comprova sua correção. Nenhum código Expo, contrato ou workflow alterado neste pacote.

Além de temas e revisões editoriais, continuam Android/E06, aceite humano assistivo/E07, acabamento da Prática/E13, tempo no servidor/E09 e itens de publicação/E10. O último ponto da #59 registra leitor de tela e aceite estético humano pendentes, embora a issue tenha sido fechada pelo merge. E08/E11/E12 aguardam decisão; quizzes [#90](https://github.com/guilhermeborba/simulados-bernardo/issues/90) continuam adiados.

A [tabela de etapas](../ETAPAS.md) e os pontos de parada das issues são a referência de continuidade. A [lista detalhada anterior](temas-8ano-matematica-ciencias-historia-2026-10-22.md) mantém o roteiro por frente. Merge, deploy, seed em produção e build remoto ficam com o responsável; nenhuma operação em produção ou banco existente executada.
