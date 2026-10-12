# Estado do Projeto — simulados-bernardo

> Atualizado em: 2026-10-12
> Atualizar este arquivo ao concluir cada feature ou iniciativa relevante.

## Status geral

O frontend está **integrado com a API e em produção**. A migração dos dados estáticos (`data/*.ts`) para a API está concluída. O app cobre o fluxo completo do aluno: login, seleção, execução do simulado, resultado, histórico e ranking de turma.

---

## Features implementadas

| Feature | Status | PR/commit |
|---|---|---|
| Integração com API (auth + simulados + tentativas) | ✅ Concluída | — |
| BFF com cookies httpOnly (sb_access_token / sb_refresh_token) | ✅ Concluída | — |
| Auto-refresh de token no proxy catch-all | ✅ Concluída | — |
| Isolamento de renovação por sessão, 401 tardio e logout concorrente | ✅ Concluída | PR #39 |
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
| CI com tipos, sessão, build e regressão HTTP Next/API/PostgreSQL | ✅ Implementada e validada localmente em 12/10/2026 | — |
| Cinco famílias de fontes originais locais com licença OFL | ✅ Build normal validado | — |

---

## Correção de sessão — lote 01 da evolução

Renovação compartilhada somente por hash do refresh token, com retenção curta e proteção de requisições já em andamento. Falhas temporárias preservam cookies; logout invalida o coordenador antes de revogar a sessão na API e impede regravar tokens na resposta pendente. O estado local do usuário é limpo mesmo em falha de logout.

Validação local: npm run test:auth passou 25 testes. Smoke HTTP nas rotas Next compiladas confirmou duas contas independentes, um refresh para chamadas da mesma sessão entre rotas e logout concorrente, incluindo cookies HttpOnly/Secure/SameSite. Build completo passou com fixture temporária de fontes locais; build comum falhou no loader Google Fonts de Source Serif 4 em código não alterado. O download real não foi validado; o build com fixture não é um artefato para deploy.

[ADR 006 — Renovação isolada por sessão](docs/decisions/006-renovacao-isolada-por-sessao.md) registra implementação e limites: coordenação local a um processo e access JWT válido até expirar. Definir coordenação/recuperação antes de ampliar réplicas do BFF. Não houve deploy.

---

## Inventário, regressão e CI — lote 02 da evolução

GitHub Actions executa instalação pelos lockfiles, checagem de tipos, testes de sessão, build normal e regressão HTTP com o servidor Next de produção, BFF, Nest e PostgreSQL real descartável. A API na CI é fixada no commit público `8f1b47b0708e23d6876cd15d1374b0f45e8e4768` da `main`, com rotação de refresh já integrada. Nenhum seed editorial ou banco existente é utilizado.

Validação local: `npm run typecheck`, 25 testes de sessão, build normal e 8 jornadas HTTP passaram, inclusive contra o commit exato da API usado na CI. As jornadas verificam registro/login, convites, catálogo por faixa/turma, quatro tipos de questão, início/retomada, edição, conclusão, resultado/histórico, acesso entre contas e cookies de sessão. São testes HTTP; cliques, layout e acessibilidade ainda exigem validação de interface.

As fontes Fredoka, Nunito, Plus Jakarta Sans, Source Serif 4 e IBM Plex Sans são arquivos WOFF2 originais locais, com pesos/variáveis CSS e escopo por rota preservados. Licenças e origem estão em [fontes locais](app/fonts/README.md). O build não depende mais de baixar fontes do Google; a limitação do lote 01 foi resolvida sem fixture substituta.

O inventário da API registra 584 arquivos, 588 simulados publicáveis e 17.684 questões; 192 simulados da 2ª/3ª série do Médio ficam no backlog editorial explícito. Conteúdo local em produção foi preservado. Quizzes, missões e mobile continuam pendentes; a próxima tarefa técnica é a migração aditiva e os contratos de quiz (lote 03).

Guia de execução e limites: [CI e regressão](docs/guia-ci-regressao.md). Nenhum deploy foi feito.

---

## Próximas iniciativas

### 1. Recuperação de senha

Backend ainda não implementou os endpoints `/auth/forgot-password` e `/auth/reset-password`. Quando o backend entregar, o frontend precisa de:
- Tela `/esqueci-senha` com campo de e-mail
- Tela `/redefinir-senha?token=...` com campos de nova senha
- Link na tela de login

### 2. Área do responsável

Fora de escopo na integração inicial. O backend já tem os endpoints de vínculo (`/guardians`) e relatórios por aluno. Precisará de uma seção separada no app ou de um app diferente.

### 3. Educação Infantil — pausas entre rodadas

O `SimuladoRunner` já tem a infraestrutura (`pauseRound`, `roundsSeen`) para pausar após a 10ª e 20ª questões na trilha Infantil, com interação do mascote Bolinha. Está parcialmente implementado — verificar o estado atual antes de retomar.

---

## Infraestrutura

- **Deploy:** não configurado (verificar `.claude/launch.json` para config de preview local)
- **CI:** GitHub Actions em `.github/workflows/ci.yml`; tipos, sessão, build normal e regressão HTTP com API/PostgreSQL descartável
- **Testes:** `npm run test:auth` (25 testes de sessão/cookies), `npm run test:e2e` (8 jornadas HTTP), `npm run typecheck` e build normal. Compilação de testes em `.test-build/` (ignorado).
- **Backend esperado em:** `BACKEND_API_URL` (padrão: `http://localhost:3333`)

---

## Decisões arquiteturais registradas

Ver `docs/decisions/` para o raciocínio por trás das escolhas não óbvias do projeto.
