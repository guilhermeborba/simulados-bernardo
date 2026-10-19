# Simulados Bernardo — aplicação web

Aplicação educacional em Next.js 14, React 18, TypeScript e Tailwind CSS, integrada à [API NestJS/PostgreSQL](https://github.com/guilhermeborba/simulados-bernardo-api). Além dos simulados, o código inclui quizzes curtos, missões, XP, coleção pessoal, progresso por habilidade, revisão e acompanhamento para responsáveis e professores.

## Estado atual

Os lotes 01–10 do plano de evolução estão implementados e integrados à `main`. O lote 10 foi integrado em 13/10/2026 nas PRs [API #213](https://github.com/guilhermeborba/simulados-bernardo-api/pull/213) e [web #45](https://github.com/guilhermeborba/simulados-bernardo/pull/45), com CI aprovada nos dois projetos. A jornada legada de simulados já era usada em produção; não houve deploy dos novos lotes durante este trabalho.

A jornada de quizzes contempla 15 faixas: Infantil de 4/5 anos, 1º ao 9º ano, três séries do Ensino Médio e Técnico em Enfermagem. O catálogo preparado tem **45 quizzes/213 perguntas, 45 habilidades/213 classificações e 30 rascunhos de missão**, todos pendentes de revisão editorial (`PENDING`) e publicação. Conteúdo preparado não significa catálogo disponível aos alunos.

A recuperação de senha está integrada ao Resend e permanece desativada por padrão na API. Envio real depende de habilitação, chave, remetente verificado e URL pública configurados no backend. Avaliação com pessoas, leitores de tela e aparelhos Android/iOS físicos ainda está pendente. O **lote 11 está em andamento**, com [protótipo Expo e prova automatizada](mobile/README.md); a validação física continua pendente. O app/beta do lote 12 ainda não foi iniciado.

## Jornadas e rotas

| Rota | Finalidade |
|---|---|
| `/` | Aprender hoje para o aluno e entrada dos simulados |
| `/simulado/:simulationId`, `/historico`, `/ranking` | Realização, histórico e pontuação dos simulados |
| `/quizzes`, `/quiz/:quizId`, `/quizzes/historico` | Catálogo, confirmação com feedback, retomada e histórico de quizzes/revisões |
| `/colecao` | Conquistas, itens e personalização da conta |
| `/progresso` | Evidências por habilidade e início de revisão |
| `/acompanhamento` | Leitura dos alunos autorizados por vínculo para responsáveis, professores e ADMIN |
| `/login`, `/registro`, `/convite` | Acesso e entrada em turma |
| `/esqueci-senha`, `/redefinir-senha` | Solicitação e redefinição de senha; o link usa `#token=...` |

O BFF em `/api/backend/*` mantém tokens em cookies httpOnly e encaminha somente os contratos permitidos à API. Questões, correção, recompensas e autorização vêm do backend. As preferências de quizzes são salvas por conta na API; a trilha legada de simulados conserva sua escolha em localStorage. Imagens e áudio autenticados oferecem descrição/transcrição em falha; áudio não inicia automaticamente.

Quizzes normais concedem 10 XP por quiz lógico por dia, até 50 XP/dia, no fuso America/Sao_Paulo. Revisões não concedem XP, progresso de missão ou itens. Simulados concluídos e prática por habilidade são apresentados separadamente; a área de acompanhamento não responde em nome do aluno.

## Prova mobile

O diretório [mobile/](mobile/README.md) contém a aplicação Expo isolada; [packages/api-contracts](packages/api-contracts/README.md) compartilha tipos públicos com o cliente web. Não há dependência React Native no build Next. Arquitetura provisória, mapa de telas, testes e gate em aparelhos reais estão no [plano mobile](https://github.com/guilhermeborba/simulados-bernardo-api/blob/main/docs/superpowers/plans/2026-10-13-mobile-proof-and-beta-plan.md).

## Desenvolvimento local

Requisitos: Node.js 22.23.2, npm e a API disponível em `http://localhost:3333`. Para preparar a API, seguir o [README do backend](https://github.com/guilhermeborba/simulados-bernardo-api#readme), incluindo PostgreSQL, variáveis de ambiente e migrations locais. Importação editorial e publicação são etapas próprias, descritas nos guias do backend.

Na aplicação web:

```bash
npm ci
cp .env.local.example .env.local
npm run dev
```

O arquivo `.env.local` define somente a URL da API para o servidor web:

```env
BACKEND_API_URL=http://localhost:3333
```

Abra `http://localhost:3000`. Chave e remetente Resend pertencem à configuração da API e não devem ser incluídos no frontend. Para executar o build de produção local:

```bash
npm run build
npm run start
```

## Verificação

A validação final do lote 10 passou **30 testes de sessão, 48 casos HTTP em 6 suítes e 78 testes Chromium desktop/mobile emulado**, além de tipos e build. A API passou 688 unitários e 395 casos reais Nest/PostgreSQL. Esses resultados não representam revisão pedagógica, envio real de e-mail, aparelhos físicos ou deploy.

```bash
npm run typecheck
npm run test:auth
npm run build
E2E_API_DIR=/caminho/para/simulados-bernardo-api npm run test:e2e
npx playwright install chromium
E2E_API_DIR=/caminho/para/simulados-bernardo-api npm run test:browser
```

Os runners integrados exigem a API compilada e Prisma gerado. Usam PostgreSQL e dados sintéticos descartáveis; não executam o seed editorial nem devem ser apontados para uma base existente. Consulte o [guia de CI e regressão](docs/guia-ci-regressao.md) para preparação e limites.

## Documentação

- [PROGRESS.md](PROGRESS.md): entregas por lote, validação atual e pendências.
- [Plano de evolução canônico — API](https://github.com/guilhermeborba/simulados-bernardo-api/blob/main/docs/superpowers/plans/2026-10-12-evolucao-quizzes-gamificacao-mobile-plan.md): lotes 01–12 e próxima etapa mobile.
- [CI e regressão](docs/guia-ci-regressao.md): execução local e cobertura.
- [Decisões arquiteturais](docs/decisions/): BFF, sessão, quizzes, gamificação, progresso e recuperação.
- [Fontes locais e licenças](app/fonts/README.md): cinco famílias WOFF2, sem download durante o build.

## Giz web e Expo

O redesign Giz está integrado às jornadas existentes. As rotas de quizzes, missões, progresso, coleções e acompanhamento são preservadas; Aprender hoje fica em `/aprender`. O app inicia na home Giz e oferece seu catálogo do Fundamental I.

Veja [a implementação e os contratos Giz](docs/giz/IMPLEMENTACAO.md), inclusive a ordem migration/API/clientes. Tokens: `npm run tokens:generate`; validação: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
