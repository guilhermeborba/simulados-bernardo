# CI e regressão da aplicação web

O workflow `.github/workflows/ci.yml` roda em PRs, pushes na main e execução manual. Usa Node 22.23.2, npm ci com os dois lockfiles, checagem de TypeScript, os testes de sessão, build normal de produção e regressão HTTP integrada.

As Actions oficiais são fixadas por SHA completo, com permissão apenas de leitura e sem persistir credenciais Git. A API pública é fixada no commit `8f1b47b0708e23d6876cd15d1374b0f45e8e4768`, que já contém a rotação de sessão do lote 01. Atualizar esse SHA em uma PR quando houver mudanças coordenadas de contrato; a CI não depende de branches de trabalho ou do seed editorial da API.

Referências oficiais verificadas em 12/10/2026: [checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0) e [sintaxe de versão Node](https://github.com/actions/setup-node#supported-version-syntax).

## Rodar localmente

Após instalar as dependências nos dois repositórios, gerar Prisma e compilar a API:

```bash
npm run prisma:generate --prefix /caminho/para/simulados-bernardo-api
npm run build --prefix /caminho/para/simulados-bernardo-api
npm run typecheck
npm run test:auth
npm run build
E2E_API_DIR=/caminho/para/simulados-bernardo-api npm run test:e2e
```

O runner exige os builds de API e web já existentes. Sem TEST_DATABASE_URL, cria seu próprio PostgreSQL 16 em Docker, com armazenamento tmpfs, porta aleatória somente em 127.0.0.1 e usuário/banco de teste. Remove o container ao terminar. Com TEST_DATABASE_URL, aceita somente um host loopback, porta explícita e usuário/banco `simulados_regression_test`, sem parâmetros adicionais na URL:

```bash
TEST_DATABASE_URL=postgresql://simulados_regression_test:senha_de_teste@127.0.0.1:5432/simulados_regression_test \
E2E_API_DIR=/caminho/para/simulados-bernardo-api npm run test:e2e
```

Cada execução aplica migrations em um schema aleatório próprio, cria dados sintéticos e remove somente esse schema ao terminar. O runner não usa DATABASE_URL como fallback, não carrega `.env` da aplicação web e nunca executa o seed editorial. Segredos de JWT são valores sintéticos, definidos apenas nos processos de teste. A CI fornece um PostgreSQL descartável por job. Se o processo for encerrado à força, o container com prefixo `simulados-web-regression-` poderá exigir limpeza manual; nunca remover containers/bancos que não pertençam ao teste.

## Cobertura e limites

A suíte inicia o servidor Next compilado e a aplicação Nest real. Todas as chamadas passam pelas rotas web/BFF e são persistidas/corrigidas pela API no PostgreSQL. Verifica:

- Registro, login, cookies HttpOnly/Secure/SameSite, contas distintas, renovação concorrente e logout.
- Middleware de páginas protegidas, renderização HTTP de páginas e arquivos WOFF2 reais servidos localmente.
- Catálogo, filtros/sentinelas de Infantil, Técnico, Fundamental e Médio; rascunhos, arquivados, exclusão lógica e turma privada.
- Início/retomada, mapeamento dos quatro tipos de questão, edição/persistência das respostas e correção somente na finalização.
- Resultado, histórico, pontuação, proteção de tentativa alheia e bloqueio de edição após finalizar.
- Entrada por convite, repetição sem duplicar vínculo e liberação de conteúdo apenas ao membro.
- Ausência de tokens, hashes de senha e gabaritos oficiais nos JSONs verificados.

São testes HTTP integrados, sem substituir API, banco ou rotas Next por mocks. Eles não automatizam cliques, hidratação React, interações de teclado, layout ou acessibilidade; esses aspectos continuam exigindo teste de interface. Alterações futuras de UX podem acrescentar uma suíte de navegador. Não são testes de carga ou de múltiplas réplicas do BFF.

## Fontes e build

As cinco famílias utilizadas pela aplicação são arquivos WOFF2 locais reais, licenciados sob SIL OFL 1.1. O build não depende da disponibilidade do Google Fonts nem de respostas mockadas. Famílias, pesos, variáveis CSS, display swap e escopo por rota foram preservados. Fontes latinas incluem as letras acentuadas do português; fallbacks continuam disponíveis para caracteres de outros subconjuntos.

Consultar [fontes e licenças](../app/fonts/README.md) para origem e hashes. Nenhum download de fonte acontece durante o build ou em CI.
