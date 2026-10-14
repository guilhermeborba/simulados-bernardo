# Simulados Bernardo — prova mobile (lote 11)

Protótipo nativo em **Expo 57.0.28 / React Native 0.86.3 / React 19.2.3**, separado das dependências Next/React 18 da web. A prova usa a API diretamente com Bearer e compartilha apenas tipos públicos de `../packages/api-contracts`.

**Estado: implementação e prova automatizada disponíveis; validação física pendente.** A escolha Expo é provisória. APK debug x86_64 compilado e instalado localmente no emulador Android 17 em 14/10/2026, com login e navegação para recuperação verificados. Não há build de release, distribuição externa, associação de domínio ou app/beta publicado. Login, retomada/finalização de quiz (+10 XP), histórico e restauração de sessão foram verificados com API descartável. Mídia e aceite físico continuam pendentes. Os bundles Android/iOS e projetos de prebuild têm alcance diferente de uma instalação nativa.

## Rodar e verificar

Requer Node 22.13+ (validado com 22.23.2). Na raiz da aplicação web:

```bash
npm ci --prefix mobile
npm run typecheck --prefix mobile
npm test --prefix mobile
npm run test:ui --prefix mobile
npm run export:android --prefix mobile
npm run export:ios --prefix mobile
npm run prebuild --prefix mobile
```

A integração real requer checkout da API com dependências, Prisma gerado e build:

```bash
E2E_API_DIR=/caminho/para/simulados-bernardo-api npm run test:integration --prefix mobile
```

O runner cria PostgreSQL/schema descartáveis, aplica migrations e usa contas, conteúdo e transporte de e-mail sintéticos. Não usa a base da aplicação ou seed editorial. Docker e `postgres:16-alpine` precisam estar disponíveis; qualquer configuração ausente falha explicitamente.

Para desenvolvimento nativo, copie `.env.example` para `.env` **dentro de mobile/**, ajuste as origens do ambiente autorizado e inicie:

```bash
npm run start --prefix mobile
# Em ambiente com SDK/JDK/ADB compatíveis:
npm run android --prefix mobile
# Somente em macOS com Xcode:
npm run ios --prefix mobile
```

`EXPO_PUBLIC_API_URL` e `EXPO_PUBLIC_WEB_ORIGIN` são origens públicas, sem path/query/fragmento/credencial. Nunca colocar segredos em `EXPO_PUBLIC_*`. O telefone precisa alcançar a API e o Metro: localhost é o próprio aparelho. HTTP é permitido somente em desenvolvimento; a versão distribuída exige HTTPS. WSL, rede, assinatura e aparelhos estão descritos no [guia da prova](https://github.com/guilhermeborba/simulados-bernardo-api/blob/main/docs/guia-prova-mobile.md). Não há tunnel ou build cloud iniciado automaticamente.

## Telas do protótipo

| Rota | Comportamento |
|---|---|
| `/` | Login/restauração; Aprender hoje com XP, missões e retomada para STUDENT |
| `/quizzes`, `/quiz/[id]` | Catálogo por faixa, seleção/confirmar, feedback, mídia, resultado e NORMAL/REVIEW |
| `/history`, `/progress` | Histórico de prática, evidências e revisões separadas de avaliação |
| `/simulations` | Catálogo e abertura da realização na web, sem transferir o Bearer |
| `/profile` | Preferências, itens da coleção, entrada manual de link e logout |
| `/oversight` | Roster e leitura autorizada para responsável/professor/ADMIN |
| `/recovery`, `/entry` | Pedido de recuperação e confirmação por segredo em memória |

Os filtros abrangem as 15 faixas. A API determina acesso, feedback, resultados, XP, itens e sugestões; catálogos vazios não recebem conteúdo inventado. O protótipo não implementa cadastro, runner nativo dos quatro tipos de simulado ou fila offline. O [plano de beta](https://github.com/guilhermeborba/simulados-bernardo-api/blob/main/docs/superpowers/plans/2026-10-13-mobile-proof-and-beta-plan.md) registra essas entregas.

## Sessão, mídia e links

Uma única instância de `MobileSessionClient` atende as telas. Access fica em memória; somente refresh vai para SecureStore. O marcador em cache exige login se estiver ausente, inclusive quando o Keychain conservou um registro antigo; limpeza de cache também exige login. Testes com adaptadores controlados não comprovam Keychain/Keystore ou reinstalação real.

Renovação é única por sessão, com geração/cancelamento e escrita ordenada. 401 tardio reutiliza access atualizado; rede/5xx/429 não apagam o refresh. A API não recupera o sucessor quando a resposta da rotação é perdida após commit: novo login pode ser necessário. JSON tem limite de 2 MiB e deadline/cancelamento durante o corpo. Logout local não presume revogação remota se a rede falhar.

O transporte usa `expo/fetch`, recusa redirects antes de segui-los e omite cookies. Mídia aceita somente rotas de snapshot, MIME e tamanho esperados: SVG até 128 KiB em memória e WAV PCM até 4 MiB em cache privado. Texto/descrição/transcrição permanecem utilizáveis. Áudio depende de ação e é interrompido ao sair/trocar de conta/background; falha de limpeza aparece e pode ser repetida. Não há gravação ou reprodução de áudio em background.

Links secretos aceitam apenas a origem web configurada e ficam em memória; não entram em Router params, armazenamento ou logs. O esquema `simuladosbernardoproof` só navega para telas sem segredo. App Links/Universal Links ainda exigem domínio, assinatura, associação e teste de abertura fria/quente; até lá, a recuperação mantém o fallback web e o protótipo permite entrada manual do link.

## Evidências e fechamento

A prova tem 57 testes de sessão/adaptadores/links, 7 testes de telas com dependências nativas controladas e 12 integrações reais com a API. Os testes de UI verificam confirmação, feedback, retry/XP, troca de quiz/conta e substituição de link sem declararem execução física. Há também testes de sessão/JSON, adaptadores de storage/transporte/mídia, parser de links e integração real cliente/API, além dos bundles e prebuild. Totais e execução atual ficam em [PROGRESS.md](../PROGRESS.md); decisões no [ADR 015](https://github.com/guilhermeborba/simulados-bernardo-api/blob/main/docs/decisions/015-prova-mobile-e-contratos-compartilhados.md).

Para encerrar o lote 11, preencher a matriz em **Android real, prioridade confirmada pelo usuário**: instalação/reabertura/reinstalação, sessão e armazenamento, suspensão/rede, SVG/áudio, leitor de tela, links e troca de conta. A disponibilidade do aparelho ainda aguarda confirmação. iOS fica preparado e requer sua matriz própria antes de um beta iOS. Emulador, testes com doubles, bundle e prebuild não substituem esse registro.

A revisão dos 45 quizzes/213 perguntas, 45 habilidades/213 classificações e 30 rascunhos de missão segue PENDING; envio real Resend, deploy e distribuição continuam separados desta prova.

## Preparação Android: ambientes separados

A configuração aceita `MOBILE_APP_ENV=development` (padrão) ou `internal`.
Os aplicativos usam nomes, esquemas e identificadores diferentes, permitindo
instalação lado a lado e isolamento dos dados de sessão. Os identificadores
`com.simuladosbernardo.proof` e `com.simuladosbernardo.proof.internal` continuam
provisórios; o identificador definitivo da loja depende da titularidade.

O ambiente interno exige `EXPO_PUBLIC_API_URL` e `EXPO_PUBLIC_WEB_ORIGIN`
explícitos com HTTPS, sem credenciais, caminho, query ou fragmento. A configuração
falha antes de export/prebuild quando faltam origens ou são usados placeholders
`.invalid`. Isso valida a configuração, não a disponibilidade dos servidores.
`MOBILE_APP_ENV` é configuração de build; mudar o identificador exige novo
prebuild/build e reinstalação da variante correspondente.

Para conferir o ambiente interno, configure as duas origens autorizadas no
ambiente do processo e execute dentro de `mobile/`:

```bash
MOBILE_APP_ENV=internal npx expo config --type public
MOBILE_APP_ENV=internal npm run export:android
```

Para gerar uma build de desenvolvimento local, com JDK 17, Android SDK 36,
build-tools 36.0.0, NDK 27.1 e licenças previamente aceitas pelo responsável:

```bash
cd mobile
npm ci
npm run android
```

O comando gera/instala uma build debug e precisa de emulador ou aparelho
conectado, além de Metro para executar o código. Não equivale a um APK interno
independente do Metro. Não há assinatura de release, configuração de loja,
servidor interno provisionado ou distribuição habilitada nesta preparação.
A primeira build nativa concluída nesta etapa foi instalada no emulador Android
17 em 14/10/2026; procedimento e evidências no [guia do emulador](docs/android-emulator.md). O teste físico continua pendente. O aceite Android da task 11 segue
pendente enquanto esta parte independente de P1 avança.

## API descartável para o emulador

Com Docker ativo e a API compatível já compilada, o modo abaixo mantém a fixture
sintética em execução até Ctrl+C. A API escuta somente em `127.0.0.1:3334`;
`MOBILE_PROOF_PORT` permite escolher outra porta entre 1024 e 65535. O caminho do
arquivo temporário de fixture é mostrado na saída; o arquivo tem permissão 0600.
As contas de teste usam a senha sintética definida em `tests/e2e/fixture.mjs`.
Nenhum seed editorial ou banco existente é usado.

```bash
E2E_API_DIR=/caminho/para/api npm run device:fixture --prefix mobile
```

No WSL sem CLI Docker no PATH, `MOBILE_PROOF_DOCKER_BINARY` pode apontar para o
`docker.exe` do Docker Desktop. O motor Linux do Docker Desktop precisa estar
iniciado. O runner não inicia o Docker nem altera sua integração com WSL.

Encaminhe API e Metro ao emulador com o ADB que o detecta:

```bash
adb -s emulator-5554 reverse tcp:3334 tcp:3334
adb -s emulator-5554 reverse tcp:8081 tcp:8081
```

Inicie Metro com `EXPO_PUBLIC_API_URL=http://127.0.0.1:3334` e
`EXPO_PUBLIC_WEB_ORIGIN=http://127.0.0.1:3000`. A web de recuperação não é
iniciada pelo runner. Encerrar a fixture remove o schema, o container criado e
os arquivos temporários. O modo padrão `test:integration` continua executando os
testes e encerrando seus recursos automaticamente.
