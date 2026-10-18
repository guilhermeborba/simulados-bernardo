# ADR 009 — Coleção pessoal e apresentação por faixa

Data: 2026-10-13. Status: lote 08; validação de uso com pessoas pendente.

## Contexto

Aprender hoje e o resultado de quizzes já exibem XP calculado no servidor. Precisamos de personalização persistida entre dispositivos, adequada a todas as faixas e sem alterar a avaliação.

## Decisão

A rota protegida `/colecao` lê `GET /me/avatar` e `GET /me/achievements` pelo BFF autenticado. Catálogos, ownership, metas, progresso e concessões pertencem à API. O navegador apenas seleciona um item liberado e uma apresentação, mostra uma prévia e envia `PATCH /me/avatar` ao usar Salvar personalização. Só a confirmação do servidor passa a ser a seleção salva.

A API oferece seis itens: Início, Primeiro passo, Explorador, Constância, Missão e Horizonte. Cinco são liberados por conquistas verificadas no backend: primeiro quiz lógico, três temas, cinco quizzes distintos, primeira missão e 100 XP. Repetir um quiz ou mudar sua versão não aumenta a variedade de atividades. Prática sem novo XP por teto diário continua elegível ao progresso de conclusão. Os itens não acrescentam nem consomem XP.

`AUTO` usa Bolinha no Infantil, Capelo no Fundamental I e selos no Fundamental II, Médio e Enfermagem. Preferências de faixa prevalecem sobre o perfil escolar. `MASCOT` ou `SEAL` permitem escolher explicitamente a apresentação em qualquer faixa. Os símbolos SVG e as paletas diferenciam itens sem downloads de imagens, envio de fotos ou novas dependências. A opção persiste na conta; trocar de faixa mantém o item.

A home apresenta uma prévia compacta e acesso à coleção; o resultado oferece o mesmo acesso sem modificar o contrato de conclusão do quiz. Itens bloqueados mostram o critério e não podem ser selecionados. Controles nativos oferecem teclado, rótulos e feedback de carregamento/salvamento. Falha de gravação conserva a prévia para tentar novamente. A tela se adapta ao celular e respeita as preferências de movimento existentes.

Cada componente de coleção pertence ao usuário e à geração de sessão. Logout/troca de conta substitui o estado e cancela requisições, inclusive PATCH em andamento; respostas tardias não exibem coleção nem regravam cookies da conta anterior. Alterações são confirmadas pelo servidor, e o botão não permite gravações simultâneas do mesmo formulário. Os contratos da API continuam verificando aluno ativo e item liberado.

O BFF rejeita PATCH de avatar com Origin incompatível ou Sec-Fetch-Site cross-site, antes de consultar a API. A origem esperada utiliza o Host recebido e o protocolo HTTP/HTTPS do proxy, pois a origem interna de escuta do Next pode diferir da origem pública. Clientes HTTP sem Origin permanecem compatíveis.

## Consequências

A coleção é pessoal e durável: ausência ou mudança de faixa não retira itens. Não há compras, perdas por pausa, bônus de XP, ranking público de coleção ou mudança de notas. A migração da API preserva concessões elegíveis já registradas no lote 07. O acesso à coleção não modifica permissões de turma.

Testes automatizados usam conteúdo sintético, Next de produção, Nest e PostgreSQL descartável. Axe e Chromium desktop/mobile emulado complementam a regressão HTTP; sessões com pessoas, leitor de tela e dispositivos reais continuam pendentes. Revisão/publicação dos quizzes e missões não é inferida da implementação técnica.
