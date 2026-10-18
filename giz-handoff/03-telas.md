# 03 · Telas

15 telas. Para cada uma: rota sugerida, objetivo, layout em celular e em computador, dados, estados e saídas. As rotas são **sugestões**: use o padrão de rotas que o projeto já tem. Abra o protótipo indicado para ver a medida exata.

Arquivos de protótipo (em `prototipos/`):
- Telas 1 a 6: `01-06-entrada-trilha-inicio-catalogo-detalhe.html`
- Telas 7, 8 e 9: `07-questao-feedback-resultado.html`
- Telas 10 a 13: `10-13-revisao-historico-ranking-perfil.html`
- Telas 14 e 15: `14-15-painel-pais-monte-simulado.html`

**Escopo:** telas 1 a 13 fazem parte do MVP. Telas 14 e 15 são "Depois": construa só a entrada "Em breve".

**Regras comuns a todas as telas**
- Uma ação principal (botão Coral) por tela.
- Celular: cabeçalho escuro (Lousa) com título e, quando preciso, botão voltar de 48 × 48 px. Conteúdo sobre o Papel. Barra inferior de 4 itens nas telas de nível 1 (Início, Simulados, Ranking, Eu). Telas de fluxo (1, 2, 7, 8, 9, 10, 14, 15) **não** têm barra inferior.
- Computador: barra lateral de 240 px, cabeçalho com trilha de navegação, conteúdo em até 1280 px.
- Toda tela tem os quatro estados de `02-componentes.md` item 15 quando mostra dados.
- Foco: ao entrar numa tela, o foco vai para o título principal (h1).

---

## 1. Entrar e criar conta
**Rota:** `/entrar` · **Protótipo:** 01-06 · **MVP**
- **Objetivo:** entrar ou criar conta.
- **Celular:** cabeçalho com logotipo e Tuca (Feliz, 120 px, só na Kids); abas "Entrar" / "Criar conta"; campos; botão primário em largura total; link "Esqueci a senha".
- **Computador:** duas colunas. Esquerda: Lousa com logotipo, frase de valor e Tuca. Direita: formulário num cartão de até 440 px.
- **Campos:** Entrar: e-mail, senha. Criar conta: nome, e-mail, senha (mínimo 8 caracteres).
- **Validação:** e-mail pelo padrão `^[^\s@]+@[^\s@]+\.[^\s@]+$`; senha obrigatória; no cadastro, mínimo 8. Ao enviar com erro, foco no primeiro campo inválido.
- **Estados:** padrão, erro de campo, erro de credencial ("E-mail ou senha não conferem."), enviando (botão desligado com texto "Entrando…"), sem conexão.
- **Saída:** sucesso vai para a tela 3 (primeiro acesso) ou 4.

## 2. Recuperar senha
**Rota:** `/recuperar-senha` · **MVP**
- Um campo (e-mail) e um botão "Enviar link". Depois do envio, mostra confirmação sem revelar se o e-mail existe: "Se o e-mail estiver cadastrado, você vai receber o link."
- Link "Voltar para entrar". Mesmo layout da tela 1, sem abas.

## 3. Escolha de trilha
**Rota:** `/trilha` · **MVP (só Kids ativa)**
- **Objetivo:** escolher a trilha de estudo (Kids, Escola, Técnico).
- **Celular:** Tuca (Feliz, 120 px) e título; três cartões de trilha empilhados, altura mínima 96 px, cada um com ícone na cor da trilha (Coral, Azul 600, Pinho), nome e faixa de idade.
- **Computador:** três cartões lado a lado.
- **v1:** só Kids é selecionável. Escola e Técnico aparecem com selo "Em breve" e `aria-disabled`.
- **Saída:** escolher Kids leva à tela 4.

## 4. Início
**Rota:** `/` · **Protótipo:** 01-06 · **MVP**
- **Objetivo:** retomar ou começar um simulado.
- **Celular:** saudação com o nome ("Oi, <nome>!") e Tuca (Feliz ou Sequência, 96 px); chip "N acertos seguidos" quando houver; cartão "Continuar de onde parou" (se houver simulado em andamento); lista "Novos para você" com cartões de simulado; barra inferior.
- **Computador:** coluna principal com os mesmos blocos e coluna lateral de 320 px com sequência e último resultado.
- **Dados:** nome, simulado em andamento (id, título, questões respondidas), lista de novos, sequência.
- **Estados:** carregando, vazio ("Nenhum simulado novo por enquanto"), erro, sem conexão.

## 5. Catálogo de simulados
**Rota:** `/simulados` · **MVP**
- **Objetivo:** achar um simulado por disciplina, bimestre e avaliação.
- **Layout:** fileira de chips de filtro (disciplina, bimestre, AV1/AV2), depois a grade de cartões de simulado. Celular em 1 coluna; tablet em 2; computador em 3.
- **Filtros:** chips com `aria-pressed`; "Todos" limpa. Filtros combinam (E).
- **Estados:** vazio por filtro ("Nada por aqui com esses filtros." com botão "Limpar filtros").

## 6. Detalhe do simulado
**Rota:** `/simulados/:id` · **MVP**
- **Objetivo:** ver o que é e começar.
- **Conteúdo:** título, legenda (3º ano, bimestre, avaliação), nº de questões (30), tempo estimado (30 × 45 s = 22 min 30 s com cronômetro; 30 × 50 s = 25 min sem), explicação curta de como funciona (Dica de Ouro e Você sabia?), alternância de cronômetro (ligado por padrão), botão "Começar" ou "Continuar".
- **Computador:** conteúdo à esquerda, cartão com o botão à direita (fixo no rolar).
- **Saída:** Começar leva à tela 7, questão 1.

## 7. Questão
**Rota:** `/simulados/:id/questao/:n` · **Protótipo:** 07 · **MVP · a mais importante**
- **Celular:** cabeçalho Lousa com botão sair (X, 48 × 48), título "Geografia, AV1", cronômetro em anel (56 px) e barra de progresso "12 de 30"; cartão da questão sobe 40 px sobre o cabeçalho; alternativas; rodapé fixo com botão "Confirmar" (largura total) sobre o Papel, padding 12 16 24.
- **Computador:** coluna principal com cartão da questão (enunciado 24/32) e alternativas; coluna de 320 px com cronômetro grande (88 px), progresso e **mapa de questões** de 5 colunas com células de 48 px (respondida, atual, em branco).
- **Não há Tuca, nem figura decorativa**, nesta tela.
- **Estados:** nenhuma marcada (Confirmar desligado), marcada, tempo acabando (anel `--urgent`), tempo esgotado (ver tela 8), janela de sair.
- **Sair:** abre o painel/janela "Sair do simulado?" com texto "Seu progresso fica salvo." e duas ações: "Continuar" (foco inicial) e "Sair e continuar depois".

## 8. Feedback da questão
**Mesma rota da 7, estado após confirmar.** · **MVP**
- **Acerto:** alternativa certa em verde, selo "Certo", bloco **Você sabia?**, Tuca "Acertou" (72 px) **apenas dentro do painel de feedback**, nunca sobre a questão. Botão "Próxima" (ou "Ver resultado" na última).
- **Erro:** a marcada em vermelho com "Errado" e a certa em verde, bloco **Dica de Ouro**, Tuca "Dica de Ouro" ou "Errou? Tenta de novo" (72 px) no painel.
- **Tempo esgotado:** título "O tempo acabou", conta como em branco, mostra a certa e a Dica de Ouro.
- **Celular:** painel colado embaixo (sem véu), com a questão rolando acima. **Computador:** bloco de feedback abaixo das alternativas.
- Foco vai para o título do feedback. Região `aria-live="polite"` anuncia "Resposta certa" ou "Resposta errada".
- Texto de feedback nunca culpa. Ex.: "Quase! Vamos olhar a dica." Ver tom em `04-comportamento.md`.

## 9. Resultado
**Rota:** `/simulados/:id/resultado` · **MVP**
- **Conteúdo:** anel de pontuação (acertos de 30), mensagem, Tuca (Troféu se for bom, Errou? Tenta de novo caso contrário; 140 px), quatro números (Certas, Erradas, Em branco, Tempo médio), barras por tema, botões "Revisar respostas" (primário) e "Voltar ao início", e lista recolhível `details` com questões.
- **Mensagem:** ver cortes em `04-comportamento.md`.
- **Computador:** anel e mensagem à esquerda, números e barras à direita.

## 10. Revisão das respostas
**Rota:** `/simulados/:id/revisao` · **MVP**
- **Layout:** lista de questões do simulado, cada uma com enunciado, alternativas nos estados de revisão ("Sua resposta", "Certa"), e blocos Dica de Ouro (erradas) ou Você sabia? (certas). Filtro: Todas, Erradas, Em branco.
- **Celular:** tela de fluxo com botão voltar; **computador:** lista com índice lateral. Tuca "Lupa" (72 px) no topo (Kids).
- **Atenção:** a revisão mostra a resposta certa porque o simulado já terminou.

## 11. Histórico
**Rota:** `/historico` · **MVP**
- Lista de tentativas (linhas de histórico, `02-componentes.md` item 11), da mais recente para a mais antiga. Toque abre o resultado da tentativa.
- **Vazio:** Tuca "Lupa" (160 px) (Escola e Técnico: caderno vazio) com "Você ainda não fez nenhum simulado" e botão "Escolher um simulado".

## 12. Ranking
**Rota:** `/ranking` · **MVP**
- **Layout:** abas "Turma" / "Geral" (botões com `aria-pressed`), pódio dos três primeiros (Tuca "Medalha" 96 px; Escola: ilustração de pódio) e lista a partir da 4ª posição. A linha do usuário é destacada e dita "(você)".
- **Privacidade:** crianças aparecem só com **primeiro nome e inicial**, sem foto. Veja o ponto em aberto sobre regra de pontos no README.
- **Vazio:** quando ainda não há dados da turma, texto explicando e botão para fazer um simulado.

## 13. Perfil e conquistas
**Rota:** `/eu` · **MVP**
- **Conteúdo:** avatar com inicial, nome, trilha atual, conquistas (cartões com medalha; bloqueadas em cinza com texto "Faltam N para ganhar"), linhas de configuração: Tema (claro, escuro, automático), Cronômetro por padrão, Painel dos pais (**Em breve**), Sair.
- **Computador:** conquistas em grade de 3 colunas.
- Tuca "Troféu" (96 px) no topo (Kids).

## 14. Painel dos pais
**Rota:** `/pais` · **Depois (mostrar "Em breve")**
- Barreira de adulto: pergunta de multiplicação (no protótipo "7 × 8", resposta 56) antes de mostrar o gabarito e o desempenho. Resposta errada gera outra pergunta, sem punição.
- Depois de aberto: resumo do desempenho por disciplina e a lista de questões com **gabarito**. Sem Tuca.
- **A pergunta do produto deve ser gerada** (não fixa). Em aberto no README.

## 15. Monte seu simulado
**Rota:** `/simulados/novo` · **Depois (mostrar "Em breve")**
- Escolhas: disciplinas (múltipla), bimestre, nº de questões (10, 15, 20 ou 30), cronômetro ligado/desligado.
- Tempo estimado: `n × 45 s` com cronômetro e `n × 50 s` sem.
- Tuca "Feliz" (72 px) no topo (Kids). Botão "Criar simulado" desligado até haver uma disciplina.
