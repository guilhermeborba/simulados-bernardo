# ADR 001 — BFF com proxy catch-all `/api/backend/[...path]`

**Data:** 2026-09-25
**Status:** vigente

## Contexto

O frontend precisa fazer chamadas autenticadas ao backend (`simulados-bernardo-api`). Havia duas abordagens:

1. O navegador chama `http://localhost:3333` diretamente, com tokens armazenados em `localStorage` ou memória.
2. O Next.js age como BFF: o navegador só chama rotas internas (`/api/...`) e o servidor faz o proxy.

## Decisão

Adotamos o BFF. Tokens JWT ficam em cookies `httpOnly` — `sb_access_token` e `sb_refresh_token` — inacessíveis a JavaScript no navegador. Para a grande maioria das chamadas ao backend, usamos um único Route Handler catch-all:

```
app/api/backend/[...path]/route.ts
```

Qualquer `fetch('/api/backend/simulations/available')` vira `fetch('http://localhost:3333/simulations/available')` com o `Authorization: Bearer` injetado automaticamente no servidor.

## Por que um catch-all e não uma rota por endpoint

Com a API crescendo, criar um Route Handler por endpoint do backend geraria dezenas de arquivos idênticos. O catch-all cobre todos os prefixos permitidos com um único arquivo:

```ts
const ALLOWED_PREFIXES = ['disciplines', 'simulations', 'attempts', 'me'];
```

Para expor um novo prefixo da API, basta adicionar uma string ao array — sem criar novo arquivo.

A lista de prefixos serve como allowlist explícita: o proxy não repassa rotas de admin, auth (que têm seus próprios handlers), ou qualquer coisa não listada.

## Rotas de auth separadas

Login, logout, register e `/me` têm Route Handlers próprios (`app/api/auth/*`) porque têm efeitos colaterais de cookie (setar/limpar `sb_access_token` e `sb_refresh_token`). O catch-all não tem lógica de cookie — é um proxy puro.

## Consequência

O navegador nunca tem acesso aos tokens JWT. Um ataque XSS bem-sucedido pode fazer fetches autenticados via `/api/backend/*` (o cookie vai junto automaticamente), mas não consegue extrair o token para usar fora do domínio. Isso reduz significativamente o impacto de XSS — decisão deliberada dado que o público inclui dados de crianças.
