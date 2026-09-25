# simulados-bernardo — Guia para Agentes

Frontend da plataforma educacional **Simulados Bernardo**: interface para alunos realizarem simulados escolares, acompanharem histórico e disputarem ranking de turma.

**Repositório irmão (backend):** `/home/guilhermeborba/projects/simulados-bernardo-api`

## Stack

- **Next.js 14** App Router + TypeScript
- **Tailwind CSS** (sem component library — tudo feito à mão)
- **Fontes:** Fredoka (`--font-fredoka`, títulos/destaque) e Nunito (`--font-nunito`, corpo)
- **Sem framework de testes** — verificação via `npx tsc --noEmit` + `npm run lint`; testes funcionais são manuais

## Como rodar localmente

O backend precisa estar rodando antes do frontend.

**Backend (em `simulados-bernardo-api`):**
```bash
docker compose up -d
npm run prisma:migrate
npm run seed
npm run start:dev
```

**Frontend (aqui):**
```bash
cp .env.local.example .env.local   # só na primeira vez
npm run dev                         # http://localhost:3000
```

Única variável de ambiente obrigatória: `BACKEND_API_URL=http://localhost:3333`

## Arquitetura

### BFF — o navegador nunca fala diretamente com a API

Todo fetch autenticado passa por rotas de API do próprio Next.js. O navegador só conhece URLs relativas (`/api/...`).

```
Navegador
  │  fetch('/api/auth/login')         ← client-side (lib/apiClient.ts)
  ▼
Next.js (servidor)
  │  backendFetch('http://localhost:3333/auth/login')
  ▼
simulados-bernardo-api
```

### Estrutura de arquivos

```
app/
  layout.tsx                    # AuthProvider, fontes globais
  page.tsx                      # → SelectionScreen
  login/page.tsx
  registro/page.tsx
  simulado/[simulationId]/page.tsx
  historico/page.tsx
  ranking/page.tsx
  convite/page.tsx
  api/
    auth/
      login/route.ts            # seta cookies httpOnly
      logout/route.ts           # limpa cookies, invalida no backend
      register/route.ts
      me/route.ts               # proxy simples sem cookie side-effect
    backend/[...path]/route.ts  # catch-all proxy autenticado

components/
  SelectionScreen.tsx           # máquina de estados da tela inicial
  HeroStep.tsx                  # boas-vindas / entrada geral
  TrilhaStep.tsx                # escolha da trilha de estudo
  SelectionStep.tsx             # escolha de ano/bimestre/AV
  DisciplineStep.tsx            # escolha de disciplina
  TecnicoStep.tsx               # navegação do curso técnico
  InfantilStep.tsx              # trilha da Educação Infantil
  SimuladoRunner.tsx            # execução do simulado (questões + resultado)
  LoginForm.tsx
  RegisterForm.tsx
  HistoricoList.tsx
  RankingView.tsx
  ConviteView.tsx               # entrada na turma por link de convite
  MascoteGuia.tsx               # Bolinha (mascote da Educação Infantil)
  SeloDiasSeguidos.tsx

contexts/
  AuthContext.tsx               # user, isLoading, login, register, logout, useAuth()

lib/
  apiClient.ts                  # TODAS as chamadas do lado do cliente (browser)
  backendFetch.server.ts        # fetch HTTP bruto para o backend (server-only)
  authenticatedBackendFetch.server.ts  # backendFetch + JWT + auto-refresh (server-only)
  authResponse.server.ts        # helpers de resposta para rotas de auth
  serverCookies.ts              # nomes dos cookies + set/clear helpers
  questionMapper.ts             # converte ApiQuestion → TemplateQuestion
  trilha.ts                     # sistema de trilhas + localStorage
  tier.ts                       # faixa visual por ano escolar

middleware.ts                   # protege /simulado/* e /historico
```

## Padrões de código

### Calls ao backend

**Do navegador (Client Components):** use funções de `lib/apiClient.ts`. Elas chamam `/api/...` via fetch relativo.

**Do servidor (Server Components, Route Handlers):** use `authenticatedBackendFetch` de `lib/authenticatedBackendFetch.server.ts`. Ele lê os cookies do request, injeta o token, e faz o refresh automático se receber 401.

Nunca importe `lib/*server*` em Client Components — o Next.js vai reclamar de código server-only no bundle do cliente.

### Proxy catch-all

`app/api/backend/[...path]/route.ts` faz proxy autenticado de qualquer rota listada em `ALLOWED_PREFIXES`:

```ts
const ALLOWED_PREFIXES = ['disciplines', 'simulations', 'attempts', 'me'];
```

Para adicionar acesso a um novo recurso da API, basta adicionar o prefixo ao array.

### Cookies de autenticação

| Cookie | Valor | Max-age |
|---|---|---|
| `sb_access_token` | JWT access | 15 min |
| `sb_refresh_token` | JWT refresh | 7 dias |

Ambos `httpOnly`, `sameSite=lax`, `secure` apenas em produção. O JS do navegador nunca os vê.

O refresh automático acontece em `authenticatedBackendFetch.server.ts`: recebeu 401 → tenta refresh → repete a requisição original com o novo token.

### Autenticação no cliente

```tsx
const { user, isLoading, login, logout } = useAuth();
```

`user` é `null` quando deslogado. `isLoading` é `true` durante o fetch inicial de `/api/auth/me` — renderizar baseado em `user` sem checar `isLoading` causa flash de conteúdo errado.

### Middleware de proteção

`middleware.ts` redireciona para `/login?returnTo=<path>` quando o cookie `sb_refresh_token` está ausente nas rotas `/simulado/*` e `/historico`. Usa o refresh token (não o access) porque ele é de longa duração — se expirou, o auto-refresh resolve na próxima chamada autenticada.

## Trilhas de estudo

O app tem três trilhas, salvas em `localStorage` (`simulados:trilha`):

| Trilha | Label | `schoolYear` no backend |
|---|---|---|
| `basica` | Ensino Fundamental e Médio | 1–9 |
| `tecnico` | Cursos Técnicos | `0` (sentinela) |
| `infantil` | Educação Infantil | `-1` (Inf. 4) / `-2` (Inf. 5) |

**Importante:** `schoolYear = 0` é curso técnico, `schoolYear < 0` é Educação Infantil. Os dois são sentinelas — nunca confundir com `undefined` (sem filtro) ou com anos reais (1–9).

Quem entra por link de convite de turma é direcionado para a trilha `basica` e o botão de troca de trilha é bloqueado (`simulados:trilha:bloqueada` no localStorage).

## Faixas visuais (Tier)

O `SimuladoRunner` adapta o visual ao público pelo `schoolYear` da simulação:

| Tier | Público | Visual |
|---|---|---|
| `ludico` | Infantil (< 0) + 1º–5º ano | Colorido, lúdico, sem cronômetro |
| `jovem` | 6º–9º ano | Interface mais limpa, com cronômetro |
| `exame` | EM + Técnico (`schoolYear = 0`) | Formato de prova, com cronômetro |

## Mapeamento de questões

A API retorna tipos em UPPERCASE (`MULTIPLE_CHOICE`). O `questionMapper.ts` converte para o formato interno em lowercase que os templates usam (`multiple_choice`). Toda questão da API passa por `mapApiQuestion()` antes de ser renderizada.

## Fluxo de execução de um simulado

1. `startAttempt(simulationId)` → cria tentativa no backend, retorna `attemptId`
2. `getAttemptQuestions(attemptId)` → questões sem gabarito
3. Para cada resposta: `submitAttemptAnswer(attemptId, questionId, answer)` (salva no servidor)
4. `finishAttempt(attemptId)` → backend corrige e retorna resultado completo
5. Exibe tela de resultado com `isCorrect`, `pointsEarned` e `funFact` por questão

Tentativas em andamento podem ser retomadas: `getAttemptQuestions` retorna as respostas já salvas em `question.answer`, e `parseStoredAnswer` as converte de volta para o formato do runner.

## Verificação antes de commitar

```bash
npx tsc --noEmit   # checagem de tipos
npm run lint       # eslint
npm run build      # build completo (pega erros que o tsc não pega)
```

Não há framework de teste. A verificação funcional é manual no browser.

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `BACKEND_API_URL` | URL da API (server-side only, sem `NEXT_PUBLIC_`) |

## Documentação adicional

- `PROGRESS.md` — **estado atual**: features concluídas, em andamento e próximas
- `docs/decisions/` — **ADRs**: decisões arquiteturais não óbvias
- `docs/superpowers/specs/` — specs de redesign e novas features
- `docs/superpowers/plans/` — planos de implementação
