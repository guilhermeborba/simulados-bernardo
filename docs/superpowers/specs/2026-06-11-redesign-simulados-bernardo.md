# Redesign — Simulados Bernardo

**Data:** 2026-06-11  
**Status:** Aprovado — pronto para implementação

---

## Visão Geral

Substituir o visual atual (Tailwind utilitário genérico) pelo design system lúdico-profissional já definido em `globals.css`, e introduzir duas telas novas: **Hero** e **Seleção de Disciplina**. A lógica de negócio existente é preservada; apenas UI e arquitetura de telas mudam.

---

## Design System (já implementado em globals.css — não alterar)

- **Fontes:** Fredoka (títulos/botões) · Nunito (corpo)
- **Paleta:** variáveis CSS `--sky`, `--sun`, `--grass`, `--bubble`, `--lilac`, `--coral`, `--cream`, `--ink`, etc.
- **Raios:** `--radius-sm:14px` / `--radius-md:22px` / `--radius-lg:30px` / `--radius-xl:40px` / `--radius-pill:999px`
- **Sombras:** `--shadow-1` / `--shadow-2` / `--shadow-3`
- **Background:** gradientes radiais sobre `--cream`
- **Botões `.btn`:** gradiente vertical 3-paradas, pill por padrão, `translateY(-2px)` no hover, `translateY(1px)` no active, `inset 0 -3px 0` para efeito tátil

---

## Arquitetura de Telas

### Fluxo

```
/ (SelectionScreen)
  step 0: Hero
  step 1: Ano (botões)
  step 2: Bimestre (botões)  [só aparece após Ano válido]
  step 3: AV (botões)        [só aparece após Bimestre válido]
  step 4: Disciplina (cards) [só aparece após AV válida]
    → navega para /simulado-{disciplina}-{av}
```

**Princípio:** wizard linear, passo a passo, tudo dentro de `/`. Nenhuma rota nova criada. O botão "← Mudar seleção" retrocede um step.

---

## Tela 0 — Hero

**Componente:** `components/HeroStep.tsx` (novo)

### Layout (desktop)
- Duas colunas: texto à esquerda, mascote à direita
- Esquerda: eyebrow pill → título H1 → subtítulo → botão "✨ Começar agora" + link "Ver matérias →" → stats row (5 Disciplinas · 12+ Simulados · 100% Gratuito)
- Direita: mascote SVG inline + dois badges flutuantes animados

### Layout (mobile)
- Uma coluna centralizada: mascote (menor) → título → subtítulo → botão → stars row

### Mascote SVG
- Inline no componente, sem arquivo externo
- Corpo azul (`--sky`/`--sky-deep`), cabeça amarela (`--sun`/`--sun-deep`), livro rosa (`--bubble`/`--bubble-deep`), braços/pernas `--sky`
- Sombra elipse sob os pés

### Textos
- H1: "Aprender é uma aventura!" (palavra "aventura!" em `--sky-deep`)
- Subtítulo: "Simulados interativos com correção automática, dicas pedagógicas e acompanhamento de desempenho. Feito pra você arrasar nas provas! 🚀"
- Botão: "✨ Começar agora" (`.btn .btn--grass`)

---

## Tela 1–3 — Seleção (Ano / Bimestre / AV)

**Componente:** `components/SelectionStep.tsx` (novo, extraído de SelectionScreen)

### Estrutura
- Progress dots (4 pontos): lilac para "done", green para "active", `--line` para "pending"
- Título e subtítulo acima das opções
- Botão "← Voltar" no navbar retrocede um step

### Botões de seleção (`.sel-card`)
- Card branco, `border-radius: 22px`, `border: 2px solid var(--line)`
- Ícone emoji grande + label + sub-label
- Estado **selected**: `border-color: var(--grass)`, fundo verde suave
- Estado **disabled** (indisponível): `opacity: 0.45`, `cursor: not-allowed`, sub-label "Em breve"
- Transição hover: `translateY(-1px)` + `--shadow-2`

### Opções por step

**Ano** (grid 4 colunas):
| Valor | Emoji | Label | Disponível |
|-------|-------|-------|-----------|
| primeiro | 🌱 | 1º Ano | Não |
| segundo | 🌿 | 2º Ano | Não |
| terceiro | ⭐ | 3º Ano | Sim |
| quarto | 🚀 | 4º Ano | Não |

**Bimestre** (grid 4 colunas, só ativo após ano "terceiro"):
| Valor | Emoji | Label | Disponível |
|-------|-------|-------|-----------|
| 1 | ❄️ | 1º Bim | Parcial (só AV2) |
| 2 | 🌸 | 2º Bim | Sim (AV1 + AV2) |
| 3 | ☀️ | 3º Bim | Não |
| 4 | 🍂 | 4º Bim | Não |

**AV** (grid 2 colunas, só ativo após bimestre válido):
- Card mais largo com ícone 44px + nome + descrição
- Disponibilidade: Bim 1 → só AV2; Bim 2 → AV1 e AV2

### Comportamento
- Ao selecionar ano indisponível: card fica disabled, não avança
- Ao selecionar ano disponível: avança automaticamente para step de bimestre após 300ms
- Mesmo padrão para bimestre → AV
- Ao selecionar AV: avança para step de disciplina

---

## Tela 4 — Seleção de Disciplina

**Componente:** `components/DisciplineStep.tsx` (novo)

### Estrutura
- Pill de contexto: "📅 3º Ano · 🌸 2º Bimestre · ✅ AV2"
- Título: "Escolha uma disciplina"
- Sub: "N simulados disponíveis para essa seleção"
- Grid 3+2 (desktop) / 1 coluna (mobile)

### Cards de disciplina
- `border-radius: 24px`, fundo branco, `--shadow-2`
- Barra colorida no topo (5px, `border-radius` nas pontas superiores)
- Ícone 52×52px com fundo colorido suave, `border-radius: 16px`
- Nome + descrição curta
- Botão "Começar →" colorido (`.btn .btn--{cor}`) alinhado ao fim do card

### Cores por disciplina
| Disciplina | Barra/Botão | Ícone bg | Emoji |
|-----------|-------------|----------|-------|
| Português | `--bubble` | `#FFE0EE` | 📖 |
| Matemática | `--sky` | `#E0EEFF` | 🔢 |
| Ciências | `--grass` | `#E0FFF0` | 🔬 |
| História | `--sun` | `#FFF8D6` | 🏛️ |
| Geografia | `--lilac` | `#EEE8FF` | 🌎 |

### Mapeamento de rotas (disciplina + AV → rota)
```
portugues + AV1 → /simulado-portugues-av1
portugues + AV2 → /simulado-portugues-av2
matematica + AV1 → /simulado-matematica-av1
matematica + AV2 → /simulado-matematica-av2
ciencias + AV1 → /simulado-ciencias-av1
ciencias + AV2 → /simulado-ciencias-av2
historia + AV1 → /simulado-historia-av1
historia + AV2 → /simulado-historia-av2
geografia + AV1 → /simulado-geografia-av1
geografia + AV2 → /simulado-geografia-av2
```
Disciplinas sem rota para a combinação selecionada não aparecem no grid.

---

## Tela 5 — Quiz (SimuladoTemplate)

**Componente:** `components/SimuladoTemplate.tsx` (refatorar visual)

### Tela de nome (intro)
- Card branco centralizado, `border-radius: 30px`, `--shadow-3`
- H2 + subtítulo + input `.input-field` + botão `.btn .btn--grass`
- Sem mudança de lógica

### Navbar durante quiz
- Logo à esquerda + badge colorido (cor da disciplina) à direita
- Progress bar fina + contador "N / total"

### Sidebar (desktop)
- Card branco com dots de questões: verde = respondida, azul = atual, cinza = pendente
- Nome do aluno abaixo dos dots

### Cards de questão
- Fundo branco, `border-radius: 30px`, `--shadow-2`
- Pill "Questão N" colorido no topo esquerdo + pontos no topo direito
- Texto da questão em Nunito 700
- Alternativas como botões full-width com letra em círculo

### Estados das alternativas
- Default: `border: 2px solid var(--line)`, branco
- Selecionada: `border-color: var(--sky-deep)`, fundo azul suave
- Correta (pós-finalizar): `border-color: var(--grass-deep)`, fundo verde suave
- Errada (pós-finalizar): `border-color: var(--bubble-deep)`, fundo rosa suave

### Botão finalizar
- `.btn .btn--grass .btn--lg` full-width
- Disabled (não respondeu tudo): `.btn--ghost` + `cursor: not-allowed`

---

## Tela 6 — Resultado

**Componente:** `components/SimuladoTemplate.tsx` (estado `isFinalized`)

### Layout
- Duas colunas: análise à esquerda, ações à direita

### Hero do resultado
- Card branco com `--shadow-3`
- Anel SVG de progresso circular (conic-gradient verde/cinza)
- Score "N de total" no centro do anel
- Mensagem motivacional personalizada com nome do aluno
- Stars (1–3 conforme % de acerto) + badge "X% de aproveitamento"

### Análise por questão
- Card branco, lista de linhas: ícone ✅/❌ + nome da questão + pontos
- Cada linha incorreta mostra a dica pedagógica inline (card amarelo `--sun`)

### Ações (sidebar)
- "🔄 Refazer simulado" → `.btn--sky`
- "📚 Outra disciplina" → `.btn--lilac` → volta para step 4 (SelectionScreen)
- "🏠 Voltar ao início" → `.btn--ghost` → volta para step 0

---

## Componente SelectionScreen (refatorado)

O `SelectionScreen.tsx` passa a ser um **orquestrador de steps**:

```tsx
type Step = 'hero' | 'ano' | 'bimestre' | 'av' | 'disciplina';

const [step, setStep] = useState<Step>('hero');
const [selectedYear, setSelectedYear] = useState<Year>('');
const [selectedBimestre, setSelectedBimestre] = useState<Bimestre>('');
const [selectedAssessment, setSelectedAssessment] = useState<Assessment>('');

// Renderiza o sub-componente correspondente ao step atual
```

Sub-componentes recebem estado atual + callbacks de avanço/retrocesso.

---

## Itens fora de escopo

- Nenhuma mudança nos arquivos de dados das questões (`/data/**`)
- Nenhuma mudança nas rotas de simulado individuais (`/simulado-**/page.tsx`)
- Nenhuma adição de backend, banco de dados ou autenticação
- Nenhum sistema de pontuação persistente entre sessões
