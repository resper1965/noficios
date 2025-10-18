# 🏗️ n.Oficios - Como Funciona

## 📋 VISÃO GERAL

**n.Oficios** é uma aplicação Next.js para gestão de ofícios jurídicos com autenticação Firebase Google OAuth.

---

## 🔄 FLUXO DA APLICAÇÃO

### **1. Página Inicial (`/`)**
```
src/app/page.tsx
```

**Função:** Redireciona automaticamente para `/login`

**Comportamento:**
- Usuário acessa `http://localhost:3000`
- Sistema redireciona para `http://localhost:3000/login`

---

### **2. Página de Login (`/login`)**
```
src/app/login/page.tsx
```

**Função:** Autenticação com Google OAuth

**Comportamento:**
1. Verifica se usuário já está logado
2. Se SIM → Redireciona para `/dashboard`
3. Se NÃO → Mostra botão "Continuar com Google"

**Componentes:**
- Botão de login Google
- Loading state enquanto verifica autenticação
- Design moderno em gradiente azul/índigo

---

### **3. Dashboard (`/dashboard`)**
```
src/app/dashboard/page.tsx
```

**Função:** Painel principal da aplicação

**Funcionalidades Atuais:**
- ✅ Mostra informações do usuário logado (nome, email)
- ✅ Exibe cards com estatísticas:
  - Ofícios Ativos (24)
  - Em Risco (3)
  - Vencidos (1)
  - Respondidos (156)
- ✅ Lista de ofícios recentes (dados mock)
- ✅ Botão de logout

**Comportamento:**
1. Verifica se usuário está autenticado
2. Se NÃO → Redireciona para `/login`
3. Se SIM → Exibe dashboard

---

## 🔐 AUTENTICAÇÃO (Firebase)

### **Configuração Firebase**
```
src/lib/firebase.ts
```

**Credenciais:**
- API Key: `AIzaSyCrE-O9tnox14nsbtkWpbbnCs42_3ewo9M`
- Auth Domain: `officio-474711.firebaseapp.com`
- Project ID: `officio-474711`

**Funções:**
- `getFirebaseApp()`: Inicializa Firebase (apenas no cliente)
- `getFirebaseAuth()`: Retorna instância do Firebase Auth
- `googleProvider`: Provider do Google OAuth

---

### **Hook de Autenticação**
```
src/hooks/useAuth.tsx
```

**Contexto Global:** `AuthContext`

**Estado Gerenciado:**
- `user`: Dados do usuário logado (ou null)
- `loading`: Estado de carregamento

**Funções:**
- `signInWithGoogle()`: Abre popup Google e faz login
- `signOutUser()`: Faz logout e redireciona para `/login`

**Uso:**
```typescript
const { user, loading, signInWithGoogle, signOutUser } = useAuth();
```

---

## 🎨 DESIGN SYSTEM

### **Tema:**
- **Dark-first**: Fundo escuro (#0B0C0E, #111317)
- **Cores principais:**
  - Azul: `#3b82f6` (botões, destaques)
  - Gradientes: `blue-900 → blue-800 → indigo-900`
  - Texto: `#EEF1F6` (claro), `#9CA3AF` (secundário)

### **Tipografia:**
- Font: Inter (Next.js default)
- Títulos: Bold, gradiente azul/ciano
- Body: Regular, cinza claro

### **Componentes:**
- Cards: Background `#1f2937`, borda `#374151`
- Botões: Blue `#3b82f6`, hover `#2563eb`
- Loading: Spinner azul com animação

---

## 📁 ESTRUTURA DE ARQUIVOS

```
oficios-portal-frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout raiz (AuthProvider)
│   │   ├── page.tsx            # Redirect → /login
│   │   ├── login/
│   │   │   └── page.tsx        # Página de login
│   │   └── dashboard/
│   │       └── page.tsx        # Dashboard principal
│   ├── hooks/
│   │   └── useAuth.tsx         # Hook de autenticação
│   └── lib/
│       └── firebase.ts         # Configuração Firebase
├── public/
│   └── favicon.ico             # Ícone do site
├── package.json                # Dependências
├── tailwind.config.ts          # Config Tailwind
├── next.config.ts              # Config Next.js
└── tsconfig.json               # Config TypeScript
```

---

## 🔄 FLUXO DE DADOS

### **1. Inicialização:**
```
App Load
  ↓
AuthProvider (useAuth)
  ↓
Firebase Auth State Listener
  ↓
user state atualizado
```

### **2. Login:**
```
Botão "Continuar com Google"
  ↓
signInWithGoogle()
  ↓
signInWithPopup(auth, googleProvider)
  ↓
Firebase retorna user
  ↓
useAuth atualiza state
  ↓
useEffect detecta user
  ↓
router.push('/dashboard')
```

### **3. Logout:**
```
Botão "Sair"
  ↓
signOutUser()
  ↓
signOut(auth)
  ↓
useAuth atualiza user → null
  ↓
router.push('/login')
```

### **4. Proteção de Rotas:**
```
useEffect no dashboard
  ↓
Verifica: !loading && !user
  ↓
Se TRUE → router.push('/login')
```

---

## 🚀 TECNOLOGIAS

### **Framework:**
- **Next.js 15.5.6** (App Router)
- **React 18**
- **TypeScript**

### **Autenticação:**
- **Firebase 10.7.1**
- **Firebase Auth** (Google OAuth)

### **Styling:**
- **Tailwind CSS 3.3.0**
- **PostCSS + Autoprefixer**

### **Desenvolvimento:**
- **npm** (gerenciador de pacotes)
- **ESLint** (linting)

---

## 📊 DADOS ATUAIS (Mock)

### **Dashboard Stats:**
```typescript
{
  ofíciosAtivos: 24,
  emRisco: 3,      // prazo < 24h
  vencidos: 1,
  respondidos: 156  // este mês
}
```

### **Ofícios Recentes:**
```typescript
[
  { id: 12345, processo: "1234567-89.2024.1.00.0000", prazo: "2 dias" },
  { id: 12344, processo: "1234566-88.2024.1.00.0000", prazo: "5 dias" },
  { id: 12343, processo: "1234565-87.2024.1.00.0000", prazo: "Vencido há 1 dia" }
]
```

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

✅ **Autenticação:**
- Login com Google OAuth
- Proteção de rotas
- Persistência de sessão
- Logout

✅ **Interface:**
- Página de login moderna
- Dashboard com estatísticas
- Design responsivo
- Dark theme

✅ **Navegação:**
- Redirect automático (`/` → `/login`)
- Redirect pós-login (`/login` → `/dashboard`)
- Redirect pós-logout (`/dashboard` → `/login`)

---

## ⏳ PRÓXIMAS FUNCIONALIDADES (TODO)

### **Sistema de Ofícios (Fase 2):**
- [ ] CRUD de ofícios
- [ ] Upload de documentos
- [ ] Gestão de prazos
- [ ] Notificações
- [ ] Histórico de ações

### **Backend (Fase 3):**
- [ ] API REST (Python/FastAPI)
- [ ] Banco de dados (PostgreSQL/Neon)
- [ ] Armazenamento de arquivos
- [ ] Sistema de notificações

### **Deploy (Fase 4):**
- [ ] Deploy em VPS Ubuntu
- [ ] Configuração de domínio
- [ ] SSL/HTTPS
- [ ] Docker containerization

---

## 🔧 COMANDOS ÚTEIS

### **Desenvolvimento:**
```bash
npm run dev          # Inicia servidor dev (localhost:3000)
npm run build        # Build de produção
npm run start        # Inicia servidor produção
npm run lint         # Executa linter
```

### **Firebase:**
```bash
# Configuração já feita:
- API Key sem restrições ✅
- localhost nos Authorized Domains ✅
- OAuth Client configurado ✅
```

---

## 🐛 TROUBLESHOOTING

### **Erro 403 Firebase:**
- **Causa:** `localhost` não nos Authorized Domains
- **Solução:** Adicionar no Firebase Console

### **Aplicação não carrega:**
- **Causa:** Processo `npm run dev` não rodando
- **Solução:** `pkill -f "next dev" && npm run dev`

### **Login não funciona:**
- **Causa:** Cache do navegador
- **Solução:** Ctrl+Shift+Delete → Limpar cache

---

## 📈 MÉTRICAS ATUAIS

- **Páginas:** 3 (`/`, `/login`, `/dashboard`)
- **Componentes:** 3 (Login, Dashboard, AuthProvider)
- **Hooks:** 1 (`useAuth`)
- **Libs:** 2 (Firebase, Tailwind)
- **Linhas de código:** ~500
- **Bundle size:** ~150KB (estimado)

---

## 🎯 PRÓXIMOS PASSOS

1. **Implementar CRUD de Ofícios**
2. **Adicionar backend API**
3. **Deploy em VPS**
4. **Configurar domínio + SSL**

---

**Aplicação totalmente funcional e pronta para evolução!** ✅
