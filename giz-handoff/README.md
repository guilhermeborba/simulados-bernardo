# Giz: pacote de implementação (web e app mobile)

Este pacote descreve como implementar o Design System e as 15 telas do Giz, a nova marca do produto antes chamado "Simulados Bernardo". Foi escrito para um agente de desenvolvimento que vai trabalhar na versão web e no app mobile.

## Como usar este pacote

1. Leia este arquivo inteiro. Ele define o escopo, a ordem de trabalho e o que **não** inventar.
2. Instale os tokens (`tokens/`). Nada de cor, tamanho ou fonte deve ser escrito à mão fora deles.
3. Implemente os componentes (`02-componentes.md`) antes das telas.
4. Implemente as telas na ordem da seção "Ordem de implementação".
5. Use os protótipos HTML (`prototipos/`) como **referência de pixel e de comportamento**. Abra no navegador, alterne entre "Celular" e "Computador" e inspecione. Quando o texto e o protótipo divergirem, vale o protótipo, e a divergência deve ser avisada ao responsável.
6. Valide cada tela com o `08-checklist-de-aceite.md`.

## Conteúdo

| Arquivo | O que tem |
|---|---|
| `01-tokens.md` | Cores, tipos, medidas, movimento e como instalar `tokens/tokens.json` e `tokens/tokens.css` |
| `02-componentes.md` | 15 componentes com anatomia, medidas, estados e acessibilidade |
| `03-telas.md` | As 15 telas: rota sugerida, layout em celular e computador, dados, estados e transições |
| `04-comportamento.md` | Regras do simulado: fluxo da questão, cronômetro, pontuação, foco e leitor de tela |
| `05-web-e-mobile.md` | O que é igual e o que muda entre a versão web e o app, navegação, áreas seguras e ícone do app |
| `06-tuca-e-ilustracoes.md` | Onde cada pose do Tuca e cada ilustração aparece, tamanhos e regras |
| `07-dados.md` | Modelos de dados e eventos que as telas pedem (sugestão a reconciliar com a API existente) |
| `08-checklist-de-aceite.md` | Critérios para considerar cada entrega pronta |
| `tokens/` | `tokens.json` (fonte) e `tokens.css` (gerado) |
| `assets/` | SVGs: logotipo, ícones do app, 12 poses do Tuca, 6 ilustrações, 17 ícones e um sprite |
| `prototipos/` | 7 arquivos HTML navegáveis, com dados fictícios |

## Contexto do produto

- **Marca:** Giz. Família: Giz Kids (Fundamental I, com o personagem Tuca), Giz Escola (Fundamental II e Médio) e Giz Técnico (cursos técnicos).
- **v1 do lançamento:** só o público infantil (Giz Kids). Escola e Técnico entram depois, mas o Design System já os prevê como temas que só trocam a cor de destaque.
- **O que o produto faz:** simulados de múltipla escolha, 30 questões cada, por disciplina, bimestre e avaliação (AV1 e AV2). Cada questão tem uma **Dica de Ouro** (aparece quando a criança erra) e um **Você sabia?** (aparece quando acerta).
- **Plataforma atual:** a versão web já existe no ar (simulados-bernardo.vercel.app). Este trabalho redesenha a interface e prepara o app mobile. A stack atual do código não foi informada neste pacote: adapte os tokens e componentes à stack que já está no repositório, sem trocar de framework por causa deste documento.
- **Conteúdo atual:** simulados do 3º ano (Geografia, Português, Matemática, Ciências e História, esta última ainda incompleta). O 4º ano vem em seguida. O conteúdo das questões vive em outro repositório (`simulados-bernardo-api`) e **não faz parte deste pacote**.

## Decisões já tomadas (não reabrir)

1. **Azul 600 `#2F66DB`** é o azul de botões secundários, links e foco. O azul anterior (`#3B78F0`) foi descartado por contraste insuficiente (3,7:1 sobre o Papel).
2. **Navegação inferior sem botão central flutuante.** São 4 itens: Início, Simulados, Ranking, Eu.
3. **O texto sobre o Coral é sempre Lousa**, nunca branco.
4. **Acerto e erro nunca dependem só da cor.** Sempre ícone, texto e cor juntos.
5. **O Tuca só existe na trilha Kids** e **nunca aparece na tela de questão**.
6. **Um único Design System para todas as idades.** As trilhas variam só a cor de destaque (e o Tuca na Kids).
7. **Texto de leitura nunca abaixo de 16 px.**
8. As 12 poses do Tuca estão aprovadas.

## Ordem de implementação

Cada etapa deve poder ser entregue e revisada sozinha.

1. **Fundação:** tokens, fontes (Fredoka e Nunito), tema claro/escuro, base de acessibilidade (foco visível, `prefers-reduced-motion`).
2. **Componentes base:** botão, campo, ícones, chip, selo, abas, barra de progresso, cartão.
3. **Núcleo do simulado (telas 7, 8 e 9):** alternativa de resposta, cronômetro, Dica de Ouro, Você sabia?, painel inferior, resultado. É a parte mais importante do produto.
4. **Entrada e descoberta (telas 1 a 6):** entrar, recuperar senha, escolha de trilha, início, catálogo, detalhe.
5. **Acompanhamento (telas 10, 11, 12 e 13):** revisão, histórico, ranking, perfil e conquistas.
6. **Depois do lançamento (telas 14 e 15):** painel dos pais e monte seu simulado. Estão desenhadas e prototipadas, mas **não fazem parte do MVP**. Mostre-as como "Em breve" até serem construídas.
7. **Página de vendas:** `prototipos/landing-page-vendas.html`. Fica fora do app, no site de divulgação.

## O que NÃO inventar

- Não crie preços, planos, depoimentos, números de usuários ou prazos que não estejam neste pacote.
- Não troque cores, fontes, raios ou tamanhos por "algo parecido". Use os tokens.
- Não adicione botão central na navegação inferior.
- Não coloque o Tuca ou qualquer outra figura na tela de questão.
- Os dados dos protótipos (nomes como Lia, Ana, Davi, Bia, notas e pontos) são **fictícios**. Não os leve para o produto.
- As 5 questões de Geografia dos protótipos são **exemplo**. O simulado real tem 30 questões e vem do repositório de conteúdo.

## Pontos em aberto (perguntar ao responsável antes de decidir)

1. **Domínio e nome na loja de aplicativos:** a checagem de marca (INPI, classes 9, 41 e 42), domínio e lojas ainda não foi feita. Não publique o nome "Giz" em loja antes disso.
2. **Tema escuro:** os valores existem em `tokens.json`, mas o contraste não foi verificado tela a tela. Valide antes de liberar.
3. **Telas "a conferir":** login, detalhe do simulado, resultado e perfil foram desenhados a partir de um padrão de kit de quiz, não de prints específicos da referência (apenas 5 de 255 imagens da referência foram analisadas). Podem pedir ajuste fino.
4. **Pontuação e mensagens do resultado:** os cortes de mensagem do protótipo (ver `04-comportamento.md`) foram calibrados para 5 questões de exemplo e precisam ser convertidos em porcentagem para 30 questões. A proposta está no documento.
5. **Ranking:** a regra de pontos (como se calculam "pts") não está definida. O protótipo só mostra o número.
6. **Painel dos pais:** o desenho prevê uma pergunta de adulto para abrir o gabarito. No protótipo a conta é "7 × 8". No produto, defina como gerar a pergunta (aleatória, por exemplo).
7. **Aplicativo mobile:** a tecnologia do app (nativo, multiplataforma ou web empacotada) ainda não foi decidida. Este pacote evita assumir uma. As regras de `05-web-e-mobile.md` valem para qualquer uma.

## Arquivos de referência rápida

- Visão geral visual: `prototipos/prancha-design-system.html`
- Tuca e ilustrações: `prototipos/tuca-e-ilustracoes.html`
- Comportamento da questão: `prototipos/07-questao-feedback-resultado.html`
