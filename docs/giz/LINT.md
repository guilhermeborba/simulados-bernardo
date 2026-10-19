# ESLint da aplicação web

Configuração adicionada em 17/10/2026, mantendo o Next.js 14.2.35 instalado e os scripts existentes do projeto.

## Instalar e executar

A partir da raiz do repositório:

```bash
npm ci
npm run lint
npm run typecheck
```

O lockfile da raiz registra as dependências da web. O ESLint está fixado em `8.57.1` e `eslint-config-next` em `14.2.35`, compatíveis com o comando `next lint` desta versão do framework. O npm pode informar a descontinuação das dependências legadas; esta configuração não atualiza o framework nem migra para a API de configuração do ESLint 9.

A configuração `.eslintrc.json` usa `root: true` e o conjunto oficial `next/core-web-vitals`, incluindo regras React, hooks, acessibilidade e Next. Não desliga regras globalmente e não ignora erros durante o build.

O script verifica `app`, `components`, `contexts`, `lib`, `tests`, `scripts`, contratos públicos em `packages/api-contracts/src`, middleware e arquivos de configuração da web. `--max-warnings 0` torna avisos uma falha da verificação. O aplicativo Expo em `mobile/` mantém suas dependências e verificações próprias.

Para conferir todos os arquivos sem reutilizar o cache:

```bash
npm run lint -- --no-cache
```

O lint não substitui o TypeScript nem os testes. `npm run build` também executa a integração ESLint do Next; o script acima tem escopo explícito mais amplo, incluindo contextos, testes e scripts auxiliares. Não é usado `--fix` global.

## Ajustes feitos para atender às regras

Os SVGs locais das telas usam `next/image` com `unoptimized` explícito, mantendo os arquivos aprovados, texto alternativo e CSS. Não há transformação raster desses SVGs. O Tuca informa as dimensões intrínsecas de 524 × 500 e mantém altura escolhida/`width: auto`, preservando a proporção do asset.

O efeito de carregamento do perfil depende do identificador do usuário e do contador de atualização, que são os valores que ele lê. As demais regras de hooks continuam ativas.

## Evidência

- `npm run lint -- --no-cache`: aprovado, sem avisos nem erros.
- `npm run typecheck`: aprovado.
- Consistência de `package.json`/`package-lock.json` verificada com `npm ci --dry-run --offline --ignore-scripts --no-audit --no-fund` em pasta temporária; não altera as dependências de outro projeto.
- A validação visual após a migração de imagens é registrada no relatório final da integração. Ver também [IMPLEMENTACAO.md](IMPLEMENTACAO.md).

Referência oficial da versão utilizada: [ESLint no Next.js 14](https://nextjs.org/docs/14/app/building-your-application/configuring/eslint).
