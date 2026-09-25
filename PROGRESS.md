# Estado do Projeto — simulados-bernardo

> Atualizado em: 2026-09-25
> Atualizar este arquivo ao concluir cada feature ou iniciativa relevante.

## Status geral

O frontend está **integrado com a API e em produção**. A migração dos dados estáticos (`data/*.ts`) para a API está concluída. O app cobre o fluxo completo do aluno: login, seleção, execução do simulado, resultado, histórico e ranking de turma.

---

## Features implementadas

| Feature | Status | PR/commit |
|---|---|---|
| Integração com API (auth + simulados + tentativas) | ✅ Concluída | — |
| BFF com cookies httpOnly (sb_access_token / sb_refresh_token) | ✅ Concluída | — |
| Auto-refresh de token no proxy catch-all | ✅ Concluída | — |
| Tela de seleção com máquina de estados (trilha → hero → ano/bimestre/AV) | ✅ Concluída | — |
| Porta de entrada com escolha de trilha (Fundamental, Técnico, Infantil) | ✅ Concluída | PR #30 |
| Trilha de Educação Infantil (4 e 5 anos, mascote Bolinha) | ✅ Concluída | PR #36 |
| Trilha de Cursos Técnicos (navegação por curso e eixo temático) | ✅ Concluída | PR #30 |
| Runner do simulado com envio de respostas ao servidor | ✅ Concluída | — |
| Faixas visuais por faixa etária (lúdico/jovem/exame) | ✅ Concluída | PR #25 |
| Cronômetro e navegador de questões (jovem/exame) | ✅ Concluída | PR #26 |
| Retomada de tentativa em andamento | ✅ Concluída | PR #27 |
| Histórico com accordion e retomada | ✅ Concluída | PR #27 |
| Tela de pontuação e ranking da turma | ✅ Concluída | PR #34 |
| Entrada na turma por link de convite | ✅ Concluída | PR #32 |
| Middleware de proteção de rotas | ✅ Concluída | — |
| Derivação de disponibilidade do catálogo da API | ✅ Concluída | PR #33 |

---

## Próximas iniciativas

### 1. Recuperação de senha

Backend ainda não implementou os endpoints `/auth/forgot-password` e `/auth/reset-password`. Quando o backend entregar, o frontend precisa de:
- Tela `/esqueci-senha` com campo de e-mail
- Tela `/redefinir-senha?token=...` com campos de nova senha
- Link na tela de login

### 2. Área do responsável

Fora de escopo na integração inicial. O backend já tem os endpoints de vínculo (`/guardians`) e relatórios por aluno. Precisará de uma seção separada no app ou de um app diferente.

### 3. Educação Infantil — pausas entre rodadas

O `SimuladoRunner` já tem a infraestrutura (`pauseRound`, `roundsSeen`) para pausar após a 10ª e 20ª questões na trilha Infantil, com interação do mascote Bolinha. Está parcialmente implementado — verificar o estado atual antes de retomar.

---

## Infraestrutura

- **Deploy:** não configurado (verificar `.claude/launch.json` para config de preview local)
- **CI:** não configurado
- **Testes:** nenhum framework — verificação via `tsc --noEmit`, `next lint` e testes manuais
- **Backend esperado em:** `BACKEND_API_URL` (padrão: `http://localhost:3333`)

---

## Decisões arquiteturais registradas

Ver `docs/decisions/` para o raciocínio por trás das escolhas não óbvias do projeto.
