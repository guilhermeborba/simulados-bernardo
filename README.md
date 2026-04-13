# 📚 Simulados Bernardo

Aplicação interativa de simulados escolares para Ensino Fundamental com gamificação e dicas pedagógicas.

## 🚀 Como Rodar a Aplicação

### Pré-requisitos
- Node.js instalado (versão 18+)
- npm ou yarn

### Passo 1: Instalar Dependências
```bash
npm install
# ou
yarn install
```

### Passo 2: Rodar em Desenvolvimento
```bash
npm run dev
# ou
yarn dev
```

A aplicação estará disponível em: **http://localhost:3000**

### Passo 3: Acessar o Simulado
Acesse a URL: **http://localhost:3000/simulado-portugues**

## 📦 Build para Produção

```bash
npm run build
npm start
```

## 📁 Estrutura do Projeto

```
simulados-bernardo/
├── app/
│   ├── layout.tsx          # Layout raiz
│   ├── globals.css         # Estilos globais
│   └── simulado-portugues/
│       └── page.tsx        # Página do simulado
├── components/
│   └── SimuladoPortugues.tsx  # Componente principal
├── package.json            # Dependências
├── tsconfig.json          # Configuração TypeScript
├── tailwind.config.js     # Configuração Tailwind CSS
├── postcss.config.js      # Configuração PostCSS
└── next.config.js         # Configuração Next.js
```

## 🎮 Funcionalidades

✅ Sistema interativo com 10 questões de Português  
✅ 4 tipos de questões (múltipla escolha, V/F, matching, classificação)  
✅ Feedback visual com cores (verde/vermelho)  
✅ Dicas pedagógicas personalizadas  
✅ Gamificação com pontuação  
✅ Mensagens motivacionais  
✅ Design responsivo com Tailwind CSS  

## 🛠️ Stack Técnica

- **Framework**: Next.js 14
- **Estilização**: Tailwind CSS 3
- **Linguagem**: TypeScript
- **React**: 18.2

## 📝 Licença

Projeto educativo - Simulados Bernardo
