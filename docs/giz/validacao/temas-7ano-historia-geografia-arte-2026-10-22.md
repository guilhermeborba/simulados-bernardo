# E04 — História, Geografia e Arte do 7º ano

Pacote de três tarefas solicitado pelo responsável em 22/10/2026. Esta entrega preenche os temas para o resultado por assunto do Giz; a revisão dos enunciados e gabaritos continua em issues próprias.

## Entregas

| Lote | Arquivos | Questões classificadas | Vocabulário | PR |
|---|---:|---:|---:|---|
| História/7º ano | 8 | 240 | 18 temas | [api#251](https://github.com/guilhermeborba/simulados-bernardo-api/pull/251), mergeado |
| Geografia/7º ano | 8 | 240 | 17 temas | [api#252](https://github.com/guilhermeborba/simulados-bernardo-api/pull/252), mergeado |
| Arte/7º ano | 8 | 240 | 15 temas | [api#253](https://github.com/guilhermeborba/simulados-bernardo-api/pull/253), aguardando revisão |

Branches independentes, criadas da main em `96a7bcfaaf2183cbc4587f3d8f6a8b0c92547691` (merge de Ciências/api#250). Commits de conteúdo: História `1bf4653`, Geografia `435d6e7`, Arte `3e19be7`, todos enviados. As inserções documentais ocupam trechos diferentes; a composição temporária dos três commits passou sem conflitos.

Somente `theme` foi acrescentado aos 24 arquivos `prisma/seed-data/questoes-{historia,geografia,arte}-7ano-b[1-4]-av[12].ts`. Não há entradas privadas adicionais desses lotes no seed. As 720 questões foram lidas individualmente e receberam mapas manuais. Vocabulário fechado e critérios em `docs/temas-editoriais.md` da API.

Os nomes amplos preservam a tarefa de reconhecer sistemas administrativos, povos, movimentos, regiões, biomas, rios, elementos artísticos e tipos de patrimônio. Unidades concentradas mantêm um ou dois temas; revisões anuais articulam mais assuntos. Isso evita subdivisões artificiais para atingir a recomendação de três a oito.

## Validação

- `npm run seed:dry-run` e `npm run seed:inventory:json` aprovados em cada branch; todos os lotes com 240/240 questões e 8/8 simulados completos, sem inválidos.
- Fontes sem as linhas `theme` idênticas byte a byte à base original; dados por export preservados, incluindo enunciados, alternativas, gabaritos, dicas, curiosidades, IDs e estrutura. Temas com 1–4 palavras, até 120 caracteres, no vocabulário e sem coincidência literal com a alternativa armazenada como correta; revisão semântica individual complementar.
- Em cada uma das três branches: `npx jest --runInBand` com **713 testes/40 suítes**, e `npm run test:e2e` com **418 testes/23 suítes**, aprovados.
- PostgreSQL descartáveis dos três testes removidos pelo runner e ausência confirmada: `simulados-regression-a71e3d1f-72ff-4790-9538-42669283b960`, `simulados-regression-f6ea1c7b-1d8c-4f95-b1f5-c0ec0e648faa` e `simulados-regression-a73d7a6a-0387-4661-a1d7-9207232b3a75`.
- Composição dos três commits em worktree temporário: dry-run, inventário, vocabulários e preservação dos 24 arquivos aprovados. Comparadas todas as 780 entradas: apenas as 24 esperadas ganharam 30 temas cada; demais coberturas e metadados preservados. Total: **7.709/23.444 questões com tema e 257/780 simulados completos**. No 7º ano: **1.440/1.920 em 48/64 simulados**.
- Web, em worktree isolado: `npm run typecheck`, `npm run lint`, `npm test` (**74 testes**) e `npm run build` aprovados. `git diff --check` aprovado nos dois repositórios.

A cobertura de temas não certifica que os gabaritos anteriores estejam corretos. Os testes de importação e execução também não equivalem à revisão pedagógica de todas as respostas.

## Issues editoriais abertas neste pacote

| Issue | Pendência de conteúdo preservada |
|---|---|
| [#116](https://github.com/guilhermeborba/simulados-bernardo/issues/116) | Escola de Sagres apresentada como instituição comprovada e precisão cronológica da derrama. |
| [#117](https://github.com/guilhermeborba/simulados-bernardo/issues/117) | Roteiro manual inicial com 70 divergências de letras em Geografia, além de conceitos de relevo, população e dados sem referência temporal. As letras candidatas exigem revisão do comando, das opções e das explicações. |
| [#118](https://github.com/guilhermeborba/simulados-bernardo/issues/118) | Compasso confundido com andamento no gabarito; precisão dos comandos sobre patrimônio e coerência de uma narrativa folclórica. |

Estas issues continuam abertas para uma rodada própria de correção. A E04 proíbe alterar enunciado, alternativas ou gabarito durante o preenchimento de temas; não foram encerradas por esta entrega.

## O que ainda falta na E04

Cobertura no inventário combinado dos três lotes, após o merge de todos:

| Público/ano (`schoolYear`) | Questões com tema | Questões ainda sem tema |
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
| 7º ano | 1.440/1.920 | 480 |
| 8º ano | 0/1.920 | 1.920 |
| 9º ano | 0/1.920 | 1.920 |
| 1ª série do Médio (10) | 0/2.880 | 2.880 |
| 2ª série do Médio (11) | 0/2.880 | 2.880 |
| 3ª série do Médio (12) | 0/2.880 | 2.880 |

Restam **15.735 questões sem tema em 523 simulados que ainda não estão integralmente classificados**. Este total não inclui correções pedagógicas das questões já classificadas.

Próximo pacote de três lotes: **Educação Física/7º ano, Inglês/7º ano e Português/8º ano**. O inventário confirma oito simulados/240 questões sem tema em cada um. Depois seguem as outras disciplinas do 8º ano, o 9º ano, Ensino Médio, 1º e 2º anos, Educação Infantil e Técnico, conforme a ordem de continuidade da #56.

A issue [#56](https://github.com/guilhermeborba/simulados-bernardo/issues/56) permanece parcial e deve ficar aberta enquanto houver lotes pendentes; os PRs usam o fechamento exigido pelo protocolo e podem fechá-la automaticamente após cada merge parcial.

## Outras pendências do Giz

Além da E04, o acompanhamento em [ETAPAS.md](../ETAPAS.md) mantém: validação Android em aparelho/emulador (E06), roteiro humano de acessibilidade e aceite web (E07), tempo de resposta no servidor (E09), itens de publicação a cargo do responsável (E10) e conclusão verificável do acabamento da Prática (E13). E08, E11 e E12 dependem de decisão e não foram implementadas por este pacote.

Os quizzes [#90](https://github.com/guilhermeborba/simulados-bernardo/issues/90) continuam adiados por orientação do responsável. As revisões editoriais anteriores permanecem no backlog da tabela de etapas.

Não houve mudança de contrato ou atualização do SHA da API no workflow. A falha mobile conhecida do CI web continua ligada à API antiga fixada; a correção está na branch local `fix/ci-api-ref`, cujo push exige escopo `workflow`. As validações locais acima são distintas desse check remoto.

Merge, deploy, seed em produção e build remoto ficam com o responsável. Nenhuma base existente foi usada; não houve operação em produção. O checkout principal web do redesenho foi preservado, e o registro foi preparado em worktree separado.
