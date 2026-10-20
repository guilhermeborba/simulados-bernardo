# Giz — etapas de continuação e protocolo entre agentes

O trabalho restante do Giz está dividido em etapas independentes. **Cada etapa é uma issue no GitHub**, com escopo, critérios de aceite e status ao vivo. A issue é a fonte da verdade: está visível para qualquer sessão no mesmo instante, sem depender de merge.

```bash
gh issue list --repo guilhermeborba/simulados-bernardo --label giz --state open
gh issue view <n> --repo guilhermeborba/simulados-bernardo --comments
```

O que já foi implementado está em [IMPLEMENTACAO.md](IMPLEMENTACAO.md).

## Etapas

Situação registrada em 20/10/2026. A situação ao vivo está sempre nas issues.

| Etapa | Issue | Repositório | Depende de | Onda | Situação |
|---|---|---|---|---|---|
| E01 · Trilhas por público no catálogo | [#53](https://github.com/guilhermeborba/simulados-bernardo/issues/53) | web + Expo | decisão | 1 | ✅ mergeada e publicada (#64) |
| E02 · Convite de turma direto aos simulados | [#54](https://github.com/guilhermeborba/simulados-bernardo/issues/54) | web + Expo | E01 | 1 | ✅ mergeada (#65) |
| E03 · API: importar `theme` pelo seed | [#55](https://github.com/guilhermeborba/simulados-bernardo/issues/55) | API | api#222 | 1 | ✅ mergeada (api#224) |
| E04 · Temas editoriais nas questões | [#56](https://github.com/guilhermeborba/simulados-bernardo/issues/56) | API (conteúdo) | E03 | 2 — divisível em lotes | 🟡 3º e 4º anos integrados (api#225–234); Português/5º ano integrado (api#235); Matemática/5º ano em revisão ([api#236](https://github.com/guilhermeborba/simulados-bernardo-api/pull/236)); próximo lote: Ciências/5º ano |
| E05 · Prática dentro do Giz | [#57](https://github.com/guilhermeborba/simulados-bernardo/issues/57) | web + Expo | decisão (b), E02 | 2 | ✅ mergeada (#68) |
| E06 · Validar app Giz no Android | [#58](https://github.com/guilhermeborba/simulados-bernardo/issues/58) | Expo | — | 2 | ⏳ livre (ideal após E05) |
| E07 · Aceite web e acessibilidade | [#59](https://github.com/guilhermeborba/simulados-bernardo/issues/59) | web | — | 2 | 🟡 PR #69 mergeado; verificações automatizadas aprovadas e roteiro assistivo humano pendente |
| E08 · Ranking geral e pontos | [#60](https://github.com/guilhermeborba/simulados-bernardo/issues/60) | API + web | decisão | backlog | ❓ aguarda decisão |
| E09 · Tempo de resposta no servidor | [#61](https://github.com/guilhermeborba/simulados-bernardo/issues/61) | API + web | — | backlog | ⏳ livre |
| E10 · Publicação | [#62](https://github.com/guilhermeborba/simulados-bernardo/issues/62) | ambos | api#222, #52, E01 | 3 | 🟡 API e web publicadas; faltam APK interno, CTA e itens do responsável |
| E11 · Painel dos pais / monte seu simulado | [#63](https://github.com/guilhermeborba/simulados-bernardo/issues/63) | ambos | decisão | backlog | ❓ aguarda decisão |
| E12 · Coleção e avatar com o Tuca | [#66](https://github.com/guilhermeborba/simulados-bernardo/issues/66) | web + Expo | E05, decisão | 2 | ❓ aguarda decisão |
| E13 · Acabamento visual da Prática | [#67](https://github.com/guilhermeborba/simulados-bernardo/issues/67) | web | E05 | 2 | ⏳ pendente na main; checklist marcada na issue, sem PR de conclusão identificado |
| Correção editorial · Gabarito História 3º ano B4/AV1 | [#70](https://github.com/guilhermeborba/simulados-bernardo/issues/70) | API (conteúdo) | — | backlog | ⏳ revisão pendente; descoberta na E04, sem alteração de gabarito no lote de temas |
| Correção editorial · Questões ambíguas de Português 3º ano | [#72](https://github.com/guilhermeborba/simulados-bernardo/issues/72) | API (conteúdo) | — | backlog | ⏳ revisão pendente de alternativas duplicadas e comandos incompletos do legado; conteúdo preservado na E04 |
| Correção editorial · Coesão em Português 4º ano B4/AV2 | [#74](https://github.com/guilhermeborba/simulados-bernardo/issues/74) | API (conteúdo) | — | backlog | ⏳ revisão de gabarito pendente; descoberta na E04, conteúdo preservado no lote de temas |
| Correção editorial · Origem do nome Brasil em História 4º ano B2/AV1 | [#76](https://github.com/guilhermeborba/simulados-bernardo/issues/76) | API (conteúdo) | — | backlog | ⏳ revisão do enunciado pendente; fontes documentadas na issue, conteúdo preservado na E04 |
| Correção editorial · Distrito Federal e litoral em Geografia 4º ano | [#78](https://github.com/guilhermeborba/simulados-bernardo/issues/78) | API (conteúdo) | — | backlog | ⏳ revisão de alternativa e coerência regional pendente; conteúdo preservado na E04 |
| Correção editorial · Texto-base de Português 5º ano B4/AV2 | [#80](https://github.com/guilhermeborba/simulados-bernardo/issues/80) | API (conteúdo) | — | backlog | ⏳ revisão das perguntas 1–10 sem texto de apoio; conteúdo preservado na E04 |
| Correção editorial · Paridade em Matemática 5º ano B1/AV1 | [#82](https://github.com/guilhermeborba/simulados-bernardo/issues/82) | API (conteúdo) | — | backlog | ⏳ revisão de gabarito pendente; 4.578 marcado como ímpar, conteúdo preservado na E04 |

**CI da `main`:** falha desde #52 porque o workflow fixava uma API antiga e dois testes contradiziam o contrato. A correção está pronta na branch local `fix/ci-api-ref`, mas o push de `.github/workflows/` exige o escopo `workflow` no token do GitHub. Enquanto não for mergeada, os PRs mostram o job mobile vermelho por esse motivo.

Todas as issues vivem no repositório `simulados-bernardo`, inclusive as etapas de API.

**Paralelismo seguro:** E01 e E02 mexem na mesma persistência de trilha; faça E02 depois de E01. Os demais pares da mesma onda tocam áreas diferentes. E04 aceita várias sessões ao mesmo tempo, uma por lote (ano + disciplina).

## Protocolo

### Antes de começar
1. Leia a issue inteira e o último comentário **Ponto de parada**.
2. Se a issue tem o label `em-andamento` e o último comentário tem menos de 24 h, outra sessão está nela. Escolha outra etapa. Com mais de 24 h sem comentário, considere a etapa abandonada e assuma a partir do último ponto de parada.
3. Se a issue tem `precisa-decisao`, não implemente antes de a decisão estar registrada em comentário do responsável.
4. Assuma: comente `Assumido por <nome da sessão>` e adicione o label `em-andamento`.

```bash
gh issue comment <n> --repo guilhermeborba/simulados-bernardo --body "Assumido por <sessão>"
gh issue edit <n> --repo guilhermeborba/simulados-bernardo --add-label em-andamento
```

### Durante
- Branch da etapa: `giz/eNN-<slug>`, criada a partir de `main` depois do merge de #52; antes disso, a partir de `codex/giz-production`.
- **Commit e push a cada passo concluído.** Commits `wip:` são aceitos na branch da etapa. Trabalho só local se perde quando a sessão acaba.
- Rode a validação da etapa antes de cada push que se diga “pronto”.

### Ao parar — por fim de sessão, limite de uso, bloqueio ou conclusão
Antes de o limite chegar, pare num ponto estável: commit, push e o comentário abaixo. Prefira parar cedo a deixar trabalho sem registro.

```markdown
## Ponto de parada — AAAA-MM-DD HH:MM — <sessão>
- **Branch / último commit:** `giz/eNN-...` @ `abc1234` (enviado: sim)
- **Feito:** itens do escopo concluídos (marque também a checklist da issue)
- **Próximo passo exato:** arquivo/função e o que fazer
- **Validação rodada:** comandos e resultado
- **Bloqueios / decisões pendentes:** …
```

Depois remova o label: `gh issue edit <n> --repo guilhermeborba/simulados-bernardo --remove-label em-andamento`.

### Ao concluir
Abra o PR com `Closes guilhermeborba/simulados-bernardo#<n>` na descrição (vale também para PRs no repositório da API) e deixe o último ponto de parada com o link do PR. Merge, deploy, seed em produção e builds remotos só com pedido explícito do responsável.

### Trabalho novo
Bug ou tarefa descoberta fora do escopo: abra uma issue nova com o label `giz`, no mesmo formato, e acrescente uma linha na tabela acima no próximo PR.
