# Meu Acompanhamento - Portal do Aluno

Portal exclusivo para alunos acompanharem sua evolução, dieta e progresso.

## 🚀 Tecnologias

- React + TypeScript
- Vite
- Supabase (mesmo banco do projeto admin)
- Tailwind CSS
- Radix UI
- PWA (Progressive Web App)

## 📦 Instalação

```bash
npm install
```

## 🛠️ Desenvolvimento

```bash
npm run dev
```

O app estará disponível em `http://localhost:5174`

## 🏗️ Build

```bash
npm run build
```

## 📱 PWA

Este app é instalável como PWA. Os alunos podem:
- Instalar no celular (Android/iOS)
- Acessar offline (com cache)
- Receber notificações (futuro)

## 🔐 Autenticação

- Login por telefone + OTP (Supabase Auth)
- Sessão persistente (localStorage)
- Vinculação automática paciente ↔ usuário

## 🗄️ Banco de Dados

Usa o **mesmo Supabase** do projeto admin:
- Mesmas tabelas
- RLS (Row Level Security) garante que aluno só vê seus dados
- Read-only para alunos

## 🚢 Deploy

### Vercel

1. Conectar repositório GitHub
2. Configurar:
   - **Root Directory**: `.` (raiz)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Framework**: Vite
3. Adicionar variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Domínio

Recomendado: `portal.grownutri.com` (subdomínio separado do admin)

## 📁 Estrutura

```
src/
├── components/
│   ├── ui/              # Componentes UI (Radix)
│   ├── patient-portal/  # Componentes do portal
│   └── evolution/       # Componentes de evolução
├── lib/                 # Services e utilitários
├── hooks/               # React hooks
├── contexts/            # Contextos React
├── pages/               # Páginas
└── integrations/        # Supabase
```

## 🔒 Segurança

- ✅ Isolamento total do admin (código separado)
- ✅ RLS no Supabase (aluno só vê seus dados)
- ✅ Autenticação obrigatória
- ✅ Sem rotas/admin no portal

## 📝 Notas

- Este projeto é **completamente separado** do projeto admin
- Não mexe em nada do projeto `controle-de-pacientes`
- Compartilha apenas o banco de dados (Supabase)
- Componentes foram copiados (não linkados)

