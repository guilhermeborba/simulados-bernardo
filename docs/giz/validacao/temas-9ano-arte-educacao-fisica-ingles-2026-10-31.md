# E04 — Arte, Educação Física e Inglês do 9º ano

Sétimo pacote de três lotes, em 31/10/2026. Branches independentes da base API `d9ab17caa8b1ef877e5c78e8608fcaa481fe6b8b`, após api#266–268; web `a49b496c13298dd2343bb6886aa10f12335f3c97`, após #146. A api#269 foi integrada durante a rodada; a composição foi validada sobre a nova main `64d9bb652b367f1aadec1e570892600759eb5e91`. As contagens são do seed versionado, sem consulta a produção.

## Entregas

| Lote | Arquivos | Temas acrescentados | Vocabulário | PR |
|---|---:|---:|---:|---|
| Arte/9º | 8 | 240 | 30 nomes | [api#270](https://github.com/guilhermeborba/simulados-bernardo-api/pull/270) |
| Educação Física/9º | 8 | 240 | 37 nomes | [api#271](https://github.com/guilhermeborba/simulados-bernardo-api/pull/271) |
| Inglês/9º | 8 | 240 | 35 nomes | [api#272](https://github.com/guilhermeborba/simulados-bernardo-api/pull/272) |

Leitura individual dos enunciados e alternativas das 720 questões. Mapas explícitos por ID, sem classificação por palavras-chave. Somente `theme` acrescentado; demais campos e estrutura preservados exatamente. Vocabulários, escopos e distribuição por arquivo registrados em `docs/temas-editoriais.md` da API.

Arte e história mantém em aberto o movimento que deve ser reconhecido; Teatro e Dança preservam as unidades concentradas. Em Educação Física, os mesmos campos e modalidades mantêm o mesmo nome ao longo do ano. Em Inglês, Tempos verbais, Recursos expressivos, Condicionais, vocabulário e colocações não antecipam a resposta solicitada. As revisões iniciais de Educação Física e Inglês misturam 18 campos, conforme o conteúdo existente.

## Validação

- Cada branch: `npm run seed:dry-run`, `npm run --silent seed:inventory:json`, revisão semântica, limites e vocabulário aprovados. Lote integral em 8/8 simulados e 240/240 questões, sem inválidos.
- Fontes sem as novas linhas de `theme` idênticas byte a byte à base; dados por export idênticos, incluindo IDs, enunciados, alternativas, gabaritos, dicas e curiosidades. Temas com 1–4 palavras, inicial maiúscula, até 120 caracteres e diferentes da resposta literal após normalização.
- **713 testes unitários/40 suítes e 418 testes de integração/23 suítes aprovados em cada branch**, com `npm test -- --runInBand` e `npm run test:e2e`. Arte também validou lint e build localmente; os checks dos PRs verificam lint, build, catálogos e regressão com PostgreSQL.
- A primeira integração local de Arte teve timeout de 5 s no `beforeAll` de `quiz-confirmation`: 391/418 casos passaram, e os 27 da suíte ficaram impedidos pela inicialização. A repetição integral passou nos 418 sem mudar código, testes ou timeouts. Causa da diferença local não confirmada; caso distinto do status nulo do seed na [#140](https://github.com/guilhermeborba/simulados-bernardo/issues/140), que continua aberta.
- Em Inglês, duas tentativas não iniciaram os testes porque o daemon Docker havia parado. O Docker Desktop foi iniciado pelo comando local `docker desktop start`; a execução posterior passou, sem alterar código, testes ou timeouts. Nenhum container de teste foi criado nas tentativas sem conexão.
- PostgreSQL descartáveis criados e removidos pelo runner, com identificação e resultados no ponto de parada da #56. Nenhum banco existente ou de produção utilizado.
- Composição dos três commits sem conflitos; preservação, vocabulários, dry-run e inventário aprovados. Somente as 24 entradas esperadas passam de zero para 30 temas; demais contagens, entradas, metadados e públicos preservados.
- Web: somente documentação. Comandos e resultados locais registrados na descrição do PR de continuidade.

## Cobertura e trabalho restante

Base integrada: **11.309/23.444 questões com tema e 377/780 simulados completos**. Cada branch isolada chega a **11.549/23.444 e 385/780**, com 9º em 1.440/1.920 e 48/64.

A main após api#269 tem **11.339/23.474 questões com tema e 378/781 simulados completos**. A composição deste trio sobre essa main, ainda dependente dos merges dos três lotes, alcança **12.059/23.474 questões com tema e 402/781 simulados completos**. O **9º ano fica completo em 1.920/1.920 e 64/64**; 3º–8º permanecem completos. Acervo da composição: 781 simulados, 777 arquivos e 19 disciplinas.

| Público/ano (schoolYear) | Questões com tema | Questões sem tema |
|---|---:|---:|
| Educação Infantil — 5 anos (-2) | 0/150 | 150 |
| Educação Infantil — 4 anos (-1) | 0/150 | 150 |
| Técnico (0) | 0/75 | 75 |
| 1º ano | 0/1.200 | 1.200 |
| 2º ano | 0/1.200 | 1.200 |
| 3º ano | 1.979/1.979 | 0 |
| 4º ano | 1.200/1.200 | 0 |
| 5º ano | 1.200/1.200 | 0 |
| 6º ano | 1.920/1.920 | 0 |
| 7º ano | 1.920/1.920 | 0 |
| 8º ano | 1.920/1.920 | 0 |
| 9º ano | 1.920/1.920 | 0 |
| 1ª série do Médio (10) | 0/2.880 | 2.880 |
| 2ª série do Médio (11) | 0/2.880 | 2.880 |
| 3ª série do Médio (12) | 0/2.880 | 2.880 |

Restam **11.415 questões sem tema em 379 simulados não integralmente classificados**, além das correções editoriais. Os **26 simulados privados da turma Bernardo (779 questões)** da main após api#269 continuam classificados e preservados na composição.

A [api#269](https://github.com/guilhermeborba/simulados-bernardo-api/pull/269), entrega independente integrada durante a rodada, acrescentou o simulado privado de Matemática/3º ano B4/AV1 com **30 questões já tematizadas**. Ele não está nas três branches originais, mas está incluído nos totais da composição atualizada. Seu conteúdo, temas e metadados foram preservados ao compor os lotes do 9º ano.

Próximo trio do Médio confirmado no inventário: **Português, Matemática e Biologia da 1ª série**, oito arquivos/240 questões sem tema por lote (`questoes-portugues-1em-b*-av*.ts`, `questoes-matematica-1em-b*-av*.ts`, `questoes-biologia-1em-b*-av*.ts`). Conferir antes novas entradas da turma e atualizar a main. A [E04 #56](https://github.com/guilhermeborba/simulados-bernardo/issues/56) permanece parcial; manter/reabrir após merges parciais.

## Pendências editoriais e demais frentes

Revisões próprias: [#147](https://github.com/guilhermeborba/simulados-bernardo/issues/147), letras de Arte; [#148](https://github.com/guilhermeborba/simulados-bernardo/issues/148), história, regras, legislação e gabaritos de Educação Física; [#149](https://github.com/guilhermeborba/simulados-bernardo/issues/149), respostas múltiplas e contexto de Inglês. As issues registram itens e referências para revisão. Nenhum desses campos foi corrigido nos lotes de temas; cobertura não certifica precisão científica, histórica ou pedagógica.

A [main web após #146](https://github.com/guilhermeborba/simulados-bernardo/actions/runs/41249784028) passou no CI em 31/10/2026. #142–144 alinharam os testes de troca de conta, o foco mobile (#125) e a referência da API com suporte a TEXT. A pendência antiga de `fix/ci-api-ref` já foi integrada. Nenhum código Expo ou workflow alterado neste pacote.

Continuam E06/Android, aceite assistivo humano da E07, acabamento da Prática/E13, tempo no servidor/E09 e itens de publicação/E10. E08/E11/E12 aguardam decisão. Quizzes [#90](https://github.com/guilhermeborba/simulados-bernardo/issues/90) seguem adiados. A [tabela de etapas](../ETAPAS.md) e os pontos de parada na #56 são a referência de continuidade.

O [sexto pacote](temas-9ano-ciencias-historia-geografia-2026-10-23.md) mantém seu registro histórico. Merge, deploy, seed em produção e builds remotos ficam com o responsável.
