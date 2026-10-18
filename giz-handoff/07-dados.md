# 07 · Dados

**Sugestão a reconciliar com a API existente** (`simulados-bernardo-api`, não incluída neste pacote). Se o modelo atual já cobre algum item, mantenha o atual e só acrescente o que falta. Nomes abaixo são ilustrativos.

## Entidades que as telas pedem

**Usuário:** `id`, `nome` (primeiro nome para exibição), `email`, `trilha` (`kids` | `escola` | `tecnico`), `tema` (`claro` | `escuro` | `auto`), `cronometroPadrao` (booleano, padrão ligado).

**Simulado:** `id`, `titulo`, `disciplina`, `serie` (ex.: 3º ano), `bimestre`, `avaliacao` (`AV1` | `AV2`), `totalQuestoes` (30), `trilha`.

**Questão:** `id`, `simuladoId`, `ordem`, `tema`, `enunciado`, `alternativas[4]` (A a D), `correta` (A a D), `dicaDeOuro`, `curiosidade` (o "Você sabia?").
- Regra: `correta` **não vai** para o cliente antes da confirmação da resposta, a não ser que a revisão já esteja liberada (simulado concluído). Se o app precisar funcionar offline, vai junto e é aceita como risco, pois o público é infantil.

**Tentativa:** `id`, `usuarioId`, `simuladoId`, `iniciadaEm`, `concluidaEm` (nulo = em andamento), `comCronometro`, `questaoAtual`.

**Resposta:** `tentativaId`, `questaoId`, `escolhida` (A a D ou `-1` para em branco/tempo esgotado), `acertou`, `tempoGastoMs`, `respondidaEm`.

**Resultado (derivado):** `acertos`, `erros`, `emBranco`, `tempoMedioMs`, `porTema[]` (tema, certas, total).

**Conquista:** `id`, `nome`, `descricao`, `meta`, e para o usuário: `progresso`, `conquistadaEm`.

**Ranking (a definir):** `usuarioId`, `nomeExibicao`, `pontos`, `escopo` (`turma` | `geral`). A regra de pontos **não existe ainda**.

## Eventos sugeridos

| Evento | Quando | Dados |
|---|---|---|
| `tentativa_iniciada` | Começar o simulado | simuladoId, comCronometro |
| `resposta_confirmada` | Confirmar ou tempo esgotado | tentativaId, questaoId, escolhida, tempoGastoMs |
| `tentativa_pausada` | Sair pelo painel | tentativaId, questaoAtual |
| `tentativa_retomada` | Voltar | tentativaId |
| `tentativa_concluida` | Última confirmação | tentativaId |

Use só o necessário para o produto funcionar (progresso, histórico, ranking). Nada de dados de comportamento para terceiros.

## O que cada tela lê e grava

| Tela | Lê | Grava |
|---|---|---|
| 1, 2 | - | conta, redefinição de senha |
| 3 | trilhas | `trilha` do usuário |
| 4 | usuário, tentativa em andamento, novos simulados, sequência | - |
| 5, 6 | simulados | `cronometroPadrao` opcional |
| 7, 8 | questões da tentativa | respostas, `questaoAtual` |
| 9, 10 | resultado, respostas, questões | - |
| 11 | tentativas concluídas | - |
| 12 | ranking | - |
| 13 | usuário, conquistas | tema, cronômetro |
| 14, 15 | (Depois) | (Depois) |

## Dados dos protótipos

Nomes (Lia, Ana, Davi, Bia), pontos, notas e as 5 questões de Geografia são **fictícios/exemplo**. O simulado real tem 30 questões e vem do repositório de conteúdo.
