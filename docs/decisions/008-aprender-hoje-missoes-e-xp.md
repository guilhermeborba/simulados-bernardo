# ADR 008 — Aprender hoje, missões e XP

Data: 2026-10-13. Status: implementado no lote 07; validação humana pendente.

## Decisão

A home mantém a seleção existente de simulados e apresenta Aprender hoje para contas STUDENT. Visitantes e outros perfis conservam a escolha de quizzes e simulados. Não é necessário criar uma nova rota para consultar o progresso.

GET /me/learning-home reúne faixa resolvida, saldo acumulado/diário, quiz em andamento, missões semanais e sugestão. A web consome esse contrato pelo BFF autenticado com cookies httpOnly. Missões e XP são propriedade da conta e não usam localStorage. A troca de conta substitui a árvore do componente e cancela consultas; respostas de outra geração de sessão não podem restaurar progresso ou cookies.

A seleção contempla Infantil 4/5 anos, 1º–9º ano, três séries do Médio e Enfermagem. A preferência salva prevalece sobre o ano cadastrado. Se só existe ano do cadastro, a interface o apresenta sem criar automaticamente uma preferência. Sem faixa resolvida, a home orienta a escolha e mantém saldo/retomada. A apresentação segue a faixa etária; Bolinha acompanha Infantil e textos de Médio/Enfermagem destacam revisão e prática.

Cada missão apresenta janela semanal de São Paulo, atividades ordenadas, progresso e a próxima atividade. As etapas já concluídas apontam para a tentativa original, inclusive quando existe uma nova versão publicada do quiz. Conteúdo indisponível e privado são filtrados no backend; a web não preenche missões ausentes com conteúdo fictício.

A regra inicial é 10 XP na primeira conclusão de cada quiz lógico por dia, até 50 XP por dia. Resultado e missões são independentes das notas e do ranking de simulados. A web exibe o recibo de recompensa salvo no servidor, sem calcular elegibilidade localmente. Reabrir um resultado conserva seu XP e a mensagem se refere àquela conclusão; zero XP pode significar repetição, teto ou resultado anterior à feature. Missões não acrescentam bônus neste piloto.

A interface usa seleção nativa, links, progress com nomes acessíveis e mensagens de carregamento/falha. O aluno pode repetir a consulta e fazer uma pausa; não existem contagens regressivas, perda de saldo ou penalidade por ausência. Movimento segue as preferências da conta e do dispositivo. Falhas não exibem valores inventados.

## Validação e limites

Testes reais Next/BFF/API/PostgreSQL e Chromium desktop/mobile emulado cobrem progresso, retomada, recibo idempotente, troca de faixa/conta, respostas atrasadas e acessibilidade automatizada. O CI fixa o commit compatível da API. Migrations e fixtures publicadas são restritas a bancos descartáveis.

A curadoria propõe 30 rascunhos para as 15 faixas; publicação exige revisão e quizzes disponíveis. O acervo de quizzes preparado continua PENDING. Não houve deploy, seed em base existente ou publicação editorial. Sessões com alunos/adultos, leitor de tela e aparelhos físicos continuam pendentes. Avatar, coleções e conquistas ficam no lote 08.
