# ADR 010 — Progresso e revisão

Data: 2026-10-13. Status: lote 09; revisão editorial e de uso pendente.

## Decisão

`/progresso` é uma rota protegida para o aluno consultar registros por habilidade e iniciar uma revisão. As 15 faixas usam preferências da conta, com fallback ao ano do perfil informado pela API. Bolinha acompanha Infantil; texto, navegação e cartões seguem o sistema visual existente.

A API calcula primeiras respostas, repetições e revisões. A interface apresenta as contagens separadas, acertos dentro de cada grupo e limite das evidências. INSUFFICIENT aparece como evidência insuficiente; OBSERVED informa registros iniciais disponíveis, sem afirmar domínio. XP não é usado como nota, indicador de habilidade ou condição de revisão.

`POST /me/review-attempts` envia apenas `quizId`. A API escolhe até cinco perguntas de um único quiz publicado e autorizado, segundo dificuldades recentes da mesma habilidade. O cliente nunca envia uma lista de perguntas ou calcula sua correção. A tentativa persistida define `practiceMode: REVIEW`; o runner compartilhado apresenta revisão, `practicedBefore`, confirmações e feedback do servidor. Resultado usa o motivo REVIEW e não anuncia ganho de XP, missão ou itens.

Começar, pausar, recarregar e retomar usam os snapshots e IDs existentes. Histórico permite filtrar quizzes e revisões, mantendo o histórico de simulados separado. Home, navegação e resultado têm acesso ao progresso; revisão aberta não substitui o quiz NORMAL em andamento da home.

GET e POST usam AbortController, geração da sessão e componentes identificados por usuário/geração. Respostas de uma conta anterior não mudam cartões, navegação ou estado de um novo usuário. Falhas de leitura permitem retry; falha após criar a revisão permite repetir o início idempotente. O BFF exige Origin correspondente para o novo POST, mantendo tokens em cookies httpOnly.

## Limites

As habilidades e classificações vêm da API, cuja proposta inicial mantém 45 habilidades/213 perguntas PENDING. A implementação não publica conteúdo. Não há diagnóstico de domínio, ranking de habilidade ou mistura de quizzes na mesma revisão. Visões de responsáveis/professores e recuperação de senha seguem para o lote 10.

As regressões usam API real, Next de produção, PostgreSQL descartável e fixtures sintéticas. Chromium desktop/mobile emulado, teclado, axe, falhas e troca de conta são verificados. Avaliação editorial, pessoas, leitores de tela e aparelhos físicos continuam pendentes. Não houve deploy ou alteração de banco existente.
