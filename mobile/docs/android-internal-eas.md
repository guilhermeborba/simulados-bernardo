# APK interno Android — Expo/EAS

Configuração preparada em 15/10/2026, com autorização do responsável para usar a
API Railway e a aplicação Vercel existentes. O redesign completo web/mobile será
uma frente posterior; este APK mantém o layout funcional atual.

## Projeto e perfil

- Organização: `guilhermesborbas-team`.
- Projeto: https://expo.dev/accounts/guilhermesborbas-team/projects/simulados-bernardo
- ID: `d03c6091-0858-4150-9de5-ae051ed5f83a`.
- Perfil `internal`: distribuição interna, `developmentClient: false`, APK release.
- App Android: `com.simuladosbernardo.proof.internal`, separado da prova local.
- API: https://simulados-bernardo-api-production.up.railway.app
- Web: https://simulados-bernardo.vercel.app

Os endereços são públicos e estão no perfil, sem segredos no bundle. O app usa
a base real da plataforma: contas, respostas e tentativas são persistidas nesse
ambiente. Não há importação de conteúdo ou alteração de backend durante o build.
Os simulados abrem na web e podem exigir login próprio no navegador; quizzes
continuam no runner nativo. Cadastro e recuperação dependem do fluxo web existente.

## Gerar e instalar

Na raiz do repositório web:

```bash
cd mobile
npm ci
npx eas-cli@24.14.0 whoami
npx eas-cli@24.14.0 build --platform android --profile internal
```

Use uma conta com acesso à organização. O projeto já está vinculado em
`app.config.ts`; não execute `eas init` na raiz Next.js. O EAS gerencia a
assinatura Android remotamente e incrementa `versionCode`. Não versione keystores
ou credenciais; `.easignore` exclui credenciais locais, caches e diretórios nativos,
permitindo prebuild limpo a partir da configuração Expo.

Após conclusão, abra o link de instalação da página do build no Android, baixe
o APK e autorize a instalação por esse navegador quando solicitado. A versão
interna funciona sem Metro ou computador ligado; exige internet para acessar a
plataforma. Não é publicação na Google Play.

Validação local: typecheck, 60 testes de lógica e 7 testes de telas passaram.
A instalação em aparelho físico e o aceite das jornadas continuam necessários.

Primeiro build enviado: [15e0ba42](https://expo.dev/accounts/guilhermesborbas-team/projects/simulados-bernardo/builds/15e0ba42-3920-4a49-ace3-34b74b5fc9a6), versão 0.0.1, versionCode 2. A assinatura foi criada pelo EAS e o bundle Android exportou localmente com os dois endereços HTTPS. O estado final do build deve ser conferido antes de divulgar a instalação.
