# Aceite web Giz — 19/10/2026 (E07)

Base web: `90d45a5` (inclui #65/#68). API das jornadas integradas: `97eebef` (main, inclui api#225), compilada em worktree temporário. Referências: `giz-handoff/08-checklist-de-aceite.md` e protótipos 01–06, 07, 10–13, 14–15 e landing. As decisões registradas em `IMPLEMENTACAO.md` prevalecem sobre os exemplos fictícios dos protótipos.

## Como reproduzir

Com Node Linux 22 e dependências instaladas:

```bash
npm run typecheck && npm run lint && npm test && npm run build
# Terminal 1: build de produção; nenhuma API é necessária para a auditoria controlada.
npm start -- -H 127.0.0.1 -p 3398
# Terminal 2:
node scripts/audit-giz-web.mjs
```

A auditoria intercepta todas as chamadas `/api/**` no contexto do Chromium com fixtures sintéticas. Não escreve em banco nem usa contas reais. Percorre 18 URLs × cinco larguras (360/390/768/1024/1440) × texto em 100%/200%; também registra 20 cenários de estado e uma jornada por teclado. Os links de resultado/revisão recebem tentativas concluídas e o auditor exige os títulos específicos dessas telas antes de medir. Executa axe WCAG A/AA nos extremos de largura e nas duas escalas. Aguarda as fontes locais antes de medir. O teste de 200% amplia a fonte raiz, sem reduzir a largura do viewport; não equivale ao teste manual de zoom de todo o navegador.

JSON detalhado e capturas: `test-results/giz-acceptance/`, ignorados pelo Git. O resultado consolidado versionado está em `aceite-web-2026-10-19.json`. Para mudar servidor, saída, larguras, escalas ou URLs: `GIZ_AUDIT_URL`, `GIZ_AUDIT_OUTPUT`, `GIZ_AUDIT_WIDTHS`, `GIZ_AUDIT_SCALES`, `GIZ_AUDIT_PATHS`. `GIZ_AUDIT_AXE=0` serve somente para diagnóstico pontual; a matriz de aceite usa o padrão com axe. Execute essa auditoria separadamente de `test:browser`, pois o Playwright limpa `test-results` ao iniciar.

Jornadas reais, com Docker e API compilada em checkout isolado:

```bash
E2E_API_DIR=/caminho/checkout-api npm run test:e2e
E2E_API_DIR=/caminho/checkout-api npm run test:browser
```

Esses runners criam e removem seus próprios PostgreSQLs, dados sintéticos e servidores. Não reutilize a URL de um banco existente. As capturas das jornadas podem ser habilitadas com `QUIZ_SCREENSHOT_DIR`.

## Validações executadas

- Web: typecheck, lint sem avisos, 62 testes e build de produção aprovados.
- HTTP Next → BFF → Nest → PostgreSQL descartável: 48 testes em seis suítes aprovados.
- Playwright com API real: 82 jornadas desktop/mobile aprovadas. Containers e processos desses runners removidos automaticamente ao terminar.
- A CI ainda fixa a API antiga `e0b1966`; a correção existente em `fix/ci-api-ref` não foi alterada nem enviada nesta etapa. Estas evidências locais usam a API main indicada acima e não declaram a CI verde.
- Matriz controlada: 201 cenários aprovados; após os últimos ajustes visuais, 31 cenários focados em revisão/estados/teclado também aprovados. O JSON consolida a matriz, substituindo os casos repetidos pela execução mais recente.
- O JSON consolidado contém o resultado da matriz controlada, dos estados e do teclado. Nenhum teste com NVDA/VoiceOver foi declarado executado.

## Resultado por tela

Todas as URLs abaixo entram na matriz de cinco larguras e duas escalas, com um único h1, foco no título, ausência de overflow da página, erros de execução e violações axe nos cenários examinados. Os alvos interativos são medidos pelo retângulo clicável (label para rádio/checkbox), com mínimo de 56 × 56 na trilha Kids. O título de feedback recebe foco durante a correção.

| Tela | URL / cenário | Comparação e limites |
|---|---|---|
| Entrar | `/login` | Cabeçalho escuro no celular, rótulos visíveis, mostrar senha, ação Coral/Lousa. A marca/Tuca ficam acima do formulário; a composição não é uma cópia pixel a pixel do mock. |
| Criar conta | `/registro` | Mesma fundação, validação e senha acessível. |
| Recuperar | `/recuperar-senha` | Estado inicial; envio/erro, mensagem genérica e links exercitados também nas jornadas reais. |
| Redefinir | `/redefinir-senha` | Link ausente e orientação para recuperar; link válido/usado e conclusão nas jornadas reais. |
| Trilha | `/trilha` | Três trilhas liberadas por decisão E01; o checklist original que desabilita Escola/Técnico está superado. |
| Início | `/` | Catálogo sintético; links secundários ampliados para toque. Estados vazio, erro, offline e carregando também registrados. |
| Catálogo | `/simulados` | Filtros e cartões; mesmo conjunto de estados. |
| Detalhe | `/simulados/audit-simulation` | Quantidade/tempo derivados da fixture; cabeçalho escuro e cartões. Exemplo de duas questões apenas no teste. |
| Questão | `/simulado/audit-simulation?attemptId=audit-attempt&timer=0` | Rádios reais, sem Tuca, confirmar desligado inicialmente, teclado e foco. |
| Feedback | Jornada A/Enter | Correção sintética após confirmação, foco em “Resposta certa!”, Enter avança. |
| Resultado | `...?attemptId=audit-attempt&view=result` | Dados de duas questões; não usa os números do protótipo. |
| Revisão | `...?attemptId=audit-attempt&view=review` | Respostas e gabarito do snapshot sintético; índice e filtros. |
| Histórico | `/historico` | Estado vazio na matriz; carregamento/erro/offline separados. Tentativas e isolamento também exercitados na suíte integrada. |
| Ranking | `/ranking` | Sem turma na matriz; Geral continua “Em breve”. Quebra de rótulos corrigida a 200%. |
| Eu | `/eu` | Resumo sintético e conquistas vazias; estados de falha/carregamento. Switch com 56 px e Tuca preservado em 96 px. |
| Pais | `/pais` | “Em breve”, sem fabricar painel ou barreira de adulto. |
| Montar simulado | `/simulados/novo` | “Em breve”, sem formulário fictício. |
| Convite | `/convite` | Link ausente; foco no h1 e layout com tokens. Convite válido/cadastro/entrada seguem a cobertura da E02. |
| Divulgação | `/sobre` | Seções e CTA para catálogo; sem preços ou números fictícios. |

A Prática usa o shell Giz e conserva componentes internos legados por decisão E05. As jornadas reais desktop/mobile exercitam catálogo de quizzes, execução, missões, coleção, habilidades, recuperação e acompanhamento, incluindo axe nos cenários definidos pelas suítes. A padronização visual interna de Prática continua na E13 (#67); a matriz controlada acima não declara aceite visual completo dessas superfícies.

## Correções desta etapa

- Convite sem token não recebia foco e usava medidas Tailwind isoladas. O aviso passou a usar `AppShell` e cartão Giz; mudanças de estado remontam o aviso para anunciar o novo título.
- Marca da barra lateral, breadcrumb e links secundários do Início tinham alvos menores que o mínimo. Recebem dimensões mínimas por tokens.
- Rótulos de navegação e estatísticas se sobrepunham com fonte a 200%. Agora podem quebrar dentro da coluna, sem reduzir o tamanho da fonte.
- O switch do cronômetro e as células do mapa de questões tinham 48 px de altura. Agora têm 56 px; o mapa usa colunas adaptativas para caber no painel.
- A borda de 1 px da barra tablet reduzia os links para 55 px. O padding agora desconta a borda e preserva os 56 px. A marca da landing também não encolhe abaixo do mínimo quando o CTA cresce com texto ampliado.
- A regra mobile de altura automática do Tuca no perfil anulava a altura aprovada e ampliava a imagem. Removida: preserva os 96 px definidos no componente.
- Na revisão mobile, o título ficava sobre o cabeçalho escuro e o rótulo de resposta comprimira o texto da alternativa. O título ganhou superfície própria; o rótulo ocupa uma linha separada no celular.
- Tema escuro e automático ocultos até validação visual completa. O HTML já nasce claro; a preferência aplicada também é clara, inclusive para quem tinha escuro salvo. Tokens escuros continuam disponíveis internamente, sem opção exposta no perfil.

## Tokens, movimento e conferência visual

Busca com `rg` em `components/giz` e `app/globals.css`: não foram encontradas cores hex/rgb soltas nos componentes Giz. Medidas CSS usam variáveis; os valores `599/600/1023/1024px` são os breakpoints documentados. Geometrias de SVG, dimensões aprovadas dos assets, percentuais de progresso, zero e utilitários de acessibilidade (1 px/clipping) não são substitutos de tokens visuais. Na Prática, o CSS legado ainda tem valores próprios: trabalho já previsto em E13.

Fredoka/Nunito são locais. A regra global gerada em `app/giz-tokens.css` remove animações/transições/rolagem suave com movimento reduzido; os cenários usam `reducedMotion: reduce`. O teste de contraste unitário verifica 26 combinações de tokens claros/escuros. Esse teste isolado não autoriza liberar o tema escuro.

Comparação visual com os protótipos preserva Papel/Lousa, cabeçalho escuro no celular, cartões, quatro itens de navegação e ausência de personagem na questão. Textos, quantidade de questões, ranking percentual, trilhas liberadas e telas “Em breve” seguem o contrato real e as decisões registradas. O aceite estético final com o responsável e as verificações abaixo continuam humanos; axe não substitui leitura por tecnologia assistiva.

## Roteiro manual para o responsável — NVDA ou VoiceOver

Executar em ambiente autorizado com conta de teste, sem dados de crianças:

1. No NVDA/Firefox ou Chromium, ativar NVDA; no macOS/Safari, ativar VoiceOver. Registrar versões do navegador/SO/leitor, data e resultado.
2. Abrir Entrar. Confirmar anúncio do h1, rótulos de e-mail/senha, estado do botão Mostrar senha. Enviar vazio: primeiro erro recebe foco e a mensagem é anunciada. Recuperar senha nunca informa se a conta existe.
3. Autenticar. Percorrer a navegação e conferir Início/Simulados/Ranking/Eu e indicação da página atual. Usar “Ir para o conteúdo”. Abrir detalhe e confirmar título, quantidade e cronômetro.
4. Iniciar sem cronômetro. Conferir anúncio do enunciado, grupo e alternativas. Tab alcança rádio; setas mudam opção; A–D selecionam; Enter confirma. Conferir anúncio do estado, alternativa certa e foco no feedback. Enter avança com foco no próximo enunciado.
5. Repetir com erro e branco/tempo esgotado: Dica de Ouro e estado não dependem só de cor. Com cronômetro, conferir avisos apenas em 30 e 10 segundos, sem anúncio a cada segundo.
6. Abrir Sair pelo teclado. Conferir nome do diálogo, foco contido e Esc devolvendo ao controle. Retomar e concluir. Resultado anuncia o título; revisão anuncia Sua resposta/Certa e filtros.
7. Conferir histórico vazio/com tentativas, ranking com turma (primeiro nome/inicial e “você”), perfil e switch do cronômetro. Seguir um convite válido e um inválido: o novo título deve ser anunciado.
8. Ampliar texto/zoom para 200%, percorrer todas as ações e verificar corte, sobreposição e foco escondido pela barra fixa. Repetir sem movimento. Tema escuro deve permanecer indisponível.
9. Na Prática, percorrer submenu e uma questão, confirmando que títulos não se repetem e que o botão Sair é anunciado.

Registrar nesta issue (#59) qualquer anúncio ausente/duplicado ou ação inacessível com URL e passos. Não marcar o teste com leitor de tela como executado por causa de axe ou desta auditoria.
