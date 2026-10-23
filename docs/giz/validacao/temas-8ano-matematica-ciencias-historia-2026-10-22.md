# E04 — Matemática, Ciências e História do 8º ano

Terceiro pacote de três lotes autorizado pelo responsável em 22/10/2026. Os temas alimentam os agrupamentos por assunto do resultado do Giz. Revisões de enunciados, alternativas, gabaritos e explicações seguem em issues próprias.

## Entregas

| Lote | Arquivos | Questões com tema | Vocabulário | PR |
|---|---:|---:|---:|---|
| Matemática/8º ano | 8 | 240 | 10 temas | [api#257](https://github.com/guilhermeborba/simulados-bernardo-api/pull/257) |
| Ciências/8º ano | 8 | 240 | 12 temas | [api#258](https://github.com/guilhermeborba/simulados-bernardo-api/pull/258) |
| História/8º ano | 8 | 240 | 17 temas | [api#259](https://github.com/guilhermeborba/simulados-bernardo-api/pull/259) |

Branches independentes da main em `6ba99a0b3d1b136e8692d564879c898c047c7aef` (merge de Português/8º, api#256). Os merges api#254–256 e web#124 foram confirmados antes do pacote. Somente `theme` foi acrescentado aos 24 arquivos; todos os campos anteriores e a estrutura foram preservados. Vocabulários e critérios estão em `docs/temas-editoriais.md` da API. Leitura individual de todas as 720 questões e alternativas, com mapas manuais por ID, sem classificação por palavras-chave.

Em Matemática, Teorema de Pitágoras evita antecipar a operação pedida, Expressões algébricas reúne monômios/polinômios e Estatística mantém em aberto a medida solicitada. Em Ciências, Corpo humano mantém as integrações e os itens que pedem reconhecer o sistema; Excreção inclui rins, pele e pulmões. Em História, Trabalho e tecnologia, Organização social, Europa no século XIX e Independências americanas evitam antecipar revoluções, governante ou países pedidos. Unidades concentradas mantêm poucos temas; revisões anuais podem ter mais de oito agrupamentos conforme o conteúdo.

## Validação

- `npm run seed:dry-run` e `npm run seed:inventory:json`: 240/240 questões e 8/8 simulados em cada lote, sem inválidos; demais entradas, metadados e coberturas preservados.
- Fontes sem as linhas `theme` idênticas byte a byte à base, dados por export preservados, incluindo IDs, estrutura, enunciados, alternativas, gabaritos, dicas e curiosidades. Vocabulários com 1–4 palavras, até 120 caracteres e inicial maiúscula; comparação normalizada com a alternativa do gabarito e revisão semântica individual aprovadas.
- `npx jest --runInBand`: **713 testes/40 suítes aprovados em cada branch**.
- `npm run test:e2e`: **418 testes/23 suítes aprovados em cada branch**, usando PostgreSQL descartável. As três execuções passaram na primeira tentativa, sem mudança de testes ou timeouts.
- Composição dos três commits sem conflitos, com vocabulário e preservação dos 24 arquivos aprovados. Dry-run e inventário das 780 entradas aprovados: somente as 24 esperadas receberam 30 temas cada, demais metadados e coberturas preservados, sem inválidos. Próximos três lotes confirmados no inventário (240 questões sem tema em oito simulados por disciplina).
- Web em worktree separado: `npm run typecheck`, `npm run lint`, `npm test` (**74 testes**) e `npm run build` aprovados. `git diff --check` aprovado nos dois repositórios.
- PostgreSQL descartável criado pelo runner e removido ao terminar; confirmação final no ponto de parada. Nenhuma base existente utilizada.

## Revisões editoriais separadas

| Issue | Conteúdo preservado para revisão |
|---|---|
| [#126](https://github.com/guilhermeborba/simulados-bernardo/issues/126) | Matemática: alternativas simultaneamente válidas, definição de polinômio e condição insuficiente para unicidade de solução de sistemas. |
| [#127](https://github.com/guilhermeborba/simulados-bernardo/issues/127) | Ciências: gabarito A em vez da finalidade descrita em C em B4/AV2, ID 16; comando que pede órgão e oferece sistema no ID 1. |
| [#128](https://github.com/guilhermeborba/simulados-bernardo/issues/128) | História: maioridade/coroação de Pedro II, governo regencial, ordem de eventos, início da campanha russa e ambiguidade sobre ajuda aos colonos americanos. Fontes e itens na issue. |

As três issues permanecem abertas para correção própria. Cobertura temática e testes técnicos não certificam a precisão pedagógica do conteúdo anterior. A E04 proíbe alterar esses campos durante a classificação.

## Cobertura e sequência

Na composição dos três PRs, ainda pendentes de merge: **9.149/23.444 questões com tema e 305/780 simulados completos**. O 8º ano chega a **960/1.920 em 32/64**, com Português, Matemática, Ciências e História. O acervo mantém 780 simulados/776 arquivos/19 disciplinas.

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
| 8º ano | 960/1.920 | 960 |
| 9º ano | 0/1.920 | 1.920 |
| 1ª série do Médio (10) | 0/2.880 | 2.880 |
| 2ª série do Médio (11) | 0/2.880 | 2.880 |
| 3ª série do Médio (12) | 0/2.880 | 2.880 |

Restam **14.295 questões sem tema em 475 simulados ainda não integralmente classificados**, além das correções editoriais rastreadas separadamente. Os 25 simulados privados da turma Bernardo permanecem no acervo classificado do 3º ano; dados e metadados preservados.

Próximo pacote: **Geografia, Arte e Educação Física do 8º ano**, oito arquivos/240 questões sem tema em cada lote. Depois vêm Inglês/8º, 9º ano, Ensino Médio e os demais anos/públicos pendentes. A E04 [#56](https://github.com/guilhermeborba/simulados-bernardo/issues/56) permanece parcial e deve ser mantida/reaberta após merges parciais.

## O que ainda falta além dos temas

| Frente | Próxima ação |
|---|---|
| Revisões editoriais | Resolver as issues de conteúdo já abertas, incluindo #126–128, com revisão dos campos e gabaritos; esta rodada só classifica temas. |
| CI web/mobile | Reproduzir/corrigir o temporizador de foco [#125](https://github.com/guilhermeborba/simulados-bernardo/issues/125). A referência antiga da API no workflow é outra pendência, com correção local em `fix/ci-api-ref`; envio exige escopo `workflow`. |
| E06 [#58](https://github.com/guilhermeborba/simulados-bernardo/issues/58) | Validar app Android em emulador/aparelho conforme roteiro. |
| E07 [#59](https://github.com/guilhermeborba/simulados-bernardo/issues/59) | Executar roteiro humano com tecnologia assistiva e aceite visual final. |
| E13 [#67](https://github.com/guilhermeborba/simulados-bernardo/issues/67) | Conferir/concluir acabamento visual da Prática com evidência e PR. |
| E09 [#61](https://github.com/guilhermeborba/simulados-bernardo/issues/61) | Implementar registro de tempo no servidor. |
| E10 [#62](https://github.com/guilhermeborba/simulados-bernardo/issues/62) | APK interno, CTA e itens operacionais do responsável. |
| Decisões | E08 [#60](https://github.com/guilhermeborba/simulados-bernardo/issues/60), E11 [#63](https://github.com/guilhermeborba/simulados-bernardo/issues/63) e E12 [#66](https://github.com/guilhermeborba/simulados-bernardo/issues/66) aguardam o responsável; não implementar. |
| Quizzes [#90](https://github.com/guilhermeborba/simulados-bernardo/issues/90) | Conferência/publicação adiada por orientação explícita do responsável. |

O status ao vivo e os pontos de parada estão nas issues; veja também [ETAPAS.md](../ETAPAS.md). Este registro não encerra nenhuma dessas pendências. Merge, deploy, seed em produção e build remoto ficam com o responsável. Nenhuma operação em produção executada; não houve mudança de contrato.

## CI remoto

Conferência em 22/10/2026 21:57 (São Paulo): Os três PRs API tiveram CI aprovado. Os checks locais acima estão aprovados nos três lotes. O estado atualizado do CI e os checks do registro web devem ser consultados nos PRs.

A falha de temporizador de foco #125 foi comprovada no pacote anterior, antes da integração TEXT. A referência antiga da API no workflow continua uma pendência distinta. Não houve correção mobile ou de workflow neste pacote; os 74 testes web locais não incluem UI Expo.
