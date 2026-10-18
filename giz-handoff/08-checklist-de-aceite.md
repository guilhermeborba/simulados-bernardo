# 08 · Checklist de aceite

Use esta lista em cada entrega. "Pronto" = todos os itens aplicáveis marcados, verificados no navegador/aparelho e comparados ao protótipo.

## Global (toda tela)

- [ ] Cores, tamanhos, raios e fontes vêm de tokens; nenhum valor solto no código.
- [ ] Fredoka e Nunito carregadas; título com `text-wrap: balance`.
- [ ] Texto de leitura ≥16 px; nada abaixo de 12 px.
- [ ] Alvos de toque ≥48 × 48 px (56 na Kids).
- [ ] Uma ação principal (Coral) por tela; texto sobre Coral é Lousa.
- [ ] Foco visível em tudo que é interativo; ordem do Tab coerente.
- [ ] Foco vai para o h1 ao entrar na tela.
- [ ] Acerto/erro/estado nunca dependem só de cor (ícone + texto).
- [ ] Sem rolagem horizontal em 360, 390, 768, 1024 e 1440 px.
- [ ] Layout confere com o protótipo em "Celular" e "Computador".
- [ ] Estados de carregando, vazio, erro e sem conexão existem onde há dados.
- [ ] `prefers-reduced-motion` respeitado.
- [ ] Textos em português do Brasil, sem erro, no tom do `04-comportamento.md`.
- [ ] Sem preços, depoimentos, números ou prazos inventados.
- [ ] Sem o nome "Bernardo" em nenhum texto, ícone, título de aba ou metadado.

## Núcleo do simulado (telas 7, 8, 9)

- [ ] Alternativas são rádios reais com `fieldset`/`legend`.
- [ ] Estados: padrão, hover (web), foco, marcada, certa, errada, fora de jogo.
- [ ] Teclas A a D marcam, Enter confirma/avança, Esc fecha o painel de sair.
- [ ] Confirmar fica desligado até haver alternativa marcada.
- [ ] Cronômetro de 45 s opcional; anel `--urgent` em ≤10 s; anúncios em 30 s e 10 s só para leitor de tela.
- [ ] Tempo esgotado = em branco (`-1`), com a certa e a Dica de Ouro.
- [ ] Dica de Ouro só em erro/branco; Você sabia? só em acerto; a dica não entrega a resposta.
- [ ] Foco vai ao título do feedback e depois ao enunciado da próxima.
- [ ] **Não há Tuca nem figura** na tela de questão.
- [ ] Sair salva o progresso e "Continuar de onde parou" aparece no início.
- [ ] Resultado usa porcentagem para a mensagem (30 questões).
- [ ] Ver resultado só na última questão.

## Entrada e descoberta (1 a 6)

- [ ] Validação de e-mail, senha (mínimo 8 no cadastro), foco no primeiro erro.
- [ ] Recuperar senha não revela se o e-mail existe.
- [ ] Trilhas Escola/Técnico aparecem como "Em breve" e desligadas.
- [ ] Filtros combinam; "Limpar filtros" aparece quando a lista fica vazia.
- [ ] Tempo estimado correto (30 × 45 s = 22 min 30 s; 30 × 50 s = 25 min).

## Acompanhamento (10 a 13)

- [ ] Revisão mostra Sua resposta e Certa, com as dicas/curiosidades.
- [ ] Histórico, ranking e perfil tratam lista vazia.
- [ ] Ranking: só primeiro nome e inicial; linha do usuário dita "(você)".
- [ ] Opção Painel dos pais aparece como "Em breve".

## Navegação

- [ ] 4 itens (Início, Simulados, Ranking, Eu), sem botão central.
- [ ] `aria-current="page"` no item atual.
- [ ] Altura de 76 px mais o inset inferior; laterais respeitam insets.

## Acessibilidade (testes manuais)

- [ ] Percorrer o fluxo de uma questão só com teclado (web).
- [ ] Percorrer com leitor de tela (VoiceOver, TalkBack ou NVDA): rótulos, estados, anúncios.
- [ ] Fonte do sistema em 200%: nada corta nem se sobrepõe.
- [ ] Contraste conferido nas combinações de `01-tokens.md`.
- [ ] Tema escuro conferido tela a tela (ou escondido até conferir).

## Marca e lojas

- [ ] Ícone do app exportado para todos os tamanhos a partir do SVG.
- [ ] Nome "Giz" só publicado depois da checagem de marca (INPI classes 9, 41 e 42), domínio e lojas.
- [ ] Política de privacidade e declaração de público infantil nas lojas revisadas com o responsável.
- [ ] Linkado `CTA_URL` da página de vendas para o endereço final (hoje é o domínio antigo).
