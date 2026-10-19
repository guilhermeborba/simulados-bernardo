# 01 · Tokens

Fonte da verdade: `tokens/tokens.json`. O arquivo `tokens/tokens.css` é gerado dele e define variáveis CSS em `:root`, com o tema escuro por `prefers-color-scheme` e por `data-theme="dark"`. Para o app mobile, gere as constantes da plataforma a partir do mesmo JSON. Não copie valores à mão.

## Como instalar

- **Web:** importe `tokens.css` na raiz da aplicação. Todo componente usa `var(--nome)`. Se o projeto usa Tailwind ou outra camada, mapeie estas variáveis no tema dela, sem duplicar valores.
- **App:** crie uma única fonte de tokens (arquivo de tema) gerada de `tokens.json`. Cores, raios, espaçamentos e tamanhos de texto vêm de lá.
- **Tema:** a regra é `claro` por padrão, `escuro` quando o aparelho pede ou quando o usuário escolher. O fundo do `body` deve sempre vir de um token (`--bg`), nunca transparente.

## Cores

### Marca

| Token | Nome | Valor | Uso | Contraste |
|---|---|---|---|---|
| `--primary` | Coral | `#FF7B54` | Ação principal da tela | 5,8:1 com texto Lousa |
| `--ink` | Lousa | `#1B2A2F` | Texto, cabeçalho escuro | 13,2:1 sobre Papel |
| `--bg` | Papel | `#F7F3EA` | Fundo das telas | base |
| `--hl` | Sol | `#FFC93C` | Progresso, conquistas | 9,6:1 com texto Lousa |

### Apoio

| Token | Nome | Valor | Uso | Contraste |
|---|---|---|---|---|
| `--info` | Azul 600 | `#2F66DB` | Link, foco, trilha Escola | 4,7:1 sobre Papel |
| `--ok` | Pinho | `#1E8C77` | Acerto: ícone, borda, preenchimento | 4,1:1 sobre branco: **nunca texto pequeno** |
| `--err` | Coral 700 | `#C8452A` | Erro: borda e ícone | 4,8:1 sobre branco |
| `--muted` | Grafite | `#4A5A5E` | Texto de apoio | 6,4:1 sobre Papel |
| `--urgent` | Urgência | `#FF9A78` | Cronômetro nos últimos 10 s | - |

### Superfícies

`--surface #FFFFFF` (cartões e campos), `--soft #F0EBDD` (fundos de apoio), `--line #E7E0CF` (bordas), `--sel-bg #FFE9DF` (opção marcada e linha do usuário no ranking), `--ok-bg #D3EFE8`, `--err-bg #FFE0D6`, `--hl-bg #FFF1C2` (Dica de Ouro). Texto sobre `--ok-bg` usa `--ok-ink #0D4A3E`.

Cabeçalho escuro: `--head #1B2A2F`, texto `--head-ink #F7F3EA`, apoio `--head-muted #B9C6C8`.

### Regras de cor

- Texto sobre Coral e sobre Sol é **sempre** `--on-primary` (Lousa).
- Pinho serve para ícone, borda e preenchimento. Texto de acerto usa `--ok-ink` sobre `--ok-bg`.
- Cor nunca é o único sinal. Acerto = ícone de certo + texto + cor. Erro = ícone de erro + texto + cor.
- Cores das trilhas: Kids Coral, Escola Azul 600, Técnico Pinho. Elas só trocam o destaque (ícone do app, cartão da trilha, caderno vazio). Não trocam o Papel nem a Lousa.

## Tipografia

Duas famílias: **Fredoka** (títulos, números grandes, botões) e **Nunito** (texto). Carregue Fredoka 500, 600 e 700 e Nunito 400, 600, 700 e 800. Use `font-display: swap` e a pilha de reserva de `tokens.json`. No app, empacote as fontes no aplicativo.

| Estilo | Fonte | Celular (tamanho/linha) | Computador |
|---|---|---|---|
| Display | Fredoka 600 | 32/40 | 44/52 |
| H1 | Fredoka 600 | 28/34 | 32/40 |
| H2 | Fredoka 600 | 22/28 | 24/32 |
| H3 | Fredoka 600 | 18/24 | 20/28 |
| Enunciado da questão | Nunito 800 | 19/27 | 24/32 |
| Corpo | Nunito 600 | 16/24 | 16/24 |
| Corpo pequeno | Nunito 600 | 14/20 | 14/20 |
| Legenda | Nunito 800 | 12/16, caixa alta, letter-spacing .08em | igual |

Regras: texto de leitura nunca abaixo de 16 px; 14 e 12 só para apoio e rótulos; títulos com `text-wrap: balance`; linhas de leitura com no máximo cerca de 65 caracteres. No app, respeite o tamanho de fonte do sistema: a interface deve continuar legível com a fonte do aparelho em 200%.

## Medidas

- **Espaçamento** (grade de 4 px): 4, 8, 12, 16, 20, 24, 32, 40, 56, 72.
- **Raios:** sm 8 · md 12 (campos e alternativas) · lg 20 (cartões) · xl 28 (painéis inferiores) · full 999 (botões e chips).
- **Sombras:** e1 (cartão em repouso), e2 (cartão elevado), e3 (aviso e janela), sheet (painel inferior).
- **Alvos de toque:** mínimo 48 × 48 px, e 56 px na trilha Kids. Botão 56 px de altura (compacto 48), campo 56, alternativa de resposta mínimo 64, chip mínimo 44.
- **Ícones:** grade de 24 px, traço de 2 px com pontas redondas. Tamanhos 20, 24 e 28 px.
- **Faixas de tela:** celular até 599 px · tablet 600 a 1023 px (barra lateral de 72 px) · computador 1024 px ou mais (barra lateral de 240 px, conteúdo de até 1280 px, 12 colunas).

## Movimento

Transições de 120 ms (rápida) e 250 ms (padrão), `ease-out`. Com `prefers-reduced-motion: reduce` (e a configuração equivalente no app), remova transições, animações e rolagem suave. O anel do cronômetro continua atualizando, sem animação entre os passos.

## Tempo

45 segundos por questão (cronômetro opcional). Avisos para leitor de tela em 30 s e 10 s. Abaixo de 10 s o anel muda para `--urgent`.
