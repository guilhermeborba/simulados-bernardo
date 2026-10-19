# 04 · Comportamento

Regras do simulado e da interação. Referência viva: `prototipos/07-questao-feedback-resultado.html`.

## Fluxo de uma questão

1. A questão aparece. Nenhuma alternativa marcada. "Confirmar" desligado. O cronômetro (se ligado) começa em 45 s.
2. A criança marca uma alternativa (toque, clique ou tecla A a D). Pode trocar à vontade. "Confirmar" liga.
3. **Confirmar** trava as alternativas e mostra o feedback (tela 8): acerto, erro ou em branco.
4. **Próxima** vai à questão seguinte. Na última, o botão diz **Ver resultado**.
5. Cada confirmação é gravada na hora (ver `07-dados.md`), para que sair e voltar nunca perca progresso.

## Cronômetro

- 45 s por questão, **opcional** (alternância na tela 6 e no perfil). Sem cronômetro: sem anel e sem pressão; o texto diz "Sem limite de tempo".
- Quando chega a 0: a resposta vira **em branco** (`-1` nos dados), aparece "O tempo acabou", a alternativa certa e a Dica de Ouro. Sem mensagem de falha.
- Últimos 10 s: o anel muda para `--urgent`. Não pisca, não vibra, não toca som.
- Leitor de tela: anuncia só "Faltam 30 segundos." e "Faltam 10 segundos." (`aria-live="polite"`). Nunca segundo a segundo.
- Sair com o painel aberto **pausa** o cronômetro (estado "Progresso salvo"). Ao voltar, a questão atual recomeça com 45 s inteiros, sem prejuízo.
- Mudar de aba do navegador ou ir para o fundo no app **não** reinicia nem pune. Pausa.

## Pontuação

- Cada acerto vale 1 ponto de acerto. Erro e em branco não tiram nada.
- O resultado mostra Certas, Erradas, Em branco e Tempo médio por questão.
- Barras por tema: acertos ÷ questões do tema.
- **"Pontos" do ranking é outra coisa** e a regra ainda não existe (README, ponto 5). Não invente.

## Sequência de acertos

O chip "N acertos seguidos" aparece a partir de 2 e some no primeiro erro ou em branco. É informativo, não pune.

## Mensagem do resultado (proposta, a validar)

O protótipo usava 5 questões. Para 30, use **porcentagem** (acertos ÷ 30 questões do simulado):

| Faixa | Título | Complemento |
|---|---|---|
| 80% ou mais | "Mandou bem!" | "Você acertou N de 30." |
| 50% a 79% | "Bom caminho!" | "Vamos rever as dicas?" |
| Abaixo de 50% | "Vale tentar de novo!" | "Cada tentativa te deixa mais forte." |

Cores do quadrado de nota no histórico: `--ok-bg` a partir de 80%, `--hl-bg` de 60% a 79%, `--err-bg` abaixo de 60%. (Mantém coerência: 24 de 30 = 80%.) Confirmar os cortes com o responsável.

## Tom das mensagens (todas as idades, adequadas à criança de 8 a 9 anos)

- Frases curtas, positivas, em português do Brasil. Nada de "errou", "falhou", "incorreto" em destaque. Use "Quase!", "Vamos olhar a dica?".
- A Dica de Ouro **nunca entrega a resposta**.
- Nunca compare com outras crianças fora do ranking.
- Nunca use contagem regressiva alarmante ou som de erro.

## Teclado (web)

| Tecla | Ação |
|---|---|
| A, B, C, D | Marca a alternativa correspondente |
| Setas | Move entre alternativas |
| Enter | Confirma (se houver marcada) ou vai para a próxima |
| Esc | Fecha a janela "Sair do simulado?" |
| Tab | Ordem: sair, alternativas, confirmar |

## Foco e leitor de tela

- Ao mostrar o feedback, o foco vai para o título do feedback ("Resposta certa" / "Quase!").
- Ao ir para a próxima questão, o foco vai para o enunciado (h1) da nova questão.
- Mudanças de estado do tipo certo/errado são anunciadas numa região `aria-live="polite"`.
- Ícones decorativos têm `aria-hidden="true"`. O estado nunca é só cor (ícone + texto).
- A alternativa certa, depois de respondida, é anunciada como "Certa" e a escolhida errada como "Sua resposta, errada".

## Sair e retomar

- "Sair" abre o painel de confirmação. Confirmar grava o ponto e volta ao início. O cartão "Continuar de onde parou" aparece na tela 4.
- Se a conexão cair no meio, mantenha as respostas localmente e sincronize depois; mostre "Sem conexão. Seu progresso está salvo." (sem bloquear a criança).

## Painel dos pais: barreira de adulto

Pergunta de multiplicação simples, **gerada a cada abertura** (fatores de 2 a 9). Resposta errada gera nova pergunta. A barreira não substitui autenticação de adulto: é só para crianças de 8 a 9 anos não entrarem sem querer.

## Login

- Validação ao enviar (não a cada tecla). Mensagens em linguagem simples.
- Erro de credencial não diz qual campo está errado.
- Recuperar senha nunca confirma se o e-mail existe.

## Movimento

Toda animação respeita `prefers-reduced-motion`. Sem movimento: painéis aparecem sem subir, anéis só atualizam o valor, Tuca fica parado.
