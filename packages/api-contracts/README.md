# Contratos públicos da API

`src/index.ts` contém os tipos públicos usados pela web e pela prova mobile. São declarações TypeScript sem código de execução, imports Nest/Prisma, transporte HTTP ou conteúdo editorial. O cliente web os importa e reexporta para preservar seus consumidores; o mobile usa imports de tipo.

A fonte foi extraída das projeções públicas existentes de `lib/apiClient.ts`. Alterações de contrato precisam de revisão e teste com a API real: estes tipos não validam JSON e o OpenAPI atual ainda não descreve todas as respostas. Não exportar modelos de banco, gabaritos ou snapshots privados aqui.

Ver [prova mobile](../../mobile/README.md) e [estado do projeto](../../PROGRESS.md).
