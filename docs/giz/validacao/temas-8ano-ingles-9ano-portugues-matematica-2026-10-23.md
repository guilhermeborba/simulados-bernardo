# E04 — Inglês do 8º, Português e Matemática do 9º ano

Quinto pacote de três lotes, em 23/10/2026. Merges api#260–262 confirmados na main `169308b7ef033ddf2bba2c5d9b9b54aac7738f81`. O registro web#132 permanecia aberto e foi atualizado com este pacote, preservando o relatório anterior.

## O que estamos fazendo

Estamos classificando as questões existentes com temas editoriais para o Giz. Cada lote é uma disciplina/ano: leitura individual dos enunciados e alternativas, mapa manual por ID, vocabulário fechado e adição somente de `theme`. Não há classificação automática por palavras-chave. Conteúdo novo em produção depende de merge e seed manual pelo responsável.

| Lote | Arquivos | Questões com tema | Vocabulário | PR |
|---|---:|---:|---:|---|
| Inglês/8º | 8 | 240 | 16 temas | [api#263](https://github.com/guilhermeborba/simulados-bernardo-api/pull/263) |
| Português/9º | 8 | 240 | 13 temas | [api#264](https://github.com/guilhermeborba/simulados-bernardo-api/pull/264) |
| Matemática/9º | 8 | 240 | 14 temas | [api#265](https://github.com/guilhermeborba/simulados-bernardo-api/pull/265) |

Branches independentes da mesma main. Demais campos, exports, IDs e estrutura preservados exatamente. Vocabulários e critérios em `docs/temas-editoriais.md` da API. Modais/Perguntas em inglês, Linguagem e sociedade/Gêneros e tipos textuais e Funções/Trigonometria mantêm a resposta solicitada em aberto, sem usar a alternativa correta como tema.

## Validação

- Cada branch: `seed:dry-run`, `seed:inventory:json`, limites, revisão semântica e preservação aprovados: 240 questões/oito simulados classificados, sem inválidos.
- Fontes sem as linhas `theme` idênticas byte a byte à base; dados por export idênticos. Temas com 1–4 palavras, inicial maiúscula e até 120 caracteres; comparação normalizada com o gabarito aprovada.
- `npx jest --runInBand`: **713 testes/40 suítes aprovados em cada branch**.
- `npm run test:e2e`: **418 testes/23 suítes aprovados em cada branch**, na primeira execução e sem alterações de testes/timeouts. PostgreSQL descartáveis removidos pelos runners.
- Composição dos três commits sem conflitos; preservação dos 24 arquivos e correspondência dos vocabulários com as tabelas documentais aprovadas. Dry-run e inventário completos: somente as 24 entradas esperadas recebem 30 temas cada; todos os outros metadados e coberturas preservados.
- Web em worktree separado: `typecheck`, `lint`, **74 testes** e `build` aprovados. Documentação sem erros de diff. Nenhum código Expo ou workflow alterado. CI remoto dos três PRs API aprovado.

## Cobertura

Na composição validada, pendente dos merges deste trio: **10.589/23.444 questões com tema e 353/780 simulados completos**. O 8º fica **completo: 1.920/1.920 em 64/64**; o 9º chega a **480/1.920 em 16/64**, com Português e Matemática. Acervo: 780 simulados/776 arquivos/19 disciplinas.

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
| 8º ano | 1.920/1.920 | 0 |
| 9º ano | 480/1.920 | 1.440 |
| 1ª série do Médio (10) | 0/2.880 | 2.880 |
| 2ª série do Médio (11) | 0/2.880 | 2.880 |
| 3ª série do Médio (12) | 0/2.880 | 2.880 |

Restam **12.855 questões sem tema em 427 simulados não integralmente classificados**, além das correções editoriais. Os 25 simulados privados da turma Bernardo permanecem classificados no acervo do 3º ano, com dados e metadados preservados. Estas contagens descrevem o seed versionado e a composição local validada; não são consulta ao banco de produção.

## O que falta

1. Responsável revisar/mergear api#263–265 e o registro [web#132](https://github.com/guilhermeborba/simulados-bernardo/pull/132). Depois, deploy e seed manual em produção, conforme a rotina do projeto. Esta sessão não executa essas operações.
2. Continuar E04: próximo trio **Ciências, História e Geografia do 9º ano**, cada um com oito arquivos/240 questões sem tema, conforme inventário. Depois, Arte, Educação Física e Inglês do 9º, Ensino Médio e os demais públicos/anos da tabela. A [issue #56](https://github.com/guilhermeborba/simulados-bernardo/issues/56) continua parcial e deve permanecer/reabrir após merges parciais.
3. Corrigir o backlog editorial em rodadas próprias. Novos registros: [#133 Inglês/8º](https://github.com/guilhermeborba/simulados-bernardo/issues/133), [#134 Português/9º](https://github.com/guilhermeborba/simulados-bernardo/issues/134) e [#135 Matemática/9º](https://github.com/guilhermeborba/simulados-bernardo/issues/135). As issues detalham itens, letras, formulações e referências. Os campos anteriores continuam preservados; classificar temas não corrige nem certifica o conteúdo pedagógico.
4. CI web: referência antiga da API e testes contraditórios continuam com correção local em `fix/ci-api-ref`; envio do workflow exige escopo `workflow`. No [job mobile do #132 antes desta atualização](https://github.com/guilhermeborba/simulados-bernardo/actions/runs/39894228826/job/120220795018), **46 testes de UI passaram**, mas a integração real teve 12/13 aprovados: TEXT retornou `undefined` em vez de `TEXT`. O job web/HTTP/browser passou. A falha anterior de temporizador [#125](https://github.com/guilhermeborba/simulados-bernardo/issues/125) é distinta e continua aberta; uma passagem da UI não comprova sua correção.
5. Continuam E06/Android, aceite humano assistivo da E07 (último ponto da #59, embora fechada), acabamento da Prática/E13, tempo no servidor/E09 e itens de publicação/E10. E08/E11/E12 aguardam decisão; não implementar enquanto marcadas `precisa-decisao`. Quizzes [#90](https://github.com/guilhermeborba/simulados-bernardo/issues/90) continuam adiados por orientação do responsável.

A [tabela de etapas](../ETAPAS.md) e os pontos de parada das issues são a referência de continuidade. O [relatório do pacote anterior](temas-8ano-geografia-arte-educacao-fisica-2026-10-23.md) mantém suas evidências. Nenhum banco existente ou de produção foi utilizado.
