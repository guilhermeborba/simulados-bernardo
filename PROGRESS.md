# Estado do Projeto — simulados-bernardo

> Atualizado em: 2026-10-13
> Atualizar este arquivo ao concluir cada feature ou iniciativa relevante.

## Status geral

O frontend de simulados está **integrado com a API e em produção**. A migração dos dados estáticos (`data/*.ts`) para a API está concluída. O app cobre login, seleção, realização, resultado, histórico e ranking de turma. Os lotes 06 e 07 acrescentam a jornada web de quizzes, Aprender hoje, missões e XP; não houve deploy dessas entregas. A revisão e publicação do catálogo editorial de quizzes continuam pendentes.

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
| Entrada com escolha entre quizzes e simulados | ✅ Implementada no lote 06 | — |
| Catálogo de quizzes por segmento, ano/idade, disciplina e tema | ✅ Implementado no lote 06 | — |
| Confirmação com feedback imediato, retomada, resultado e histórico de quizzes | ✅ Implementados no lote 06 | — |
| Preferências de quizzes por conta: filtros, áudio e movimento | ✅ Implementadas no lote 06 | — |
| SVG/WAV autenticados pelo BFF, descrição e transcrição em falha | ✅ Implementados no lote 06 | — |
| Regressão de interface com Chromium desktop/mobile e axe | ✅ 24 testes passaram no lote 06 | — |

---

## Correção de sessão — lote 01 da evolução

Renovação compartilhada somente por hash do refresh token, com retenção curta e proteção de requisições já em andamento. Falhas temporárias preservam cookies; logout invalida o coordenador antes de revogar a sessão na API e impede regravar tokens na resposta pendente. O estado local do usuário é limpo mesmo em falha de logout.

Validação local: npm run test:auth passou 25 testes. Smoke HTTP nas rotas Next compiladas confirmou duas contas independentes, um refresh para chamadas da mesma sessão entre rotas e logout concorrente, incluindo cookies HttpOnly/Secure/SameSite. Build completo passou com fixture temporária de fontes locais; build comum falhou no loader Google Fonts de Source Serif 4 em código não alterado. O download real não foi validado; o build com fixture não é um artefato para deploy.

[ADR 006 — Renovação isolada por sessão](docs/decisions/006-renovacao-isolada-por-sessao.md) registra implementação e limites: coordenação local a um processo e access JWT válido até expirar. Definir coordenação/recuperação antes de ampliar réplicas do BFF. Não houve deploy.

---

## Inventário, regressão e CI — lote 02 da evolução

No lote 02, GitHub Actions passou a executar instalação pelos lockfiles, checagem de tipos, testes de sessão, build normal e regressão HTTP com o servidor Next de produção, BFF, Nest e PostgreSQL real descartável. A API foi fixada inicialmente no commit público `8f1b47b0708e23d6876cd15d1374b0f45e8e4768` da `main`, com rotação de refresh já integrada. A revisão atual de contratos é identificada pelo `ref` no workflow. Nenhum seed editorial ou banco existente é utilizado.

Validação local: `npm run typecheck`, 25 testes de sessão, build normal e 8 jornadas HTTP passaram, inclusive contra o commit exato da API usado na CI. As jornadas verificam registro/login, convites, catálogo por faixa/turma, quatro tipos de questão, início/retomada, edição, conclusão, resultado/histórico, acesso entre contas e cookies de sessão. São testes HTTP; cliques, layout e acessibilidade ainda exigem validação de interface.

As fontes Fredoka, Nunito, Plus Jakarta Sans, Source Serif 4 e IBM Plex Sans são arquivos WOFF2 originais locais, com pesos/variáveis CSS e escopo por rota preservados. Licenças e origem estão em [fontes locais](app/fonts/README.md). O build não depende mais de baixar fontes do Google; a limitação do lote 01 foi resolvida sem fixture substituta.

O inventário da API registra 584 arquivos, 588 simulados publicáveis e 17.684 questões; 192 simulados da 2ª/3ª série do Médio ficam no backlog editorial explícito. Conteúdo local em produção foi preservado. Na conclusão do lote 02, a próxima tarefa técnica era a migração aditiva e os contratos de quiz (lote 03), posteriormente entregues pela API nos lotes 03–05. Missões e mobile seguem no plano de evolução.

Guia de execução e limites: [CI e regressão](docs/guia-ci-regressao.md). Nenhum deploy foi feito.

---

## Jornada web de quizzes — lote 06 da evolução

A página inicial oferece quizzes curtos e os simulados existentes. `/quizzes` apresenta os quizzes publicados e autorizados pela API, com filtros de segmento, ano/idade, disciplina e tema. Atende às 15 faixas previstas: Infantil de 4/5 anos, 1º ao 9º ano, três séries do Médio e Técnico em Enfermagem. A apresentação segue as faixas lúdica, jovem e exame; Infantil recebe o Bolinha e mídia acessível. Catálogos vazios não são preenchidos com atividades fictícias.

`/quiz/:quizId` apresenta uma pergunta por vez: a seleção ainda pode mudar antes de confirmar, a confirmação vem do servidor e libera a explicação, e a resposta confirmada permanece bloqueada. A tentativa fica identificada na URL, pode ser retomada e abre o resultado gravado quando já estiver concluída. Falhas preservam a escolha e permitem repetir a confirmação/conclusão. `/quizzes/historico` separa as rodadas de quizzes; sua paginação de oito itens acontece no cliente, pois o endpoint atual retorna a lista completa.

Filtros de segmento/ano, áudio e movimento são preferências autenticadas da API, isoladas por conta. O frontend serializa alterações, ignora respostas de contas anteriores e mostra falhas sem trocar o valor que havia sido salvo. As escolhas da jornada de quizzes não usam armazenamento local compartilhado entre contas; o fluxo legado de simulados mantém sua trilha existente. Áudio é opcional e nunca inicia sozinho; redução de movimento respeita a conta e a configuração do dispositivo.

Imagens SVG e áudio WAV atravessam o BFF autenticado, incluindo requests de `Range`, sem tokens expostos na URL ou no JSON. Mídia indisponível tem descrição/transcrição e não impede responder. O runner não calcula gabaritos, XP ou recompensas locais.

**Situação editorial:** o acervo inicial da API tem 45 quizzes e 213 questões preparados, todos com revisão `PENDING`. Este lote não os aprova nem publica. A disponibilidade real continua dependendo da revisão e publicação explícita pela equipe.

**Validação local:** tipos, builds, **30 testes de sessão, 16 jornadas HTTP e 24 testes Chromium desktop/mobile emulado** passaram. A suíte cobre os cinco segmentos, filtros das 15 faixas, teclado, axe, confirmação, resposta incorreta, recarga, resultado/histórico, perda de respostas HTTP, fallback de mídia e troca de conta, incluindo cookies atrasados. Os quatro bundles de páginas de quiz foram inspecionados sem gabaritos, identificadores privados de mídia ou fixtures sintéticas. Não houve avaliação com leitores de tela, pessoas ou aparelhos físicos.

[ADR 007 — Jornada web de quizzes](docs/decisions/007-jornada-web-de-quizzes.md) documenta os contratos, isolamento, recuperação de falhas e limites. [CI e regressão](docs/guia-ci-regressao.md) traz os comandos reproduzíveis. O lote 07 implementa missões e XP conforme seção abaixo. Não houve seed em banco existente nem deploy.

---

## Aprender hoje, missões e XP — lote 07 da evolução

A home do aluno reúne saldo de XP, quiz em andamento, duas posições de missão por semana/faixa/turma, próxima atividade e sugestão de quiz, mantendo acesso ao catálogo e aos simulados. A escolha das 15 faixas usa preferências da conta e, na primeira visita, o ano do perfil quando disponível, sem salvar automaticamente um filtro. Bolinha acompanha Infantil e a apresentação adapta o texto por segmento. Visitantes e outros perfis mantêm a escolha existente de quizzes/simulados.

XP vem do backend: **10 por quiz lógico por dia, até 50 XP/dia**, usando America/Sao_Paulo. O resultado exibe a decisão salva de cada conclusão, inclusive repetição/teto/LEGACY, sem conceder XP no navegador ou alterar notas/ranking. Missões não adicionam bônus de XP no piloto. A home mostra progresso persistido, etapas ordenadas e janela semanal; permite pausar, recarregar e repetir consultas. Troca de sessão cancela requisições e substitui o estado da conta. Resultados de versões anteriores são usados somente quando autorizados; origem indisponível oferece prática no quiz atual e conserva progresso.

Os testes encontraram contraste insuficiente em cartões legados da home e cabeçalho sem quebra de linha que dificultava Sair no celular. Cores e layout do HeroStep foram corrigidos pontualmente; o Axe continua verificando a home inteira pública e autenticada.

**Validação:** typecheck/build web, **30 testes de sessão, 23 jornadas HTTP Next/BFF/API e 38 Chromium desktop/mobile emulado** passaram. Incluem duas missões sintéticas em cada faixa, progresso/XP, teto sob seis conclusões simultâneas, reenvio estável, retomada, perfil, turma, falha/retry, conta anterior com resposta atrasada e cookies, teclado e Axe, sem violações detectadas ou overflow horizontal. A API passou 479 unitários/267 casos PostgreSQL, migration sem backfill e testes com barreiras reais de concorrência. O CI fixa o commit compatível da API.

O catálogo preparado mantém 45 quizzes/213 perguntas PENDING. A API oferece um exportador offline com 30 rascunhos de missão para curadoria, sem publicar ou acessar banco. Em 2026-10-13, o responsável pelo projeto assumiu a revisão dos quizzes; a atribuição não aprova conteúdo. Publicação editorial, sessões com pessoas, leitor de tela e aparelhos reais continuam pendentes. Não houve seed em base existente ou deploy.

[ADR 008 — Aprender hoje, missões e XP](docs/decisions/008-aprender-hoje-missoes-e-xp.md) registra os contratos e limites. A próxima tarefa técnica é o **lote 08 — avatar, coleções e conquistas**.

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
- **CI:** GitHub Actions em `.github/workflows/ci.yml`; a API é fixada em commit compatível. Tipos, sessão, build normal e regressão integrada usam PostgreSQL descartável.
- **Testes:** `npm run test:auth` (sessão/cookies), `npm run test:e2e` (HTTP Next/BFF/Nest/PostgreSQL), `npm run test:browser` (Chromium, teclado, viewport mobile e axe), `npm run typecheck` e build normal. Compilação em `.test-build/` e artefatos de navegador são ignorados pelo Git.
- **Backend esperado em:** `BACKEND_API_URL` (padrão: `http://localhost:3333`)

---

## Decisões arquiteturais registradas

Ver `docs/decisions/` para o raciocínio por trás das escolhas não óbvias do projeto.
