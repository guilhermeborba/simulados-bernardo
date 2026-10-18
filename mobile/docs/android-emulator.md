# Teste Android no emulador

Evidência de 14/10/2026: APK debug x86_64 instalado em `emulator-5554`, Android
17, imagem `sdk_gphone16k_x86_64`. Metro no WSL, ADB do Windows e API sintética
em loopback. A build usa assinatura debug; não foi distribuída como release.

## Preparar

Use Node 22.13+, JDK 17 e SDK Android. O projeto requer plataforma/build-tools
36 e NDK 27.1.12297006; Gradle também resolveu build-tools 35 e CMake 3.22.1.
Instale os pacotes pelo SDK Manager com as licenças aceitas pelo responsável.
Ao extrair manualmente um NDK oficial no Linux, preserve permissões e links
simbólicos: arquivos `clang`/`clang++` precisam apontar para o compilador real.

Na raiz web, `npm ci --prefix mobile`. A API compatível precisa de dependências,
Prisma gerado e build; não é necessário alterar seu bootstrap ou banco existente.
Com o Docker Desktop ativo, inicie uma API com dados sintéticos:

```bash
E2E_API_DIR=/caminho/para/api npm run device:fixture --prefix mobile
```

Se a CLI Docker não estiver no PATH do WSL, configure
`MOBILE_PROOF_DOCKER_BINARY` com o caminho do `docker.exe`. O runner publica o
PostgreSQL somente em loopback e cria schema próprio. A API escuta em
`127.0.0.1:3334`; uma porta diferente exige `MOBILE_PROOF_PORT` entre 1024 e
65535. A saída mostra API_URL e caminho da fixture com permissão 0600.

As contas são sintéticas, como `aluno-mobile@example.test`, com a senha de teste
fixada em `tests/e2e/fixture.mjs`. Não usar credenciais reais nesse ambiente.
O e-mail é capturado localmente. A aplicação web de recuperação não é iniciada.

## Compilar e abrir

Dentro de `mobile/`, com JAVA_HOME e ANDROID_HOME apontando para a toolchain:

```bash
npx expo prebuild --platform android --no-install
cd android
./gradlew :app:assembleDebug -PreactNativeArchitectures=x86_64 --max-workers=2
```

O APK fica em `mobile/android/app/build/outputs/apk/debug/app-debug.apk`. Para
aparelho ARM, ajuste a arquitetura; o APK desta evidência é para emulador x86_64.
No terminal com o ADB que detecta o emulador, use o caminho do APK acessível por
essa plataforma (ADB Windows aceita o caminho UNC do WSL):

```bash
adb devices -l
adb -s emulator-5554 install -r CAMINHO_DO_APK
adb -s emulator-5554 reverse tcp:3334 tcp:3334
adb -s emulator-5554 reverse tcp:8081 tcp:8081
```

Inicie Metro dentro de `mobile/`:

```bash
EXPO_PUBLIC_API_URL=http://127.0.0.1:3334 EXPO_PUBLIC_WEB_ORIGIN=http://127.0.0.1:3000 npm run start -- --localhost --port 8081
```

Abra a build instalada e escolha `http://127.0.0.1:8081` no cliente de
desenvolvimento. Conclua a introdução do menu e feche-o para interagir com as
telas; mantenha o inspetor de elementos desativado durante testes de toque.
O APK debug depende do Metro; não é um instalador autônomo para distribuição.

## Evidências e limites

| Fluxo no emulador | Resultado |
|---|---|
| Instalação e abertura | Passou |
| Login com API real e dados sintéticos | Passou |
| Confirmação, feedback e retomada de quiz | Passou |
| Finalização | 2/2 corretas, +10 XP retornados pela API |
| Histórico por link do esquema instalado | Passou |
| Encerrar processo e reabrir | Sessão restaurada, 10 XP mantidos |
| SVG, áudio, leitor de tela e reinstalação | Pendente |
| Aparelho físico Android | Pendente |

Capturas locais ficam em `.proof/android-emulator-login.png` e
`.proof/android-emulator-result.png`, ignoradas pelo Git. A API é a autoridade
para resultado e XP; os dados são exclusivos da fixture descartável.

Para encerrar, pare Metro e a fixture com Ctrl+C. O runner remove seus processos,
container, schema e arquivos temporários; as regras ADB podem ser removidas com
`adb -s emulator-5554 reverse --remove tcp:3334` e o equivalente para 8081.
O modo normal `test:integration` continua rodando testes e encerrando recursos,
sem permanecer ativo. O encerramento de uma segunda fixture por SIGTERM foi
verificado sem interromper a API usada na sessão interativa.
