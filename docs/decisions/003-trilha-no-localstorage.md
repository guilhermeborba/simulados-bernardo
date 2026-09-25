# ADR 003 — Trilha de estudo salva no localStorage, não no servidor

**Data:** 2026-09-25
**Status:** vigente

## Contexto

O app tem três trilhas de estudo: `basica` (Ensino Fundamental), `tecnico` (Cursos Técnicos) e `infantil` (Educação Infantil). Ao voltar ao app, o aluno não deveria ter que escolher de novo toda vez. A pergunta era: salvar essa preferência no servidor (no perfil do usuário) ou no cliente?

## Decisão

Salvar no `localStorage` do navegador, via `lib/trilha.ts`.

```ts
const STORAGE_KEY = 'simulados:trilha';
export function lerTrilhaSalva(): Trilha | null { ... }
export function salvarTrilha(trilha: Trilha) { ... }
```

## Por que não no servidor

- A trilha não é um dado crítico — se o aluno perder (modo privativo, troca de dispositivo), ele clica uma vez e recomeça.
- Salvar no servidor exigiria um PATCH no perfil do usuário, que exige autenticação — usuários anônimos (que existem no app) não têm perfil para salvar.
- Reduz uma roundtrip a cada abertura do app.

## Caso especial: convite de turma

Quem entra por link de convite vai direto para a trilha `basica` e o botão de troca é bloqueado:

```ts
export function bloquearTrocaDeTrilha() {
  localStorage.setItem('simulados:trilha:bloqueada', '1');
}
```

A razão: alunos de turma fechada são do Ensino Fundamental — permitir que naveguem para o curso técnico causaria confusão e quebraria a experiência de convite.

## Consequência

A trilha pode estar `null` na primeira renderização (antes do `localStorage` ser lido). `SelectionScreen` inicializa o step como `null` e só define o step correto no `useEffect` — nunca tomar decisões de navegação antes disso para evitar flash de tela errada.
