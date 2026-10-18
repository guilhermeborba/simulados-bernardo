# Giz Kids — aplicativo Expo

Base nativa em **Expo 57.0.28, React Native 0.86.3 e React 19.2.3**, separada das dependências Next/React 18 da web. A escolha Expo foi autorizada pelo responsável. A implementação inclui as telas do MVP e entradas “Em breve” para painel dos pais e criação de simulados. Não há publicação, APK/IPA assinado, associação de domínio ou validação em aparelho nesta entrega.

## Executar

Atualize primeiro a API com a migration de snapshots/feedback imediato e publique a versão compatível da API; só depois instale esta versão do aplicativo. O modo de tentativas em andamento não é alterado: tentativas legadas mantêm a correção ao concluir.

Requer Node 22.13+; a verificação local usa Node 22.23.2.

```bash
npm ci --prefix mobile
cp mobile/.env.example mobile/.env
# Ajuste as duas origens públicas em mobile/.env.
npm run start --prefix mobile
```

O cliente usa a API diretamente com Bearer, sem passar pelo BFF Next. Configure:

- `EXPO_PUBLIC_API_URL`: origem da API, por exemplo `http://127.0.0.1:3333` durante desenvolvimento local.
- `EXPO_PUBLIC_WEB_ORIGIN`: origem web autorizada para convites e links de recuperação.
- `MOBILE_APP_ENV`: `development` ou `internal`, selecionado ao gerar a configuração/build.

Essas variáveis são públicas. Nunca coloque JWTs, senhas ou chaves de e-mail nelas. O telefone precisa alcançar a API e o Metro; `localhost` no telefone é o próprio aparelho. HTTP é permitido apenas no desenvolvimento. O ambiente `internal` exige as duas origens HTTPS explícitas e recusa placeholders `.invalid`. Nenhum servidor ou túnel é provisionado por esses comandos.

Para compilar/instalar uma versão de desenvolvimento local, use Android SDK/JDK/ADB ou macOS/Xcode já configurados:

```bash
npm run android --prefix mobile
npm run ios --prefix mobile
```

No primeiro uso, instale o development client com um dos comandos `android` ou `ios` acima e depois abra o app pelo Metro. O comando `start` usa esse development client. Exportar um bundle não cria uma instalação independente de Metro e não comprova execução nativa. Um aparelho/emulador e a toolchain correspondente ainda são necessários para aceitar o app.

## Rotas e dados

| Rota | Comportamento |
|---|---|
| `/` | Entrar/criar conta quando deslogado; início com nome, catálogo, resultado e tentativa em andamento reais quando autenticado |
| `/recovery`, `/entry` | Recuperação real, redefinição por fragmento e entrada por convite |
| `/track` | Kids ativa; Escola e Técnico como “Em breve” |
| `/simulations`, `/detail/[id]` | Catálogo Kids com busca e filtros combinados, cartões inteiros acionáveis em grade de 1/2/3 colunas e detalhe com cronômetro opcional |
| `/simulation/[id]` | Questões dos quatro tipos atuais da API, confirmação, tempo, saída e retomada |
| `/result/[id]`, `/review/[id]` | Resultado e revisão da tentativa, sem inventar correção ou curiosidades |
| `/history`, `/ranking` | Tentativas e ranking de turma; classificação e média fornecidas pela API |
| `/profile` | Identidade, pontuação, conquistas reais, cronômetro, preferências de aprendizagem, coleção desbloqueada, links e logout |
| `/learning`, `/quizzes`, `/quiz/[id]` | Início de práticas, missões, XP e runner de quiz com mídia autenticada, preservados da versão atual |
| `/progress`, `/practice-history` | Progresso por habilidade, sugestões de revisão e histórico de quizzes |
| `/official-simulations` | Catálogo de todas as faixas atuais; avaliações fora do catálogo Kids continuam na web |
| `/oversight` | Acompanhamento dos alunos vinculados para responsáveis e professores |
| `/parents`, `/create` | Novos painéis do handoff “Em breve”; o acompanhamento atual segue em `/oversight` |

O catálogo mostra os simulados autorizados do Fundamental I. Não inclui questões, alunos, pontos ou metas dos protótipos. O ranking geral permanece “Em breve”; nomes exibem primeiro nome e inicial, e e-mail recebido como nome é substituído por “Estudante”. Conquistas vêm de `/me/achievements`, com metas e progresso do servidor. A elegibilidade dessas conquistas segue o catálogo de atividades da API; o app não cria regras próprias para simulados.

As novas tentativas solicitam `{immediateFeedback: true}`. Depois de cada confirmação, o cliente mostra a correção e o gabarito autorizado da API, com a Dica de Ouro nos erros/brancos e Você sabia? nos acertos. A retomada prioriza o feedback do servidor, inclusive em outro aparelho. Tentativas legadas continuam com correção ao concluir. Campos opcionais preservam a leitura dos recibos e resultados legados na API atual. A migration e a nova API devem ser instaladas antes deste app; uma API anterior pode rejeitar o início com `immediateFeedback: true`. O cliente não repete automaticamente esse início sem a opção. Nenhuma resposta correta é inferida no cliente. O resultado consome as barras de `topics` do servidor e identifica as questões sem tema cadastrado, sem classificar conteúdo editorial por conta própria. Respostas em branco respeitam o contrato `{}` da API, mantendo o sentinela local separado. As mensagens de resultado usam os cortes autorizados de 80% e 50%.

## Design system e acessibilidade

```bash
node scripts/generate-giz-mobile.mjs
```

O gerador lê `giz-handoff/tokens/tokens.json` e os SVGs aprovados. Os arquivos em `src/generated/` são derivados; edite a fonte do handoff e gere novamente. O ícone local vem do SVG Kids aprovado. Fredoka e Nunito estão empacotadas com suas licenças OFL, obtidas do repositório oficial [google/fonts](https://github.com/google/fonts).

O shell de estudante usa quatro itens na navegação inferior e uma barra lateral de 72 px no tablet/240 px em telas maiores. Respeita áreas seguras, inclui alvos de toque Kids, rótulos de leitor de tela e foco no título. Contas de acompanhamento mantêm navegação para alunos e perfil. A tela de questão mantém o Tuca fora do conteúdo da questão. O carregamento usa skeleton estático; o app não depende de animações para explicar estados.

Os tokens escuros estão preparados. A opção de tema escuro nativo aparece como “Em breve” até a avaliação visual em aparelho; o app começa com tema claro. TalkBack/VoiceOver, fontes em 200%, orientação, teclado físico, áreas seguras e contraste precisam de aceite físico adicional.

## Sessão, links e progresso

A infraestrutura de sessão e mídia da versão atual de `main` foi preservada. O provider mantém a limpeza de mídia na troca de geração, background e desmontagem; falhas de limpeza oferecem repetição explícita. Os quizzes mantêm ilustrações SVG verificadas e narração opcional, sem reprodução automática. O repositório de referência não foi alterado. Access fica em memória; somente o refresh é persistido em SecureStore. A renovação é única por sessão e usa geração/cancelamento para impedir que respostas atrasadas reabram uma conta anterior. O transporte `expo/fetch` omite cookies e rejeita redirecionamentos. JSON tem limite de 2 MiB e prazo para leitura.

O cadastro usa o mesmo ciclo seguro de credenciais do login. Após redefinir a senha, o fluxo encerra explicitamente a sessão local; falha de limpeza exige nova tentativa e nunca afirma que a sessão foi removida. O logout limpa a sessão local mesmo quando a revogação remota não pode ser confirmada. Testes com adaptadores controlados não comprovam Keychain/Keystore ou reinstalação física.

Links com segredo aceitam somente a origem web configurada e ficam em memória, sem Router params, armazenamento ou logs. Convites aceitam o parâmetro web `t` e o formato legado `token`; recuperação exige `/redefinir-senha#token=...`. Links de recuperação podem ser colados em `/recovery`. Convites e recuperação também podem ser colados em `/profile`. App Links/Universal Links ainda dependem de associação de domínio autorizada. Os esquemas existentes `simuladosbernardoproof`/`simuladosbernardointernal` aceitam apenas navegação comum sem query, fragmento ou credenciais.

O progresso usa a pasta privada do app, separado por usuário e tentativa. O journal grava em dois slots, conservando o último checkpoint íntegro se a próxima gravação falhar. Respostas pendentes são sincronizadas antes de concluir. Se a gravação local falhar, a interface informa a limitação. Dados de outro usuário não são restaurados pela sessão atual. Isso requer testes adicionais de encerramento forçado, quota e perda de rede no sistema operacional real.

## Verificação

```bash
npm run typecheck --prefix mobile
npm test --prefix mobile
npm run test:ui --prefix mobile
npm run export:android --prefix mobile
npm run export:ios --prefix mobile
```

Após integrar a infraestrutura atual de `main`, foram verificados 79 testes de unidade e 36 testes de UI, além da checagem de tipos. Os testes de unidade cobrem sessão, transporte, SecureStore, links, configuração, privacidade, modelos de resposta e durabilidade do journal. Os testes de UI usam componentes nativos com dependências controladas; verificam quatro abas, remoção da navegação em fluxo, rodapé, SafeArea escura, skeleton, grade nas três faixas de tela, busca combinada com filtros, limpeza e retomada restrita aos simulados Kids disponíveis. Eles não representam execução em Android/iOS real. As evidências finais e limitações gerais ficam em [IMPLEMENTACAO.md](../docs/giz/IMPLEMENTACAO.md).

`package-lock.json` acompanha o pacote nativo. Além da verificação inicial em pasta temporária, a instalação própria foi concluída com `npm ci --offline --ignore-scripts --no-audit --no-fund`: 850 pacotes instalados neste app, sem alterar o repositório de referência. A instalação local e os exports Android/iOS anteriores ao merge foram validados com essas dependências. Após o merge, TypeScript e as suítes de 79 testes de unidade e 36 de UI foram repetidos; novas exportações devem usar a configuração EAS preservada. O lock herdado emite aviso de peer opcional entre `expo-modules-core` e `react-native-worklets`; o app não introduz uso de animações/worklets. A execução física continua necessária antes de distribuição.

## Distribuição preservada

A integração mantém o projeto EAS existente: owner `guilhermesborbas-team`, slug `simulados-bernardo` e project ID `d03c6091-0858-4150-9de5-ae051ed5f83a`. Os identificadores continuam `com.simuladosbernardo.proof` em desenvolvimento e `com.simuladosbernardo.proof.internal` no perfil interno. O nome visível passa a Giz Kids. Não execute `eas init` para criar outro projeto.

O perfil `internal` de `eas.json` continua gerando APK release sem Metro, com distribuição interna, versionCode remoto e as origens de produção Railway/Vercel já autorizadas. A geração remota e o envio a lojas são ações distintas; esta integração não iniciou novos builds remotos nem publicou em lojas. Consulte [o procedimento EAS existente](docs/android-internal-eas.md) antes de gerar um novo APK.

No ambiente WSL revisado há Node 22, mas não há JDK/SDK/ADB Linux configurados nem EAS CLI instalado. O host Windows contém JDK 21, ADB e ferramentas Android 36, mas faltam plataforma Android 36 e NDK exigidos pelo template RN atual; a presença desses executáveis não comprova build local reproduzível no WSL. A alternativa já configurada é EAS com acesso à organização. Nenhuma toolchain foi instalada nesta revisão.
