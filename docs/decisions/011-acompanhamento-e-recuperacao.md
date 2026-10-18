# ADR 011 — Acompanhamento e recuperação de senha

Data: 2026-10-13. Status: lote 10; envio real e avaliação com pessoas pendentes.

## Decisão

`/acompanhamento` é uma rota protegida para responsáveis, professores e administradores. O login sem `returnTo` explícito leva esses perfis ao acompanhamento; a home e a navegação oferecem o mesmo acesso. A conta de aluno continua com sua jornada de prática.

A seleção de alunos vem de `GET /me/oversight-students`, que devolve somente ID, nome, ano do perfil e turmas autorizadas. Responsáveis precisam de vínculo atual com o aluno. Professores precisam de atribuição administrativa a uma turma ativa da qual o aluno participa; consultam atividades públicas e atividades dessas turmas. A API verifica o perfil atual, o estado da conta e os vínculos em cada leitura. Um papel TEACHER isolado não concede acesso a todos os alunos.

O acompanhamento usa os contratos abaixo pelo BFF autenticado:

| Consulta | Finalidade |
|---|---|
| `GET /me/oversight-students` | Selecionar um aluno autorizado |
| `GET /students/:id/learning-progress?schoolYear=...` | Contagens de prática por habilidade |
| `GET /reports/student/:id/summary` | Resumo e simulados recentes acessíveis |
| `GET /reports/student/:id/by-discipline` | Resultados de simulados por disciplina |

O progresso do aluno acompanhado contém `schoolYear`, `unclassifiedQuestions` e `skills`. Não devolve sugestões, tentativa de revisão, perguntas, respostas ou gabaritos. A área é somente leitura e não permite responder em nome do aluno. A atribuição de docentes e o vínculo de responsáveis continuam como operações administrativas da API.

Simulados concluídos aparecem separados da prática. Quizzes e revisões não entram nas médias de simulado. Os cartões de habilidade compartilham a apresentação do lote 09: primeiras respostas, repetições e revisões, com evidência insuficiente ou registros iniciais, sem declarar domínio. A escolha de ano/idade filtra habilidades e não altera preferências do aluno nem o resumo de simulados. XP, missões e itens não funcionam como avaliação.

Consultas usam AbortController, geração da sessão e estado identificado pelo aluno e pela faixa selecionada. Trocar aluno ou conta impede que uma resposta antiga substitua os dados atuais. As três consultas de registros são apresentadas juntas somente após sucesso; uma falha de autorização ou de transporte retira o conjunto de registros e oferece retry, que atualiza a lista de alunos. O BFF permite apenas os novos caminhos GET exatos de progresso/relatórios, sem abrir um prefixo genérico de relatórios administrativos. Essas respostas usam `Cache-Control: private, no-store`.

## Recuperação pública

`/esqueci-senha` solicita `POST /api/auth/forgot-password` com `{ email }`, encaminhado a `POST /auth/forgot-password`. Uma solicitação aceita retorna 202 com a mesma mensagem para contas existentes e inexistentes: “Se houver uma conta ativa para este e-mail, enviaremos as instruções de recuperação.” A tela não informa se existe conta, se houve envio ou qual é o link. Configuração indisponível e falhas de comunicação com a API têm mensagem temporária; 429 orienta aguardar. Falha de entrega tratada pela API preserva a resposta neutra e invalida o link que não foi entregue.

O link de e-mail abre `/redefinir-senha#token=<token>`. O token de 43 caracteres base64url fica no fragmento, que não é enviado ao servidor na navegação. O cliente o lê uma vez por link e remove imediatamente o fragmento com `history.replaceState`; guarda o token somente em memória, sem localStorage, sessionStorage ou cookies. As páginas usam `Referrer-Policy: no-referrer`. Não há GET de validação ou consumo. Novos fragmentos no mesmo caminho também são capturados: substituem o token, limpam o formulário e o estado de sucesso, abortam a requisição anterior e descartam respostas de outra geração. Isso permite abrir um link após a tela sem token ou depois de uma redefinição, sem manter o segredo na URL. Recarregar depois de remover o fragmento exige abrir novamente o link completo do e-mail.

Somente o envio explícito do formulário faz `POST /api/auth/reset-password`, com `{ token, password }`, encaminhado ao endpoint homônimo da API. A confirmação da senha é local. A política da nova senha exige pelo menos oito caracteres Unicode, contados por codepoints, e no máximo 72 bytes UTF-8, evitando truncamento pelo bcrypt. O servidor é a autoridade para validade, expiração e uso único do token. Link inválido, expirado ou usado retorna 400; a interface oferece solicitar outro link.

As duas rotas BFF públicas verificam Origin e rejeitam `Sec-Fetch-Site: cross-site`, retornam 400 para JSON inválido e normalizam falhas temporárias upstream para 503. Não passam pelo coordenador autenticado, não registram payloads e não criam, rotacionam ou limpam cookies de sessão. A redefinição não autentica automaticamente nem encerra uma conta diferente que esteja aberta no navegador. A API invalida as sessões antigas da conta cuja senha mudou; o próximo acesso autenticado precisa reconhecer essa revogação. Após sucesso, a página oferece entrar normalmente.

A mensagem neutra, confirmação da senha, consumo único e login normal após redefinição seguem os cuidados descritos no [guia OWASP de recuperação](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html). O uso de fragmento removido da URL é uma decisão deste projeto para reduzir exposição do token na navegação.

## Envio e limites

O provedor escolhido é Resend, integrado na API. A chave e o remetente ficam no backend; o frontend não recebe credenciais do provedor. O envio usa o contrato de destinatário, remetente e conteúdo da [API Send Email do Resend](https://resend.com/docs/api-reference/emails/send-email). Ativar envio real exige configurar a chave, um remetente verificado, a URL pública correta e a habilitação da recuperação fora do chat. Essas configurações e a entrega real ainda não foram validadas nesta entrega.

A regressão usa Next de produção, Nest real, PostgreSQL descartável e captura de e-mails sintéticos em memória, somente em loopback. Exercita contratos, revogação, uso único, falhas e isolamento. Chromium desktop/mobile emulado, teclado e axe avaliam as telas inspecionadas; não substituem pessoas, leitores de tela, aparelhos físicos ou verificação de entrega do Resend. Não houve deploy, envio externo nem alteração de banco existente. O catálogo editorial permanece pendente de revisão/publicação.


O limite de recuperação da API usa o IP do chamador imediato, sem confiar em `X-Forwarded-For`. Usuários que chegam pelo mesmo BFF compartilham esse orçamento de 20 requisições por minuto por endpoint; não há promessa de uma cota por navegador. O cooldown de 60 segundos por conta é coordenado no PostgreSQL. Antes de ampliar o uso, avaliar o orçamento e definir a política de proxy/perímetro da infraestrutura; não aceitar cabeçalhos arbitrários como identidade do cliente.
