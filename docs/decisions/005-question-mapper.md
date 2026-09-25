# ADR 005 — questionMapper como camada de tradução API → template

**Data:** 2026-09-25
**Status:** vigente

## Contexto

A API retorna questões com tipos em UPPERCASE (`MULTIPLE_CHOICE`, `TRUE_FALSE_MULTIPLE`, `MATCHING`, `CLASSIFICATION`) e uma estrutura genérica de `options[]` para todos os tipos. Os templates de renderização foram construídos para um formato diferente: tipos em lowercase e estruturas específicas por tipo (`options[]`, `items[]`, `pairs[]`).

## Decisão

Criamos `lib/questionMapper.ts` como camada de tradução explícita. Toda questão da API passa por `mapApiQuestion()` antes de ser usada nos templates:

```ts
export function mapApiQuestion(question: ApiQuestion): TemplateQuestion
```

A função:
- Converte `MULTIPLE_CHOICE` → `multiple_choice` (e demais tipos)
- Para `MULTIPLE_CHOICE`: extrai `options[]` (id, text)
- Para `TRUE_FALSE_MULTIPLE` e `CLASSIFICATION`: extrai `items[]`
- Para `MATCHING`: lê `groupKey` das options (`'left'` / `'right'`) e monta `pairs[]`

## Por que uma camada separada e não converter nos templates

- Centraliza a lógica de mapeamento: se o backend mudar o formato, há um único ponto de atualização.
- Permite testar a tradução de forma isolada (quando houver testes).
- Os templates permanecem agnósticos ao formato da API — renderizam `TemplateQuestion`, não `ApiQuestion`.

## parseStoredAnswer e buildAnswerBody

O mesmo arquivo tem duas funções complementares para o ciclo de vida de uma resposta:

- `buildAnswerBody(type, rawAnswer)` — converte a resposta do runner para o formato que o backend espera no `POST .../answer`
- `parseStoredAnswer(type, stored)` — caminho inverso: converte o que o backend gravou de volta para o formato do runner (para retomar uma tentativa em andamento)

Juntas, elas garantem que o runner possa retomar qualquer tentativa corretamente.
