# Estado do Projeto — simulados-bernardo

> Atualizado em: 2026-10-17
> Atualizar este arquivo ao concluir cada feature ou iniciativa relevante.

## Status geral

O frontend está **integrado com a API e em produção**. A migração dos dados estáticos (`data/*.ts`) para a API está concluída. O app cobre o fluxo completo do aluno: login, seleção, execução do simulado, resultado, histórico e ranking de turma.

---

## Giz — implementação local em 17/10/2026

O redesign web e o aplicativo Expo estão implementados a partir de `giz-handoff`, com tokens/assets comuns, telas MVP, autenticação, catálogo, execução, resultado/revisão, histórico, ranking e perfil. Painel dos pais, montagem de simulado e trilhas futuras aparecem como “Em breve”, conforme o escopo. Esta entrega ainda não foi publicada.

Novas tentativas solicitam feedback por confirmação à API compatível. Gabarito, dicas e curiosidades vêm da confirmação do servidor; restauração e conflito respeitam o registro persistido. Resultado/revisão usam opções do snapshot e temas editoriais reais. Tentativas legadas preservam o comportamento anterior. A migration `20261017120000_simulation_immediate_feedback` e a API precisam ser instaladas antes dos clientes.

O lint web foi configurado sem interação e com zero avisos; testes e builds web/Expo integram a validação. O [registro de implementação Giz](docs/giz/IMPLEMENTACAO.md) reúne comandos, resultados, decisões e limites de aceite. Execução física Android/iOS, leitor de tela, e-mail real e decisões de marca/distribuição continuam pendentes. Não houve deploy ou alteração em banco existente.

## Features da versão anterior


| Feature | Status | PR/commit |
|---|---|---|
| Integração com API (auth + simulados + tentativas) | ✅ Concluída | — |
| BFF com cookies httpOnly (sb_access_token / sb_refresh_token) | ✅ Concluída | — |
| Auto-refresh de token no proxy catch-all | ✅ Concluída | — |
| Isolamento de renovação por sessão, 401 tardio e logout concorrente | ✅ Validado localmente em 12/10/2026 | — |
| Tela de seleção com máquina de estados (trilha → hero → ano/bimestre/AV) | ✅ Concluída | — |
| Porta de entrada com escolha de trilha (Fundamental, Técnico, Infantil) | ✅ Concluída | PR #30 |
| Trilha de Educação Infantil (4 e 5 anos, mascote Bolinha) | ✅ Concluída | PR #36 |
| Trilha de Cursos Técnicos (navegação por curso e eixo temático) | ✅ Concluída | PR #30 |
| Runner do simulado com envio de respostas ao servidor | ✅ Concluída | — |
| Faixas visuais por faixa etária (lúdico/jovem/exame) | ✅ Concluída | PR #25 |
| Cronômetro e navegador de questões (jovem/exame) | ✅ Concluída | PR #26 |
| Retomada de tentativa em andamento | ✅ Concluída | PR #27 |
| Histórico com accordion e retomada | ✅ Concluída | PR #27 |
| Tela de pontuação e ranking da turma | ✅ Concluída | PR #34 |
| Entrada na turma por link de convite | ✅ Concluída | PR #32 |
| Middleware de proteção de rotas | ✅ Concluída | — |
| Derivação de disponibilidade do catálogo da API | ✅ Concluída | PR #33 |

---

## Correção de sessão — lote 01 da evolução

Renovação compartilhada somente por hash do refresh token, com retenção curta e proteção de requisições já em andamento. Falhas temporárias preservam cookies; logout invalida o coordenador antes de revogar a sessão na API e impede regravar tokens na resposta pendente. O estado local do usuário é limpo mesmo em falha de logout.

Validação local: npm run test:auth passou 25 testes. Smoke HTTP nas rotas Next compiladas confirmou duas contas independentes, um refresh para chamadas da mesma sessão entre rotas e logout concorrente, incluindo cookies HttpOnly/Secure/SameSite. Build completo passou com fixture temporária de fontes locais; build comum falhou no loader Google Fonts de Source Serif 4 em código não alterado. O download real não foi validado; o build com fixture não é um artefato para deploy.

[ADR 006 — Renovação isolada por sessão](docs/decisions/006-renovacao-isolada-por-sessao.md) registra implementação e limites: coordenação local a um processo e access JWT válido até expirar. Definir coordenação/recuperação antes de ampliar réplicas do BFF. Não houve deploy.

---

## Próximas iniciativas

### 1. Recuperação de senha

A implementação Giz inclui `/recuperar-senha`, `/redefinir-senha` e BFF para os endpoints existentes da API. A ativação do transporte de e-mail e a entrega real precisam ser validadas no ambiente autorizado.

### 2. Área do responsável

Fora de escopo na integração inicial. O backend já tem os endpoints de vínculo (`/guardians`) e relatórios por aluno. Precisará de uma seção separada no app ou de um app diferente.

### 3. Educação Infantil — pausas entre rodadas

Esse planejamento pertencia à versão anterior. A v1 Giz Kids atende ao Fundamental I; a jornada específica de Educação Infantil e suas pausas não fazem parte deste MVP.

---

## Infraestrutura

- **Deploy:** não configurado (verificar `.claude/launch.json` para config de preview local)
- **CI:** não configurado
- **Testes:** `npm run test:auth` usa node:test para sessão/cookies; compilação de testes em `.test-build/` (ignorado). Build e TypeScript complementam a validação.
- **Backend esperado em:** `BACKEND_API_URL` (padrão: `http://localhost:3333`)

---

## Decisões arquiteturais registradas

Ver `docs/decisions/` para o raciocínio por trás das escolhas não óbvias do projeto.
