# 05 · Web e app mobile

O pacote não assume tecnologia para o app (README, ponto 7). Este documento diz o que é **igual**, o que **muda** e como mapear para cada plataforma.

## O que é igual nas duas

- Tokens, tipografia, ícones, ilustrações, textos e regras de comportamento (`01` a `04`).
- Fluxo das 15 telas e hierarquia de uma ação principal por tela.
- Estados de lista (carregando, vazio, erro, sem conexão).
- Acessibilidade: alvos de 48 px (56 na Kids), contraste, não depender só de cor, leitor de tela.

## O que muda

| Tema | Web | App |
|---|---|---|
| Navegação | Barra lateral 240 px (≥1024), 72 px (tablet), barra inferior (celular) | Barra inferior de 4 itens; no tablet, barra lateral de 72 px |
| Entrada | Teclado e mouse (A a D, Enter, Esc) | Toque; teclado externo é opcional |
| Hover | Existe | Não existe; use estado pressionado |
| Áreas seguras | `env(safe-area-inset-*)` | Insets da plataforma (entalhe, barra de gestos) |
| Fontes | Google Fonts com `font-display: swap` | Empacotadas no app |
| Tema | `prefers-color-scheme` + `data-theme` | Tema do sistema + escolha do usuário |
| Voltar | Botão do cabeçalho e histórico do navegador | Botão do cabeçalho e gesto do sistema |
| Tamanho de fonte | Zoom do navegador | Escala de fonte do sistema (até 200%) |
| Movimento | `prefers-reduced-motion` | "Reduzir movimento" do sistema |
| Retomar | Estado no servidor | Estado no servidor e cópia local |

## Breakpoints (web e tablets)

- **Celular ≤599 px:** uma coluna, barra inferior, painéis inferiores.
- **Tablet 600 a 1023 px:** barra lateral de 72 px com ícones, 2 colunas no catálogo, painéis viram janelas centrais.
- **Computador ≥1024 px:** barra lateral de 240 px, 12 colunas, conteúdo até 1280 px, tela de questão com coluna lateral de 320 px.

Teste no mínimo em 360, 390, 768, 1024 e 1440 px de largura. **Nunca** deve haver rolagem horizontal da página.

## Barra inferior e áreas seguras (celular)

- Altura 76 px **mais** o inset inferior do aparelho.
- Rodapé fixo da questão: padding 12 16 24 mais o inset inferior.
- Cabeçalho escuro avança sob a barra de status; conteúdo respeita o inset superior.
- Em paisagem, respeite os insets laterais (mínimo 16 px).

## Ícone do app e identidade

Arquivos em `assets/brand/`: `app-kids.svg` (principal na v1), `app-principal.svg`, `app-escola.svg`, `app-tecnico.svg` (1024 × 1024). Exporte os tamanhos exigidos por iOS e Android a partir do SVG. O fundo é sólido e não tem transparência no ícone final.

- **v1 publica apenas Giz Kids.** O nome na loja depende da checagem de marca (README, ponto 1).
- Logotipos: `giz-logo-lousa.svg` (sobre fundo claro) e `giz-logo-papel.svg` (sobre fundo escuro).
- Tela de abertura (splash): fundo Lousa, logotipo Papel centralizado, sem animação longa.

## Tema claro e escuro

Claro por padrão. Escuro quando o aparelho pedir ou o usuário escolher (tela 13). Os valores escuros estão em `tokens/`, mas o **contraste do escuro ainda precisa ser conferido tela a tela** antes de liberar (README, ponto 2). Se não houver tempo, entregue só o tema claro e esconda a opção.

## Mapa de componentes por plataforma (sugestão)

| Componente | Web | App |
|---|---|---|
| Alternativas | `fieldset` + `input[type=radio]` | Grupo de rádio com papel de acessibilidade `radiogroup` |
| Cronômetro | SVG com `stroke-dashoffset` | Desenho vetorial (arco) |
| Painel inferior | `dialog` ou `div[role=dialog]` | Bottom sheet do sistema ou da biblioteca |
| Aviso rápido | `role=status` | Snackbar/Toast acessível |
| Ícones | `assets/icones` (sprite) | Converter os SVGs para vetor da plataforma |

Respeite a biblioteca de UI do projeto. O que não pode variar: medidas, cores, textos e comportamento.

## Offline e rede

- Leitura de simulados já baixados deve funcionar sem rede, se a arquitetura permitir; senão, mostre a tela "Sem conexão".
- Respostas feitas sem rede entram numa fila e sobem quando voltar a conexão. Nunca perder respostas.

## Privacidade e crianças

O público é infantil. Não colete nada além do necessário; não use anúncios de terceiros nem rastreadores de comportamento; ranking só com primeiro nome e inicial, sem foto. Revisar com o responsável antes de publicar nas lojas (políticas para apps infantis).
