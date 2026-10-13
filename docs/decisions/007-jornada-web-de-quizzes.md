# ADR 007 — Jornada web de quizzes e preferências por conta

Data: 2026-10-12
Status: implementado e validado automaticamente; revisão editorial e validação humana pendentes

## Contexto

A plataforma passou a oferecer quizzes com versões e snapshots próprios na API. Reutilizar o runner de simulados misturaria duas regras: no simulado, o aluno pode editar respostas antes de finalizar; no quiz, cada confirmação grava a resposta e libera uma explicação imediata. O quiz também precisa funcionar com poucos passos, sem bimestre, avaliação obrigatória ou cronômetro.

Filtros e acessibilidade da nova jornada precisam acompanhar a conta em diferentes dispositivos. A trilha dos simulados continua usando o armazenamento local descrito no ADR 003; essa decisão não é aplicada às preferências de quizzes.

## Decisão

Separar as rotas `/quizzes`, `/quiz/:quizId` e `/quizzes/historico`, mantendo o fluxo existente de simulados. A página inicial apresenta as duas atividades. O catálogo consulta somente quizzes publicados que a API autoriza para a conta e usa segmento/ano, disciplina e tema para facilitar a escolha. Não cria itens locais para preencher um catálogo vazio.

A nova jornada atende Educação Infantil, Fundamental I e II, Ensino Médio e Enfermagem. O ano escolar deriva a faixa visual já existente: lúdico, jovem ou exame. Infantil usa o mascote Bolinha, imagens descritivas e áudio opcional. Ensino Médio e Técnico usam a apresentação de estudo mais sóbria. Nenhuma faixa recebe limite de tempo imposto pelo frontend.

A realização é exclusiva do perfil `STUDENT`. Outros perfis podem consultar o catálogo, mas não recebem ações de início ou histórico de aluno. Permissões e disponibilidade continuam sendo verificadas pela API, inclusive ao retomar uma tentativa privada.

### Confirmação e retomada

O runner mantém a opção selecionada somente na memória até o aluno confirmar. Envia `answer.optionKey` ao servidor, usa o feedback retornado e bloqueia a edição após a confirmação. Nenhum gabarito ou correção é calculado no navegador.

A URL guarda o identificador da tentativa em `?attempt=...`, preservado também no retorno após login. Recarregar busca os snapshots e respostas já confirmadas; uma tentativa concluída abre o resultado existente. Iniciar novamente utiliza o contrato da API para retomar uma rodada em andamento, sem produzir tentativas locais fictícias.

Falhas de rede preservam a seleção e permitem repetir a confirmação ou conclusão. A idempotência pertence à API. Se outra aba já tiver confirmado uma opção diferente, o frontend recupera o que foi efetivamente gravado. Requisições antigas não atualizam o estado após a troca de tentativa, quiz ou conta.

O histórico distingue rodadas em andamento e concluídas. A API atualmente retorna a lista completa; a interface pagina oito itens por vez no cliente. Esse mecanismo não limita o volume transferido do servidor.

### Preferências autenticadas

`GET` e `PATCH /me/learning-preferences` mantêm `segment`, `schoolYear`, `audioEnabled` e `motionEnabled`. Os padrões são segmento/ano nulos, áudio desativado e movimento permitido. Trocar segmento envia segmento e ano juntos, evitando manter um ano incompatível com a nova faixa. Essas preferências não alteram o perfil escolar, a matrícula ou as permissões.

O provider é vinculado ao usuário e à geração da sessão autenticada. Descarta resultados de uma conta anterior, limpa o estado exibido na troca de conta e serializa operações para que respostas antigas não sobrescrevam alterações posteriores. Antes de enviar uma operação que aguardava na fila, confere novamente a geração da sessão. O provider de autenticação também cancela o bootstrap antigo e todas as requisições autenticadas pendentes antes de alterar cookies, evitando que um Set-Cookie atrasado de outra sessão sobrescreva a conta atual. Login, registro e logout são serializados; a mídia nativa é interrompida e sua origem removida ao desmontar. Só exibe o novo valor depois que o servidor confirma a persistência; uma falha mostra uma mensagem e mantém o valor anterior. Não utiliza uma chave global de `localStorage` para essa jornada.

O áudio nunca começa automaticamente. Ao desabilitá-lo ou sair da questão, a reprodução é interrompida. A configuração de movimento aplica redução de animações na aplicação; `prefers-reduced-motion` do dispositivo também é respeitado.

### Mídia através do BFF

O navegador recebe somente caminhos de mídia vinculados à tentativa. `quizMediaUrl` aceita o formato `/attempts/:id/questions/:questionId/media/image|audio` e o encaminha ao BFF de mesma origem. URLs externas, tokens em query e caminhos arbitrários não são utilizados.

O proxy autentica as requisições com os cookies httpOnly já existentes. Para as rotas reconhecidas, aceita SVG ou WAV, verifica o tamanho e os limites de respostas parciais e encaminha os bytes sem transformá-los em JSON. O header `Range` suporta a reprodução nativa de áudio. As respostas usam `private, no-store`, `nosniff` e CSP restritiva; os tokens continuam fora do JSON e das URLs do navegador.

Uma falha na imagem mostra sua descrição; uma falha no áudio permite usar a transcrição. O conteúdo textual e as alternativas continuam disponíveis para concluir o quiz. O BFF não disponibiliza as operações administrativas de edição/publicação de quizzes.

## Consequências e limites

O backend precisa oferecer os contratos dos lotes 03–05 e a migração de preferências do lote 06 antes do deploy desta versão web. A CI deve fixar o commit compatível da API, em vez de acompanhar uma branch em movimento.

Os 45 quizzes e 213 questões do acervo editorial inicial continuam com revisão `PENDING`. Implementar a jornada não aprova nem publica esse acervo. Os testes usam quizzes sintéticos em PostgreSQL descartável; seus enunciados não constituem a revisão editorial do conteúdo real.

O catálogo e histórico oferecem carregamento, erro com nova tentativa e estados vazios. Alvos de interação e foco visível favorecem teclado e telas pequenas. A automação com Chromium, viewport mobile e axe verifica comportamentos específicos; não substitui avaliação com crianças, estudantes de Enfermagem, pessoas com deficiência, leitores de tela ou aparelhos físicos.

Missões, XP e progressão pertencem ao lote 07. A pontuação exibida no resultado continua sendo a pontuação da tentativa calculada pela API, sem recompensas simuladas no frontend.

## Validação reproduzível

Consultar [CI e regressão](../guia-ci-regressao.md) para os comandos de tipos, sessão, build, HTTP e navegador. A conclusão das execuções e seus totais são registrados em `PROGRESS.md`; este ADR não presume aprovação editorial ou deploy.
