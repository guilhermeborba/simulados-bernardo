# ADR 006 — Renovação isolada por sessão no BFF

Data: 2026-10-12
Status: implementado e validado localmente

## Contexto

Uma única refreshPromise global podia entregar credenciais de uma conta a requisições de outra. Remover a promessa assim que resolvida também deixava uma requisição lenta tentar novamente um refresh já consumido. Falhas temporárias apagavam cookies, e logout podia competir com a renovação.

## Decisão

Coordenar renovação pela chave SHA-256 do refresh token. Compartilhar a promessa somente para essa chave. Reter o sucesso por 15 segundos e enquanto existirem requisições daquela sessão já em andamento; registrá-las antes da primeira chamada à API.

Limitar o mapa de renovação a 1.000 entradas e remover entradas expiradas sem requisições ativas. Se o limite for atingido, responder 503 preservando os cookies. Falhas temporárias não são retidas, para permitir nova tentativa.

Uma resposta 401/403 do refresh encerra a sessão local; 429, 5xx e falhas de transporte preservam cookies. Validar ambos os tokens recebidos antes de usá-los. Se o refresh funcionou e a chamada seguinte falhou temporariamente, persistir as credenciais renovadas.

Compartilhar o cliente por globalThis entre bundles de rotas Next do mesmo processo. O core recebe o acesso HTTP por dependência e separa cookies, permitindo testes determinísticos sem simular o contexto Next.

Logout invalida a entrada e os sucessores conhecidos antes de chamar a API. A aplicação de cookies verifica novamente essa invalidação. A API revoga transacionalmente a cadeia de refresh tokens, inclusive quando recebe o token antigo. Cookies locais e estado do usuário são limpos mesmo se a API de logout estiver indisponível; o erro de revogação continua sendo informado.

## Limites operacionais

A coordenação é por processo. Réplicas/processos distintos não compartilham a promessa ou sua janela de sucesso; podem competir pelo mesmo refresh e receber401 da API. Antes de ampliar réplicas do BFF, definir coordenação compartilhada ou recuperação do cliente para essa disputa.

Respostas já enviadas não podem ser canceladas, e access JWT emitido permanece válido até expirar. A revogação backend impede novas renovações; estes limites não equivalem a invalidação imediata de access tokens.

Tokens não são retornados no JSON do navegador nem registrados em logs. O mapa usa hashes como chaves; tokens renovados ficam na memória somente durante a retenção e nas requisições ativas.

## Validação reproduzível

npm run test:auth compila os testes em .test-build/ (ignorado pelo Git) e usa node:test, sem novas dependências. Os 25 testes verificam duas contas simultâneas, renovação compartilhada por sessão, 401 tardio inclusive após a janela curta, cookies NextResponse reais, falhas temporárias, logout, limites e encaminhamento HTTP de headers/body.

O build comum apresentou falha no loader Google Fonts de Source Serif 4 em arquivo não alterado. O build completo passou usando NEXT_FONT_GOOGLE_MOCKED_RESPONSES com fixture temporária em /tmp e fonte local. Essa verificação confirma compilação/tipos/rotas; não confirma o download real de fontes nem constitui um artefato para deploy.
