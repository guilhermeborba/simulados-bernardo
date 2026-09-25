# ADR 004 — Middleware de proteção verifica o refresh token, não o access token

**Data:** 2026-09-25
**Status:** vigente

## Contexto

O middleware em `middleware.ts` protege rotas como `/simulado/*` e `/historico`, redirecionando para `/login` visitantes não autenticados. Era preciso decidir qual cookie usar como sinal de "está autenticado".

## Decisão

O middleware verifica a **presença** do cookie `sb_refresh_token`, não do `sb_access_token`.

```ts
const hasRefreshToken = request.cookies.has(REFRESH_TOKEN_COOKIE);
```

## Por que o refresh token e não o access token

O access token expira em **15 minutos**. Se o middleware verificasse o access token, um usuário com sessão válida que ficou 20 minutos sem interagir seria redirecionado para o login mesmo tendo um refresh token válido de 7 dias — experiência péssima.

O refresh token dura 7 dias. Verificar sua presença diz "este usuário tem uma sessão ativa" com precisão razoável.

## O que acontece quando o access token expirou mas o refresh ainda é válido

O middleware deixa a requisição passar (refresh token presente). A primeira chamada autenticada vai ao backend com o access token expirado, recebe 401, e o `authenticatedBackendFetch` dispara o refresh automático, atualiza os cookies e repete a chamada — tudo transparente para o usuário.

## Limitação aceita

O middleware não valida o refresh token criptograficamente — apenas verifica se o cookie existe. Um cookie malformado ou adulterado passaria pelo middleware mas falharia na primeira chamada real ao backend (que valida o token de verdade). O custo de uma validação real no middleware (parsear o JWT, verificar assinatura) foi considerado desproporcional ao benefício para uma aplicação escolar de baixo risco.
