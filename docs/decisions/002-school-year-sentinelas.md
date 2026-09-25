# ADR 002 — schoolYear com sentinelas negativos para Educação Infantil

**Data:** 2026-09-25
**Status:** vigente

## Contexto

O backend usa `schoolYear` (inteiro) para identificar a qual ano escolar pertence um simulado. O Ensino Fundamental usa valores 1–9. Era preciso representar duas categorias que não têm "ano" no sentido convencional: Curso Técnico e Educação Infantil.

## Decisão

Adotamos sentinelas inteiros especiais, definidos em `lib/trilha.ts` e espelhados no backend (`prisma/seed.ts` e `FindAvailableSimulationsDto`):

| Valor | Significado |
|---|---|
| `0` | Curso Técnico (sem ano escolar) |
| `-1` | Educação Infantil — 4 anos |
| `-2` | Educação Infantil — 5 anos |
| `1–9` | Ensino Fundamental (anos reais) |

```ts
export const TECNICO_SCHOOL_YEAR = 0;
export const INFANTIL_4_SCHOOL_YEAR = -1;
export const INFANTIL_5_SCHOOL_YEAR = -2;
```

## Por que não enums ou campos separados

- Adicionar campos ao modelo `Simulation` (ex: `educationType`) exigiria migration e mudanças no seed/CRUD — custo alto.
- Enums no Prisma não são extensíveis sem migration.
- Sentinelas inteiros funcionam nos filtros existentes de `GET /simulations/available` sem alterar a interface da API.
- Os dois repositórios precisam concordar com os mesmos valores — qualquer mudança deve ser feita nos dois ao mesmo tempo.

## Armadilhas

- `schoolYear === 0` não é "sem filtro" — é curso técnico. "Sem filtro" é `undefined`.
- `schoolYear < 0` é Educação Infantil — `isEducacaoInfantil()` testa isso.
- O tier visual `exame` inclui `schoolYear === 0` (técnico), mas **não** `schoolYear < 0` (infantil usa `ludico`).

## Consequência

Qualquer código que filtre por `schoolYear` deve tratar esses sentinelas explicitamente. O `tierForSchoolYear()` em `lib/tier.ts` é a referência de como fazer isso corretamente.
