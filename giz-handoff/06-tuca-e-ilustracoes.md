# 06 · Tuca e ilustrações

Tuca é o tucano da trilha **Giz Kids**. Aparece só na Kids. Escola e Técnico usam ilustrações sem personagem. Arquivos em `assets/tuca/` e `assets/ilustracoes/`. Referência visual: `prototipos/tuca-e-ilustracoes.html`.

## As 12 poses (aprovadas)

| Pose | Arquivo | Quando usar |
|---|---|---|
| Feliz | `tuca-feliz.svg` | Boas-vindas, início, entrar, monte seu simulado |
| Acertou | `tuca-acertou.svg` | Feedback de acerto |
| Dica de Ouro | `tuca-dica-de-ouro.svg` | Feedback de erro ou tempo esgotado, ao lado da dica |
| Errou? Tenta de novo | `tuca-errou-tenta-de-novo.svg` | Resultado com poucos acertos |
| Respira fundo | `tuca-respira-fundo.svg` | Sem conexão, erros inesperados |
| Você sabia? | `tuca-voce-sabia.svg` | Bloco de curiosidade, quando houver espaço |
| Troféu | `tuca-trofeu.svg` | Resultado bom, perfil e conquistas |
| Sequência | `tuca-sequencia.svg` | Início com acertos seguidos |
| Lupa | `tuca-lupa.svg` | Revisão, histórico vazio, busca vazia |
| Lendo | `tuca-lendo.svg` | Carregando |
| Até amanhã | `tuca-ate-amanha.svg` | Fim do tempo diário ou despedida |
| Medalha | `tuca-medalha.svg` | Ranking, pódio |

## Mapa de uso por tela

| Tela | Pose (Kids) | Tamanho |
|---|---|---|
| 1 Entrar | Feliz | 120 px |
| 2 Recuperar senha | Feliz | 96 px |
| 3 Escolha de trilha | Feliz | 120 px |
| 4 Início | Feliz ou Sequência | 96 px |
| 5 Catálogo | nenhuma (vazio por filtro: Lupa) | 120 px |
| 6 Detalhe | nenhuma | - |
| **7 Questão** | **nenhuma (proibido)** | - |
| 8 Feedback | Acertou / Dica de Ouro / Errou? Tenta de novo / Você sabia? | 72 px |
| 9 Resultado | Troféu (bom) ou Errou? Tenta de novo | 140 px |
| 10 Revisão | Lupa | 72 px |
| 11 Histórico (vazio) | Lupa | 160 px |
| 12 Ranking | Medalha | 96 px |
| 13 Perfil | Troféu | 96 px |
| 14 Painel dos pais | nenhuma | - |
| 15 Monte seu simulado | Feliz | 72 px |
| Carregando | Lendo | 96 px |
| Sem conexão | Respira fundo | 140 px |
| Volte amanhã | Até amanhã | 120 px |

## Regras

1. **Nunca na tela de questão** (tela 7). O espaço da questão é só da criança e do conteúdo.
2. Só na trilha Kids. Em Escola e Técnico, use a ilustração sem personagem da tabela abaixo.
3. Um Tuca por tela, no máximo.
4. Nunca estique ou corte: mantenha a proporção; fundo transparente; espaço livre ao redor igual a 1/8 da altura.
5. Tamanhos permitidos: 72, 96, 120, 140 e 160 px (de altura). Não crie tamanhos intermediários.
6. Decorativo: `aria-hidden="true"` e `alt=""`. Se carregar significado, descreva ("Tuca comemorando um acerto").
7. Sem movimento por padrão. Se animar (um balanço leve), respeite `prefers-reduced-motion`.
8. Não faça novas poses, não mude as cores do Tuca e não o coloque em material de outras trilhas.
9. Não use o Tuca para comunicar erro grave, cobrança ou bloqueio.

## Ilustrações sem personagem (Escola e Técnico, e usos neutros)

| Arquivo | Uso |
|---|---|
| `caderno-vazio-kids.svg` / `-escola.svg` / `-tecnico.svg` | Listas vazias, na cor da trilha (Coral, Azul 600, Pinho) |
| `sem-conexao.svg` | Sem conexão (Escola e Técnico; na Kids use Respira fundo) |
| `podio.svg` | Ranking (Escola e Técnico; na Kids use Medalha) |
| `em-breve.svg` | Recursos ainda não disponíveis (telas 14 e 15 e trilhas) |

## Ícones

17 ícones em `assets/icones/` e o conjunto `_sprite.svg`. Grade de 24 px, traço de 2 px, pontas redondas, `currentColor`. Tamanhos 20, 24 e 28. Todo ícone que significa algo ao lado de texto é decorativo (`aria-hidden`); sozinho em um botão, o botão recebe `aria-label`. Não crie ícones novos sem seguir a grade.

## Ícones do app

Em `assets/brand/`. Ver `05-web-e-mobile.md`.
