# Giz

A interface web usa o Design System do pacote `giz-handoff`, e o aplicativo nativo Expo fica em `mobile/`. Consulte o [registro de implementação Giz](docs/giz/IMPLEMENTACAO.md) para rotas, contratos de API, decisões de integração, testes e itens ainda pendentes.

## Integração com a API

Este projeto frontend está integrado com a API backend. Antes de executar o projeto em desenvolvimento, certifique-se de que o backend está rodando.

### Configuração da Variável de Ambiente

A variável `BACKEND_API_URL` especifica a URL da API backend:

```env
BACKEND_API_URL=http://localhost:3333
```

Configure esta variável no arquivo `.env.local` (copie de `.env.local.example` se necessário).

### Iniciando o Projeto

1. Inicie o backend em `http://localhost:3333`:
   - No diretório `simulados-bernardo-api`, execute:
     ```bash
     docker compose up -d
     npm run prisma:migrate
     npm run seed
     npm run start:dev
     ```

2. Inicie o frontend em `http://localhost:3000`:
   ```bash
   npm run dev
   ```

### Fonte dos Dados

Todas as questões e conteúdo do simulado agora são carregados da API backend. Os dados **não** mais vêm do diretório `data/` — todo o conteúdo é obtido através dos endpoints da API via `/api/backend/*`.

## Desenvolvimento do Giz

```bash
npm run tokens:generate
npm run typecheck
npm run lint
npm test
npm run build
```

Os tokens web e nativos partem de `giz-handoff/tokens/tokens.json`. Para o Expo, configure as origens públicas a partir de `mobile/.env.example`, instale suas dependências com `npm --prefix mobile ci` e execute `npm run mobile:start`. O [registro de implementação](docs/giz/IMPLEMENTACAO.md) descreve o setup e diferencia implementação local, validação nativa e publicação.

A página de divulgação está em `/sobre`, com acesso ao catálogo em `/simulados`. A implementação local não inclui publicação em domínio ou lojas.

O feedback por confirmação exige a API compatível com a migration `20261017120000_simulation_immediate_feedback`. A ordem de instalação é migration, API e clientes web/Expo; tentativas iniciadas no modo anterior preservam a correção ao concluir. Consulte o [registro de implementação](docs/giz/IMPLEMENTACAO.md#contratos-e-limites-da-api).
