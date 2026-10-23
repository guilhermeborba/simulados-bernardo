# E04 — Ciências, História e Geografia do 9º ano

Sexto pacote de três lotes, em 23/10/2026. Base API `398d0ea8e94da2b788510dab92ff2dcc39f2609c`, com api#263–265 mergeados. O registro web#132 foi mergeado durante a rodada; este pacote tem novo registro a partir da main web `5d8eed7`.

## Entregas e validação

| Lote | Arquivos | Questões com tema | Vocabulário | PR |
|---|---:|---:|---:|---|
| Ciências/9º | 8 | 240 | 30 temas | [api#266](https://github.com/guilhermeborba/simulados-bernardo-api/pull/266) |
| História/9º | 8 | 240 | 27 temas | [api#267](https://github.com/guilhermeborba/simulados-bernardo-api/pull/267) |
| Geografia/9º | 8 | 240 | 21 temas | [api#268](https://github.com/guilhermeborba/simulados-bernardo-api/pull/268) |

Leitura individual das 720 questões e alternativas; mapas manuais por ID, sem classificação por palavras-chave. Somente `theme` acrescentado. Vocabulários e critérios em `docs/temas-editoriais.md` da API. Agrupamentos amplos mantêm em aberto os conceitos pedidos; as unidades diversas de História e a revisão anual de Geografia justificam mais de oito temas em alguns simulados.

- Cada branch: dry-run, inventário das 780 entradas, limites e revisão semântica aprovados; 240/240 questões em 8/8 simulados, sem inválidos.
- Fontes sem `theme` idênticas byte a byte à base; dados por export idênticos, incluindo IDs, enunciados, alternativas, gabaritos, dicas e curiosidades. Temas de 1–4 palavras, inicial maiúscula e até 120 caracteres; comparação normalizada com a resposta aprovada.
- **713 testes unitários/40 suítes aprovados em cada branch**.
- **418 testes de integração/23 suítes aprovados em cada branch**. Ciências e História passaram na primeira execução; Geografia passou no checkout principal com o mesmo commit após duas falhas locais no worktree, registradas na #140. PostgreSQL descartáveis removidos; nenhum teste ou timeout alterado.
- Duas execuções locais de Geografia no worktree terminaram com 417/418 aprovados: o subprocesso do seed retornou status nulo onde se esperava código 1. O teste tem limite de 20 s, compatível com timeout/sinal; o diagnóstico precisa registrar erro/sinal para confirmar. Investigação na [issue #140](https://github.com/guilhermeborba/simulados-bernardo/issues/140). Nenhum código, teste ou timeout alterado para contornar a falha. O CI do mesmo commit aprovou 713 unitários e 418 integrações.
- Composição dos três commits sem conflitos; preservação dos 24 arquivos, vocabulários documentados, dry-run e inventário aprovados. Somente as 24 entradas esperadas recebem 30 temas; outros metadados e coberturas preservados.
- Web em worktree isolado: typecheck, lint, **74 testes** e build aprovados; documentação e links locais conferidos. A main web após merge do #132 tem árvore idêntica à branch validada. Nenhum código Expo ou workflow alterado.

## Cobertura e trabalho restante

Na composição validada, pendente dos merges deste trio: **11.309/23.444 questões com tema e 377/780 simulados completos**. O 9º chega a **1.200/1.920 em 40/64**, com Português, Matemática, Ciências, História e Geografia; 3º–8º completos. Acervo: 780 simulados/776 arquivos/19 disciplinas.

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
| 9º ano | 1.200/1.920 | 720 |
| 1ª série do Médio (10) | 0/2.880 | 2.880 |
| 2ª série do Médio (11) | 0/2.880 | 2.880 |
| 3ª série do Médio (12) | 0/2.880 | 2.880 |

Restam **12.135 questões sem tema em 403 simulados não integralmente classificados**, além das correções editoriais. Os 25 simulados privados da turma Bernardo permanecem classificados no 3º ano, com dados e metadados preservados. Contagens do seed versionado e da composição validada; não são consulta ao banco de produção.

Próximo trio confirmado no inventário: **Arte, Educação Física e Inglês do 9º ano**, oito arquivos/240 questões sem tema por lote. Depois seguem Ensino Médio e os outros anos/públicos da tabela. A [E04 #56](https://github.com/guilhermeborba/simulados-bernardo/issues/56) permanece parcial; manter/reabrir após merges parciais.

As revisões editoriais são tarefas próprias: [#136 Ciências](https://github.com/guilhermeborba/simulados-bernardo/issues/136), [#138 História](https://github.com/guilhermeborba/simulados-bernardo/issues/138) e [#139 Geografia](https://github.com/guilhermeborba/simulados-bernardo/issues/139). As issues detalham itens e referências, incluindo orientação de segurança elétrica, gabaritos divergentes, alternativa ausente e delimitação de critérios. Os campos anteriores continuam preservados; a cobertura temática não certifica precisão pedagógica ou científica.

## CI e outras frentes

O [CI mobile do #132](https://github.com/guilhermeborba/simulados-bernardo/actions/runs/39951069743/job/120405375391) passou nos **46 testes de UI**, mas falhou na integração TEXT (`undefined` em vez de `TEXT`, 12/13 casos). O job web/HTTP/browser passou. A referência antiga da API e testes contraditórios continuam com correção local em `fix/ci-api-ref`; envio do workflow exige escopo `workflow`. A falha anterior de temporizador [#125](https://github.com/guilhermeborba/simulados-bernardo/issues/125) é distinta e continua aberta; passar uma execução da UI não comprova sua correção.

Continuam E06/Android, aceite humano assistivo da E07 (último ponto da #59, embora fechada), acabamento da Prática/E13, tempo no servidor/E09 e itens de publicação/E10. E08/E11/E12 aguardam decisão. Quizzes [#90](https://github.com/guilhermeborba/simulados-bernardo/issues/90) continuam adiados pelo responsável.

A [tabela de etapas](../ETAPAS.md) e os pontos de parada são a referência de continuidade. O [quinto pacote](temas-8ano-ingles-9ano-portugues-matematica-2026-10-23.md) mantém o detalhamento anterior. Merge, deploy, seed em produção e builds remotos ficam com o responsável; nenhum banco existente ou de produção utilizado.
