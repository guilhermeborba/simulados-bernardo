# CI e regressão da aplicação web

O workflow `.github/workflows/ci.yml` roda em PRs, pushes na main e execução manual. Usa Node 22.23.2, `npm ci` com os dois lockfiles, checagem de TypeScript, testes de sessão, build normal e regressão integrada com Next/BFF, Nest e PostgreSQL.

As Actions oficiais são fixadas por SHA completo, com permissão apenas de leitura e sem persistir credenciais Git. O campo `ref` do checkout da API no workflow identifica o commit compatível. A jornada de quizzes requer os contratos de quiz, mídia e preferências; atualizar esse SHA na PR quando houver mudanças coordenadas de contrato. A CI não deve depender de uma branch de trabalho em movimento nem do seed editorial da API.

Referências oficiais verificadas em 12/10/2026: [checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0) e [sintaxe de versão Node](https://github.com/actions/setup-node#supported-version-syntax).

## Estado da validação

A consolidação de 13/10/2026 registra os lotes 01–10 integrados à `main`. A validação final do lote 10 passou:

| Camada | Resultado |
|---|---|
| Web: tipos e build de produção | Passou |
| Web: sessão/cookies | 30 testes |
| Web: HTTP Next/BFF/Nest/PostgreSQL | 48 casos em 6 suítes |
| Web: Chromium desktop/mobile emulado | 78 testes |
| API: unitários | 688 testes em 39 suítes |
| API: integração Nest/PostgreSQL | 395 casos em 21 suítes |

As PRs [API #213](https://github.com/guilhermeborba/simulados-bernardo-api/pull/213) e [web #45](https://github.com/guilhermeborba/simulados-bernardo/pull/45) foram integradas em 13/10/2026, com [CI da API aprovada](https://github.com/guilhermeborba/simulados-bernardo-api/actions/runs/38438311892) e [CI web aprovada](https://github.com/guilhermeborba/simulados-bernardo/actions/runs/38439597355). O SHA compatível da API é `e0b19669723de7d67c778fcc08a3f300b0003fa1`; permanece fixado no workflow até uma mudança coordenada de contrato.

As suítes atuais cobrem simulados, quizzes, missões/XP, coleção, progresso/revisão, acompanhamento por vínculo e recuperação. Os totais históricos por lote estão em [PROGRESS.md](../PROGRESS.md). Aprovação técnica não publica conteúdo editorial, ativa Resend, aplica migrations em uma base existente ou valida aparelhos físicos.

## Rodar localmente

Instalar as dependências nos dois repositórios, gerar Prisma e compilar a API. O runner exige os builds de API e web já existentes.

```bash
npm ci --prefix /caminho/para/simulados-bernardo-api
npm run prisma:generate --prefix /caminho/para/simulados-bernardo-api
npm run build --prefix /caminho/para/simulados-bernardo-api
npm ci
npm run typecheck
npm run test:auth
npm run build
E2E_API_DIR=/caminho/para/simulados-bernardo-api npm run test:e2e
```

Para a suíte de interface, instalar o Chromium usado pelo Playwright e executar o runner de navegador:

```bash
npx playwright install chromium
E2E_API_DIR=/caminho/para/simulados-bernardo-api npm run test:browser
```

Em um Linux sem dependências de sistema do navegador, a instalação correspondente usa `npx playwright install --with-deps chromium`. O runner `test:browser` inicia os mesmos servidores reais e o mesmo isolamento de banco do runner HTTP; configura automaticamente `E2E_WEB_URL` e `E2E_FIXTURE_PATH`. Executar `playwright test` diretamente sem esse contexto não prepara o ambiente.

Sem `TEST_DATABASE_URL`, cada execução cria seu próprio PostgreSQL 16 em Docker, com armazenamento tmpfs, porta aleatória somente em `127.0.0.1` e usuário/banco de teste. Remove o container ao terminar. Com `TEST_DATABASE_URL`, aceita somente host loopback, porta explícita e usuário/banco `simulados_regression_test`, sem parâmetros adicionais na URL:

```bash
TEST_DATABASE_URL=postgresql://simulados_regression_test:senha_de_teste@127.0.0.1:5432/simulados_regression_test \
E2E_API_DIR=/caminho/para/simulados-bernardo-api npm run test:e2e
```

Cada execução aplica migrations em um schema aleatório próprio, cria dados sintéticos e remove somente esse schema ao terminar. O runner não usa `DATABASE_URL` como fallback, não carrega `.env` da aplicação web e nunca executa o seed editorial. Segredos JWT são valores sintéticos definidos apenas nos processos de teste. A CI fornece um PostgreSQL descartável por job. Se o processo for encerrado à força, o container com prefixo `simulados-web-regression-` poderá exigir limpeza manual; remover somente o container criado pelo teste.

Os fixtures incluem quizzes de todas as 15 faixas, versões e estados diferentes, mídia genérica registrada e uma turma privada. São atividades sintéticas, sem importação/publicação dos 45 quizzes/213 perguntas, 45 habilidades/213 classificações e 30 rascunhos de missão editoriais, que continuam com revisão `PENDING`. Atribuir a revisão ao responsável pelo projeto não aprovou conteúdo.

## Sessão e contratos HTTP

`npm run test:auth` compila os testes em `.test-build/` e usa `node:test` para o coordenador de sessão, cookies e proxy. Inclui duas contas simultâneas, compartilhamento por sessão, 401 tardio, falhas temporárias, logout e encaminhamento validado de mídia binária.

`npm run test:e2e` inicia o servidor Next compilado e a aplicação Nest real. Todas as chamadas passam pelas rotas web/BFF e são persistidas/corrigidas pela API no PostgreSQL. Verifica:

- Registro, login, cookies HttpOnly/Secure/SameSite, contas distintas, renovação concorrente e logout.
- Middleware de páginas protegidas, páginas renderizadas por HTTP e arquivos WOFF2 reais servidos localmente.
- Catálogos, filtros/sentinelas de Infantil, Técnico, Fundamental e Médio; rascunhos, arquivados, exclusão lógica e turma privada.
- Simulados: início/retomada, quatro tipos de questão, edição/persistência, correção ao finalizar, resultado, histórico e pontuação.
- Quizzes: versão publicada mais recente, snapshots, confirmação com feedback apenas após responder, repetição idempotente, conflito de alteração após confirmar e resultado completo.
- Histórico de quizzes separado do histórico de simulados, acesso entre contas e revogação da participação na turma.
- Preferências persistidas por conta, valores padrão, filtros incompatíveis e validação de tipos/campos.
- SVG/WAV autenticados, MIME, cache privado, ranges, caminhos inválidos e ausência de tokens em query.
- Aprender hoje, missões nas 15 faixas, teto diário de XP e conclusões concorrentes/idempotentes.
- Conquistas, itens bloqueados/liberados e personalização persistida por conta, sem alterar notas ou XP.
- Evidências de primeiras respostas/repetições/revisões, retomada por modo e ausência de recompensas em REVIEW.
- Acompanhamento por responsável/docente/ADMIN, revogação de vínculos e separação entre simulados e prática.
- Recuperação com captura sintética de e-mail, consumo único, concorrência, revogação de sessões e validação de origem/DTO.
- Ausência de tokens, hashes de senha, identificadores internos de assets e gabaritos oficiais nos JSONs verificados.

## Interface, teclado e acessibilidade automatizada

`npm run test:browser` executa Chromium com duas configurações: desktop de 1280 × 900 e mobile de 390 × 844 com toque emulado. Usa a aplicação de produção, o BFF e a API/banco reais. Exercita seleção, confirmação, recarregamento, retomada, conclusão e histórico; verifica persistência de filtros e isolamento entre contas. Também injeta falhas controladas de transporte e mídia para verificar que a seleção, descrição ou transcrição permitem continuar.

A suíte verifica interação por teclado, foco e ausência de overflow horizontal nos estados avaliados. As checagens axe usam regras WCAG A/AA de 2.0 e 2.1 nas telas inspecionadas. O cenário mobile é emulação em Chromium, não execução em aparelho físico. Não afirmar compatibilidade validada com Safari/iOS, leitores de tela ou usuários reais a partir desses resultados.

Capturas de falha e traces são artefatos locais ignorados pelo Git. `QUIZ_SCREENSHOT_DIR=/diretorio` permite salvar as capturas de referência dos cenários que oferecem essa opção. O trace de um teste com falha pode ser aberto com `npx playwright show-trace /caminho/trace.zip`. Dados desses testes são sintéticos; os runners não devem ser apontados para sessões ou bancos de produção.

O áudio nunca deve possuir `autoplay`; a suíte verifica reprodução pausada e transcrição em falha. Movimento desabilitado e `prefers-reduced-motion` são verificados nos cenários correspondentes. Esses checks são uma base técnica e não substituem revisão pedagógica, pesquisa de usabilidade, avaliação com pessoas com deficiência ou leitores de tela.

## Limites e fontes

Os testes não são de carga, infraestrutura com várias réplicas, dispositivos reais ou revisão editorial. A coordenação de refresh continua local a um processo, conforme o ADR 006. Quizzes preservam a regra de edição antes da finalização dos simulados. A suíte inclui missões/XP, coleção, revisões e acompanhamento/recuperação entregues nos lotes 07–10. Revisões não concedem recompensas; resultados de simulados e prática são verificados separadamente.

As cinco famílias da aplicação são arquivos WOFF2 locais reais licenciados sob SIL OFL 1.1. O build não depende da disponibilidade do Google Fonts nem de respostas mockadas. Famílias, pesos, variáveis CSS, `display: swap` e escopo por rota foram preservados. Fontes latinas incluem as letras acentuadas do português; fallbacks continuam disponíveis para outros subconjuntos.

Consultar [fontes e licenças](../app/fonts/README.md) para origem e hashes. Nenhum download de fonte acontece durante build ou CI. Os totais e resultados da validação final ficam em [PROGRESS.md](../PROGRESS.md), sem confundi-los com aprovação editorial ou deploy.


## Lote 07 — Aprender hoje, missões e XP

A regressão HTTP inclui home/XP, duas missões sintéticas em cada uma das 15 faixas, evolução de etapas, reenvio de conclusão, teto diário sob finalizações concorrentes, acesso por turma e fallback do perfil. Chromium verifica a home em desktop/mobile, navegação entre etapas e resultado, seleção das faixas, recuperação de consulta, troca de conta com resposta atrasada e axe.

Use os comandos da seção [Rodar localmente](#rodar-localmente), após os builds de produção web/API e a geração Prisma. O harness cria PostgreSQL e schema descartáveis, aplica as migrations e remove as fixtures ao terminar. Não utilizar URL de banco existente: as mesmas proteções de banco isolado do lote 06 continuam aplicadas.

Os rascunhos editoriais de missão são validados na API com `npm run seed:missions:dry-run`; o exportador offline não publica conteúdo nem acessa banco. A atualização do commit da API no CI acompanha cada mudança do contrato.

## Avatar, coleções e conquistas — lote 08

A CI usa o commit da API identificado em `.github/workflows/ci.yml`, com a migration aditiva de ownership e backfill de progresso válido do lote 07. Não utiliza catálogo editorial publicado nem banco existente.

`tests/e2e/collection-regression.test.mjs` valida autenticação, DTO estrito, Origin, itens bloqueados/liberados, temas normalizados, versão/repetição, notas e XP, missão após teto diário e seleção persistida em outra sessão. `tests/browser/collections.spec.ts` verifica as 15 faixas e os estilos automáticos/explicitos, teclado, bloqueio de itens, salvar/reabrir em outro navegador, retry de leitura/gravação, troca de conta com respostas GET/PATCH atrasadas, cookies, Axe e overflow.

Use os comandos da seção [Rodar localmente](#rodar-localmente), após compilar API e web. `QUIZ_SCREENSHOT_DIR=/diretorio/temporario` salva capturas de fixtures sintéticas durante os testes de interface. Não reconstrua `.next` enquanto o servidor de regressão estiver executando.

## Habilidades e revisão — lote 09

`tests/e2e/progress-review-regression.test.mjs` verifica progresso nas 15 faixas, primeira resposta/repetição/revisão, perguntas inéditas em revisão que depois contam como repetição NORMAL, snapshots, retomada por modo, idempotência e ausência de XP/missão/itens em REVIEW. Também cobre DTO estrito, origem do POST no BFF, outra conta, turma revogada e conteúdo indisponível.

`tests/browser/progress-review.spec.ts` verifica cartões de evidência insuficiente, sugestões, teclado, confirmação, feedback, recarga e retomada, resultado, filtros de histórico, falhas/retry e respostas GET/POST atrasadas durante troca de conta. Axe e ausência de overflow são verificados em desktop e mobile emulado. `QUIZ_SCREENSHOT_DIR=/tmp/capturas` salva referências sintéticas.

Compile API e web conforme a seção [Rodar localmente](#rodar-localmente). A CI fixa o commit compatível da API com skills/review e aplica migrations apenas em PostgreSQL descartável. As propostas editoriais permanecem PENDING; nenhum seed em base existente é necessário.

## Acompanhamento e recuperação de senha — lote 10

`tests/e2e/oversight-recovery-regression.test.mjs` acrescenta leitura por responsável/docente, escopo público e de turma atribuída, revogação, ausência de perguntas/gabaritos e separação entre simulados e prática. A recuperação verifica resposta neutra para contas existentes/inexistentes, cooldown, troca de senha sem auto-login, invalidação de sessões antigas, consumo único sob confirmações concorrentes, falha de entrega e DTOs/Origin. Senhas novas têm mínimo de oito caracteres Unicode e máximo de 72 bytes UTF-8.

O harness cria um servidor de captura de e-mail em `127.0.0.1`, porta aleatória, com credencial e remetente sintéticos. Encaminha o contrato de envio da API ao loopback por `RESEND_API_URL`, mantém mensagens somente em memória e aceita somente destinatários `@example.test`. `E2E_MAIL_URL` é preenchido automaticamente para os testes consultarem essas mensagens e simularem falhas; não é uma configuração de produção e não deve apontar para o Resend real. A remoção do servidor acompanha o cleanup dos processos/schema de teste. Nenhuma chave externa ou caixa de e-mail é necessária para a regressão.

As telas públicas são `/esqueci-senha` e `/redefinir-senha`. O link sintético usa `#token=...`, nunca query string. O cliente remove o fragmento assim que captura o token, inclusive na navegação por hash no mesmo caminho, guarda-o apenas em memória e consome somente no POST explícito de redefinição. Um novo link cancela a requisição antiga, descarta respostas atrasadas e substitui o formulário anterior. As rotas BFF públicas rejeitam origem externa, não alteram cookies de autenticação e retornam erros seguros para JSON inválido ou falha temporária. A confirmação bem-sucedida oferece login normal. Recarregar a página sem o fragmento exige abrir novamente o link completo do e-mail.

`tests/browser/oversight-recovery.spec.ts` verifica a área por papel/vínculo, atualização após revogação, troca de conta com resposta e cookies atrasados, recuperação por teclado, fragmento removido, reabertura de links no mesmo caminho, confirmação da senha e limites Unicode, uso único e retry de transporte. Axe e overflow são checados nos estados de desktop/mobile emulado.

A interface `/acompanhamento` seleciona somente alunos autorizados, consulta resumo/disciplinas de simulados e prática por habilidade, e não inicia tentativas nem revisões. Os caminhos GET de progresso/relatório permitidos no BFF são exatos; respostas de acompanhamento têm cache privado desabilitado. Troca de aluno, de faixa ou de sessão cancela consultas e descarta respostas atrasadas. Falhas de acesso retiram os registros e permitem atualizar a lista de alunos.

Use os comandos da seção [Rodar localmente](#rodar-localmente), após os builds dos dois projetos. Não reconstrua `.next` com os servidores do harness em execução. Os totais e resultados finais são registrados em PROGRESS.md. A captura local valida o contrato; Resend permanece desativado por padrão na API. Ativar o envio real depende de chave e remetente verificado configurados fora do chat, URL pública correta e habilitação na API. Entrega real, reputação do domínio, caixa de entrada/spam e aparelhos físicos continuam pendentes.

[ADR 011](decisions/011-acompanhamento-e-recuperacao.md) registra contratos e decisões. As referências de segurança e integração são o [guia OWASP de recuperação](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) e a [API Send Email do Resend](https://resend.com/docs/api-reference/emails/send-email).


O teste de limite da API mede o IP do chamador imediato. O BFF não encaminha IP de navegador e a API não configura confiança em proxies: usuários do mesmo BFF compartilham os 20 pedidos/minuto por endpoint. Cooldown por conta permanece compartilhado no banco. Ajuste de perímetro/IP confiável exige a política real de deploy e não foi presumido pelo teste.

## Prova mobile — lote 11

O job separado **Mobile bundles and direct API contracts** instala somente `mobile/package-lock.json` e a API compatível, verifica tipos e testes do núcleo/adaptadores/links e das telas com Jest Expo/RNTL, exporta bundles Android/iOS, gera prebuild e executa a integração direta com Bearer contra Nest/PostgreSQL descartável. Ele não inicia Next, não aplica migrations em banco existente e não compila/distribui APK/IPA. O job legado mantém sua regressão de BFF e Chromium.

```bash
npm ci --prefix mobile
npm run typecheck --prefix mobile
npm test --prefix mobile
npm run test:ui --prefix mobile
npm run export:android --prefix mobile
npm run export:ios --prefix mobile
npm run prebuild --prefix mobile
E2E_API_DIR=/caminho/para/api npm run test:integration --prefix mobile
```

As 12 integrações usam schema `mobile_regression_<sufixo>` próprio, transporte de e-mail local sintético e a fixture existente dos cinco segmentos/15 faixas. Sem configuração de teste explícita, a execução falha. Testes de storage/mídia usam portas controladas e não comprovam Keychain/Keystore, reprodução nativa ou acessibilidade física. Execução e limites no [README mobile](../mobile/README.md); o [plano canônico](https://github.com/guilhermeborba/simulados-bernardo-api/blob/main/docs/superpowers/plans/2026-10-13-mobile-proof-and-beta-plan.md) mantém o lote 11 aberto até os aparelhos reais.
