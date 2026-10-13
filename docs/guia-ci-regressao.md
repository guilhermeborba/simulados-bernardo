# CI e regressão da aplicação web

O workflow `.github/workflows/ci.yml` roda em PRs, pushes na main e execução manual. Usa Node 22.23.2, `npm ci` com os dois lockfiles, checagem de TypeScript, testes de sessão, build normal e regressão integrada com Next/BFF, Nest e PostgreSQL.

As Actions oficiais são fixadas por SHA completo, com permissão apenas de leitura e sem persistir credenciais Git. O campo `ref` do checkout da API no workflow identifica o commit compatível. A jornada de quizzes requer os contratos de quiz, mídia e preferências; atualizar esse SHA na PR quando houver mudanças coordenadas de contrato. A CI não deve depender de uma branch de trabalho em movimento nem do seed editorial da API.

Referências oficiais verificadas em 12/10/2026: [checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0) e [sintaxe de versão Node](https://github.com/actions/setup-node#supported-version-syntax).

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

Os fixtures incluem quizzes de todas as 15 faixas, versões e estados diferentes, mídia genérica registrada e uma turma privada. São atividades sintéticas, sem importação/publicação dos 45 quizzes e 213 questões editoriais que continuam com revisão `PENDING`.

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
- Ausência de tokens, hashes de senha, identificadores internos de assets e gabaritos oficiais nos JSONs verificados.

## Interface, teclado e acessibilidade automatizada

`npm run test:browser` executa Chromium com duas configurações: desktop de 1280 × 900 e mobile de 390 × 844 com toque emulado. Usa a aplicação de produção, o BFF e a API/banco reais. Exercita seleção, confirmação, recarregamento, retomada, conclusão e histórico; verifica persistência de filtros e isolamento entre contas. Também injeta falhas controladas de transporte e mídia para verificar que a seleção, descrição ou transcrição permitem continuar.

A suíte verifica interação por teclado, foco e ausência de overflow horizontal nos estados avaliados. As checagens axe usam regras WCAG A/AA de 2.0 e 2.1 nas telas inspecionadas. O cenário mobile é emulação em Chromium, não execução em aparelho físico. Não afirmar compatibilidade validada com Safari/iOS, leitores de tela ou usuários reais a partir desses resultados.

Capturas de falha e traces são artefatos locais ignorados pelo Git. `QUIZ_SCREENSHOT_DIR=/diretorio` permite salvar as capturas de referência dos cenários que oferecem essa opção. O trace de um teste com falha pode ser aberto com `npx playwright show-trace /caminho/trace.zip`. Dados desses testes são sintéticos; os runners não devem ser apontados para sessões ou bancos de produção.

O áudio nunca deve possuir `autoplay`; a suíte verifica reprodução pausada e transcrição em falha. Movimento desabilitado e `prefers-reduced-motion` são verificados nos cenários correspondentes. Esses checks são uma base técnica e não substituem revisão pedagógica, pesquisa de usabilidade, avaliação com pessoas com deficiência ou leitores de tela.

## Limites e fontes

Os testes não são de carga, infraestrutura com várias réplicas, dispositivos reais ou revisão editorial. A coordenação de refresh continua local a um processo, conforme o ADR 006. Quizzes não alteram a regra de edição antes da finalização dos simulados e ainda não oferecem missões ou XP.

As cinco famílias da aplicação são arquivos WOFF2 locais reais licenciados sob SIL OFL 1.1. O build não depende da disponibilidade do Google Fonts nem de respostas mockadas. Famílias, pesos, variáveis CSS, `display: swap` e escopo por rota foram preservados. Fontes latinas incluem as letras acentuadas do português; fallbacks continuam disponíveis para outros subconjuntos.

Consultar [fontes e licenças](../app/fonts/README.md) para origem e hashes. Nenhum download de fonte acontece durante build ou CI. Os totais e resultados da validação final ficam em [PROGRESS.md](../PROGRESS.md), sem confundi-los com aprovação editorial ou deploy.


## Lote 07 — Aprender hoje, missões e XP

A regressão HTTP inclui home/XP, duas missões sintéticas em cada uma das 15 faixas, evolução de etapas, reenvio de conclusão, teto diário sob finalizações concorrentes, acesso por turma e fallback do perfil. Chromium verifica a home em desktop/mobile, navegação entre etapas e resultado, seleção das faixas, recuperação de consulta, troca de conta com resposta atrasada e axe.

Execute `E2E_API_DIR=/caminho/da/api npm run test:e2e` e `E2E_API_DIR=/caminho/da/api npm run test:browser` depois dos builds de produção web/API e da geração Prisma. O harness cria PostgreSQL e schema descartáveis, aplica as migrations e remove as fixtures ao terminar. Não utilizar URL de banco existente: as mesmas proteções de banco isolado do lote 06 continuam aplicadas.

Os rascunhos editoriais de missão são validados na API com `npm run seed:missions:dry-run`; o exportador offline não publica conteúdo nem acessa banco. A atualização do commit da API no CI acompanha cada mudança do contrato.
