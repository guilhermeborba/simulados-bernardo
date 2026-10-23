# E04 — Educação Física/7º, Inglês/7º e Português/8º ano

Segundo pacote de três tarefas autorizado pelo responsável em 22/10/2026. Preenche os temas usados pelo resultado por assunto do Giz. Revisões de enunciados, alternativas, gabaritos e explicações continuam em issues próprias.

## Entregas

| Lote | Arquivos | Questões com tema | Vocabulário | PR |
|---|---:|---:|---:|---|
| Educação Física/7º ano | 8 | 240 | 16 temas | [api#254](https://github.com/guilhermeborba/simulados-bernardo-api/pull/254), mergeado |
| Inglês/7º ano | 8 | 240 | 11 temas | [api#255](https://github.com/guilhermeborba/simulados-bernardo-api/pull/255) |
| Português/8º ano | 8 | 240 | 18 temas | [api#256](https://github.com/guilhermeborba/simulados-bernardo-api/pull/256) |

Branches independentes da main em `6412aab82c98df04322d80ffbc1a90bd057962f7` (merge de Arte/api#253). Somente `theme` foi acrescentado aos 24 arquivos; todos os campos anteriores foram preservados. Vocabulários e critérios estão em `docs/temas-editoriais.md` da API. Todas as 720 questões foram lidas individualmente e receberam mapas manuais, sem classificação por palavras-chave.

Os rótulos preservam o reconhecimento de modalidades, provas, capacidades, equipamentos, formas verbais, gêneros, figuras de linguagem e categorias gramaticais como tarefa do aluno. Inglês/B3/AV1, IDs 15 e 17, usa Estruturas verbais para não induzir passado em perguntas sem contexto suficiente. Português usa Leitura e escrita nas sínteses que pedem nomear gênero textual, figuras de linguagem ou concordância. Unidades concentradas mantêm um ou dois temas, sem subdivisões artificiais.

## Validação

- `npm run seed:dry-run` e `npm run seed:inventory:json`: 240/240 questões e 8/8 simulados em cada lote, sem inválidos; demais entradas, metadados e coberturas preservados.
- Fontes sem as linhas `theme` idênticas byte a byte à base, e dados por export preservados, incluindo IDs, estrutura, enunciados, alternativas, gabaritos, dicas e curiosidades. Vocabulários com 1–4 palavras, até 120 caracteres, inicial maiúscula, sem coincidência literal com o gabarito armazenado e com revisão semântica individual.
- Testes unitários de cada branch: `npx jest --runInBand`, **713 testes/40 suítes aprovados**.
- Integração: `npm run test:e2e`, **418 testes/23 suítes aprovados em cada um dos três lotes** (Inglês na repetição isolada).
- Inglês: primeira integração com 416 aprovados e duas falhas durante o build web (limite de autenticação e execução de subprocesso do seed). Repetição isolada com **418 testes/23 suítes aprovados**, sem mudar código, testes ou timeouts. As duas ocorrências e a repetição estão registradas no PR.
- Composição dos três commits sem conflitos; vocabulário e preservação dos 24 arquivos aprovados. Dry-run e inventário de todas as 780 entradas aprovados: somente as 24 esperadas receberam 30 temas cada; demais metadados e coberturas preservados, sem inválidos.
- Web, em worktree isolado: `npm run typecheck`, `npm run lint`, `npm test` (**74 testes**) e `npm run build` aprovados. `git diff --check` aprovado nos dois repositórios.
- Bancos PostgreSQL descartáveis removidos pelos runners; confirmação final registrada no ponto de parada. Nenhuma base existente utilizada.

## Revisões editoriais separadas

| Issue | Pendência preservada |
|---|---|
| [#120](https://github.com/guilhermeborba/simulados-bernardo/issues/120) | Regras e formulações de handebol, atletismo, bets/futebol de botão e preparação/alongamento em Educação Física/7º. |
| [#121](https://github.com/guilhermeborba/simulados-bernardo/issues/121) | Sete divergências de letras, variantes linguísticas, contextos insuficientes e lacunas que repetem verbos em Inglês/7º. |
| [#122](https://github.com/guilhermeborba/simulados-bernardo/issues/122) | Exemplos de antítese/ironia e distinção entre relações causais e explicativas em Português/8º. |

Estas issues permanecem abertas para correção própria. Cobertura de temas e testes técnicos aprovados não certificam a correção pedagógica dos campos anteriores. A E04 proíbe mudar enunciados, alternativas e gabaritos durante a classificação.

## CI remoto

Os três PRs da API tiveram CI aprovado. No [job mobile do registro web #124](https://github.com/guilhermeborba/simulados-bernardo/actions/runs/39829403622/job/120001232560), `test:ui` teve 45 testes aprovados e um reprovado: o callback de foco de `mobile/app/simulations.tsx:66` executou após encerrar o ambiente Jest do catálogo e a suíte seguinte encontrou `findNodeHandle` indisponível. O código já estava na base anterior; este pacote muda somente documentação no web. Reprodução e correção foram registradas separadamente na [issue #125](https://github.com/guilhermeborba/simulados-bernardo/issues/125).

A execução parou antes da integração TEXT. O workflow ainda fixa a API antiga, mas a falha de UI observada é distinta da pendência `fix/ci-api-ref`. Os resultados locais web acima permanecem aprovados; não incluem testes de UI Expo.

## Cobertura e próximos lotes

Na composição dos três lotes (integração dos PRs restantes ainda pendente): **8.429/23.444 questões com tema e 281/780 simulados completos**. O 7º ano chega a **1.920/1.920 em 64/64**; o 8º ano começa com **240/1.920 em 8/64**.

| Público/ano (`schoolYear`) | Questões com tema | Questões sem tema |
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
| 8º ano | 240/1.920 | 1.680 |
| 9º ano | 0/1.920 | 1.920 |
| 1ª série do Médio (10) | 0/2.880 | 2.880 |
| 2ª série do Médio (11) | 0/2.880 | 2.880 |
| 3ª série do Médio (12) | 0/2.880 | 2.880 |

Restam **15.015 questões sem tema em 499 simulados ainda não integralmente classificados**, além das correções editoriais rastreadas separadamente.


Próximo pacote: **Matemática, Ciências e História do 8º ano**, oito arquivos/240 questões sem tema em cada lote. Depois seguem Geografia, Arte, Educação Física e Inglês/8º, os demais anos e públicos. A E04 [#56](https://github.com/guilhermeborba/simulados-bernardo/issues/56) segue parcial e deve permanecer aberta após merges parciais.

As outras etapas do Giz, as decisões pendentes e as revisões editoriais anteriores continuam em [ETAPAS.md](../ETAPAS.md). Quizzes [#90](https://github.com/guilhermeborba/simulados-bernardo/issues/90) permanecem adiados. A correção de CI `fix/ci-api-ref` ainda depende do escopo `workflow` para enviar o ajuste da API antiga fixada; não houve mudança de contrato neste pacote.

O registro web foi preparado em worktree separado. Merge, deploy, seed em produção e build remoto ficam com o responsável. Nenhuma base existente foi utilizada e nenhuma operação em produção foi executada.
