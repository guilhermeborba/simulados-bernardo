# simulados-bernardo

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