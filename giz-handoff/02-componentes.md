# 02 · Componentes

Cada componente lista **anatomia, medidas, estados e acessibilidade**. As medidas saem dos protótipos em `prototipos/`. Para ver todos os estados desenhados lado a lado, abra `prototipos/prancha-design-system.html`. Todas as cores e tamanhos vêm de `tokens/`.

Convenções: "padrão" é o estado de repouso; "foco" é o foco do teclado ou de tecnologia assistiva; todo componente interativo precisa dos seus estados de **foco visível**, **desligado** quando se aplica, e **pressionado** (no app) ou **hover** (na web).

**Foco visível em tudo:** anel de 3 px em `--info`, com `outline-offset` de 2 a 3 px. Nunca remova o foco sem pôr outro no lugar.

---

## 1. Botão

| Variante | Fundo | Texto | Borda | Uso |
|---|---|---|---|---|
| Primário | `--primary` | `--on-primary` | 2 px transparente | Uma ação principal por tela |
| Secundário | transparente | `--ink` | 2 px `--ink` | Ação alternativa |
| Texto | transparente | `--info`, sublinhado | - | Ações leves, como "Esqueci a senha" |
| Compacto | igual ao primário | igual | - | Altura 48 px, texto 16 px, em janelas e linhas |

- Altura 56 px (compacto 48), padding horizontal 28 px, raio `full`, texto Fredoka 600 de 18 px, centralizado.
- Largura: no celular o botão da ação principal ocupa a largura toda (`block`). No computador tem a largura do conteúdo.
- **Estados:** padrão · hover (brilho +5%, só web) · pressionado (escala .98) · foco · **desligado** (fundo `--line`, texto `--muted`, sem cursor de clique).
- Dois botões lado a lado no celular (por exemplo, "Experimentar" e "Ver como funciona") ficam **empilhados com a mesma largura**.
- Acessibilidade: elemento `button` (ou `a` quando navega); o texto descreve a ação ("Confirmar", não "OK"); botão desligado usa `disabled` real.

## 2. Campo de texto

- Rótulo acima (Nunito 800, 14/20), **sempre visível** (nunca só placeholder). Campo de 56 px, raio 12, borda 2 px `--line`, fundo `--surface`, texto 16 px, padding horizontal 16 px.
- **Estados:** padrão · foco (borda `--info` + anel) · erro (borda `--err`, mensagem abaixo com ícone de alerta) · desligado (fundo `--soft`).
- Mensagem de erro: 13/18, peso 800, ícone `alert` de 18 px. Texto em português simples, dizendo como corrigir ("Digite um e-mail válido, como nome@email.com").
- Senha: botão de 48 × 48 px dentro do campo para mostrar ou esconder (ícones `eye`), com `aria-label` e `aria-pressed`.
- Acessibilidade: `label` ligado por `for`/`id`; erro com `aria-invalid="true"` e `aria-describedby` apontando para a mensagem; `autocomplete` correto (`email`, `current-password`, `new-password`, `name`); validação ao enviar, com foco no primeiro campo com erro e aviso `aria-live`: "Revise os campos destacados."

## 3. Alternativa de resposta

Componente central do produto. É um **grupo de rádio**: um `fieldset` com `legend` igual ao enunciado, e cada alternativa um `input type="radio"` real dentro de um `label`.

- Altura mínima 64 px, padding 12 × 14, raio 12, borda 2 px `--line`, fundo `--surface`. Dentro: círculo da letra (36 px, `--soft`, Fredoka 600 de 16 px), texto (Nunito 600 de 16/24, ocupa o resto) e, depois da resposta, um rótulo à direita.
- Espaço entre alternativas: 10 a 12 px.

| Estado | Borda | Fundo | Letra | Rótulo |
|---|---|---|---|---|
| Padrão | `--line` | `--surface` | fundo `--soft` | - |
| Hover (web) | `--primary` | `--surface` | igual | - |
| Foco | anel `--info` | igual | igual | - |
| Marcada | `--primary` | `--sel-bg` | fundo `--primary`, texto `--on-primary` | - |
| **Certa** | `--ok` | `--ok-bg` | fundo `--ok`, texto branco | ícone check + "Certo" (`--ok-ink`) |
| **Errada (a que a criança marcou)** | `--err` | `--err-bg` | fundo `--err`, texto branco | ícone x + "Errado" |
| Fora de jogo (depois da resposta) | `--line` | `--soft` | igual | - (texto `--muted`) |

- Depois de confirmar, os rádios ficam `disabled`. A alternativa certa sempre é destacada, mesmo que a criança tenha errado.
- No modo de revisão (telas 10), os mesmos estados aparecem sem interação, e o rótulo da marcada é "Sua resposta".
- Teclado: setas movem entre as alternativas (comportamento nativo do rádio); letras **A a D** selecionam; **Enter** confirma (ver `04-comportamento.md`).

## 4. Cartão de simulado

- Cartão `--surface`, raio 20, borda 1 px `--line`, sombra e1, padding 16, ocupa a largura da coluna.
- Conteúdo: legenda com a avaliação (AV1/AV2), título (Fredoka 600, 18/24, ex.: "Geografia, AV1"), subtítulo (14/20, `--muted`: "3º ano · 1º bimestre · AV1 · 30 questões") e um selo de estado.
- Selos de estado: **Novo** (`--hl`, texto Lousa) · **Em andamento** (`--soft`, texto `--ink`, mostra "12 de 30") · **Concluído** (`--ok-bg`, ícone check, "26 de 30 certas").
- O cartão inteiro é um único alvo clicável (botão ou link), com altura mínima de 80 px.

## 5. Cartão da questão

- Cartão `--surface`, raio 20, padding 16 a 20. Contém: legenda ("Questão 12", caixa alta, 12/16 peso 800), enunciado (h1, Nunito 800, 19/27 no celular e 24/32 no computador, `text-wrap: balance`) e o grupo de alternativas.
- No celular o cartão sobe 40 px sobre o cabeçalho escuro (a rolagem começa com margem superior de -40 px), padrão herdado da referência.
- O enunciado é o título da tela e recebe o foco quando a questão aparece.

## 6. Navegação

**Celular: barra inferior.** Altura 76 px, fundo `--surface`, borda superior 1 px `--line`, padding 6 8 14. Quatro itens de largura igual: Início, Simulados, Ranking, Eu. Cada um tem a pílula do ícone (56 × 30 px, raio `full`), o ícone de 24 px e o rótulo de 12/16 peso 700. O item atual tem rótulo `--ink` e pílula `--sel-bg`; usa `aria-current="page"`. **Sem botão central.** Itens ainda sem tela mostram "em breve" e `aria-disabled="true"`.

**Tablet:** barra lateral de 72 px só com ícones (rótulo acessível mantido).

**Computador:** barra lateral de 240 px, fundo `--surface`, borda direita 1 px `--line`, padding 24 × 16. Logotipo no topo (84 × 60), depois os itens como pílulas de 48 px de altura (Fredoka 500, 18 px, ícone + texto, raio `full`). O item atual: fundo `--sel-bg`, texto `--ink` peso 600, com um ponto Coral à direita.

Acessibilidade: `nav` com `aria-label="Principal"`. O cabeçalho do computador tem trilha de navegação (`nav aria-label="Você está em"`, "Simulados / Geografia · 3º ano / AV1").

## 7. Progresso e cronômetro

- **Barra de progresso:** altura 8 px, raio `full`, trilha `--soft` (no cabeçalho escuro, `rgba(255,255,255,.18)`), preenchimento `--hl`. Ao lado, "12 de 30" (14 px, peso 800, mínimo 48 px de largura, alinhado à direita). `role="progressbar"` com `aria-valuemin`, `aria-valuemax`, `aria-valuenow` e `aria-label="Progresso"`.
- **Cronômetro (anel):** 56 px no cabeçalho do celular, 88 px na caixa de progresso do computador. Raio 24 num viewBox de 56, traço de 5 px, ponta redonda, começa no topo (gire -90°). Cor `--hl`; com 10 s ou menos, `--urgent`. Número no centro em Fredoka 600 (17 px no pequeno, 26 px no grande). Com o cronômetro desligado, o espaço fica vazio e o texto diz "Sem limite de tempo".
- Acessibilidade do cronômetro: `role="img"` com `aria-label="Tempo da questão"`; **não** anunciar a cada segundo. Anunciar só "Faltam 30 segundos." e "Faltam 10 segundos." numa região `aria-live="polite"`.

## 8. Dica de Ouro

- Bloco `--hl-bg`, raio 12, padding 12 × 14, ícone `bulb` de 24 px (cor `#B88400`) e à direita um título (Fredoka 600, 16 px, "Dica de Ouro") com o texto (14/20, `--ink`).
- Aparece **só quando a criança errou ou o tempo acabou**. Nunca contém a resposta, só uma pista.
- Na tela de resultado/revisão o mesmo bloco aparece nas questões erradas.

## 9. Você sabia?

- Bloco `--ok-bg`, mesmo formato, ícone `spark` em `--ok`, título "Você sabia?".
- Aparece **só quando a criança acertou**. Texto de curiosidade, uma ou duas frases.

## 10. Painel inferior e janela

- **Celular:** painel colado embaixo, `--surface`, raio superior 28, sombra `sheet`, alça de 40 × 4 px centralizada, padding 8 16 20, animação de subida de 250 ms (sem animação com movimento reduzido). Atrás, um véu escuro para os painéis que bloqueiam a tela (sair do simulado). O painel de feedback da questão **não** usa véu e não cobre a questão (a questão rola acima dele).
- **Computador:** vira janela central (largura de cerca de 480 px, raio 28, véu atrás) para "Sair do simulado?". O feedback fica **abaixo das alternativas**, no cartão, sem janela.
- Acessibilidade: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` no título; foco inicial no botão de ficar; **Esc** fecha; o foco volta para o botão que abriu.

## 11. Linhas de lista (ranking, histórico, perfil)

- **Ranking:** altura mínima 56 px: posição ("4º", Fredoka), avatar de 36 px (inicial do nome), nome, pontos (`--muted`, peso 800). A linha do usuário usa `--sel-bg`, raio 12, e diz "(você)" em texto.
- **Histórico:** botão de linha inteira, altura mínima 76 px: nota em quadrado de 56 px (`--ok-bg` a partir de 24 acertos, `--hl-bg` de 18 a 23, `--err-bg` abaixo de 18, com "de 30" embaixo), título e dados da tentativa, seta à direita.
- **Perfil:** linhas de 60 px com ícone de 24 px, texto e seta; itens ainda não prontos mostram o selo "Em breve" e `aria-disabled`.

## 12. Selo, chip, abas

- **Selo:** pílula de altura mínima 24 px, texto 12/16 peso 800. Cores: Novo (`--hl`), Concluído (`--ok-bg` + `--ok-ink`), Em andamento (`--soft`), Em breve (`--hl-bg`), Atenção (`--err-bg`).
- **Chip de filtro:** pílula de altura mínima 44 px, borda 2 px `--line`, texto 14 peso 800. Marcado: fundo `--ink`, texto `--surface`. Usa `aria-pressed`. Fileira rolável na horizontal no celular, com o grupo rotulado (`role="group"` e `aria-label`).
- **Abas (pílula segmentada):** contêiner `--soft`, raio `full`, padding 4; cada aba com altura mínima 44 a 48 px, Fredoka 600. Aba atual: fundo `--ink`, texto `--surface`. Em formulários usa `role="tablist"`, `role="tab"` e `aria-selected`; para filtros simples (Turma/Geral) botões com `aria-pressed`.

## 13. Aviso rápido (toast)

Pílula escura (`--head`, texto `--head-ink`, raio 14, sombra e3, padding 12 × 16), ícone de 22 px em `--hl`, texto 15 peso 700. Some sozinho em 4 s. Anunciado com `role="status"`. Nunca é o único lugar onde um erro aparece.

## 14. Ilustração e Tuca

Ver `06-tuca-e-ilustracoes.md`. Ilustrações são decorativas: `aria-hidden="true"` quando só enfeitam; com `role="img"` e `aria-label` quando carregam significado (por exemplo, "Tuca comemorando um acerto").

## 15. Estados de tela (vazio, carregando, erro, sem conexão)

Toda lista e toda tela de dados precisa dos quatro:
- **Carregando:** esqueleto de cartões (fundo `--soft`) ou a pose "Lendo" do Tuca na Kids; sem spinner solto.
- **Vazio:** ilustração (Tuca "Lupa" na Kids, "caderno vazio" nas demais), uma frase e uma ação. Ex.: "Você ainda não fez nenhum simulado" e o botão "Escolher um simulado".
- **Erro:** mensagem em português simples e um botão "Tentar de novo".
- **Sem conexão:** ilustração "Sem conexão" (Tuca "Respira fundo" na Kids), explica que o progresso fica salvo.
