# 🔐 AUTENTICAÇÃO COM SUPABASE - n.Oficios

## 📋 VISÃO GERAL

O **n.Oficios** usa **Supabase** para autenticação e banco de dados. Não há dependências do Firebase.

### ✅ O que está configurado:
- ✅ Autenticação com Google OAuth via Supabase
- ✅ Banco de dados PostgreSQL no Supabase
- ✅ Row Level Security (RLS) para isolamento de dados por usuário
- ✅ Hooks React para gerenciamento de sessão

---

## 🏗️ ARQUITETURA

```
Frontend (Next.js 15)
    ↓
useAuthSupabase Hook
    ↓
Supabase Client
    ↓ OAuth Google
Supabase Auth Service
    ↓
PostgreSQL + RLS
```

---

## 📁 ARQUIVOS PRINCIPAIS

### 1. **Configuração do Cliente**
`src/lib/supabase.ts`
- Inicializa o cliente Supabase
- Exporta tipos e serviços
- Gerencia conexão com o banco

### 2. **Hook de Autenticação**
`src/hooks/useAuthSupabase.tsx`
- Gerencia estado do usuário
- Funções de login/logout
- Context Provider para toda aplicação

### 3. **Página de Login**
`src/app/login/page.tsx`
- Interface de autenticação
- Botão "Continuar com Google"
- Redirecionamento automático

### 4. **Layout Raiz**
`src/app/layout.tsx`
- Envolve app com `AuthProvider`
- Disponibiliza contexto de auth globalmente

---

## 🔑 VARIÁVEIS DE AMBIENTE

Arquivo: `.env.local` (desenvolvimento) ou `.env.production` (VPS)

```env
NEXT_PUBLIC_SUPABASE_URL=https://ghcqywthubgfenqqxoqb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE:**
- Estas variáveis já estão configuradas no projeto
- A chave `ANON_KEY` é segura para uso no frontend
- Não exponha a `SERVICE_ROLE_KEY` no frontend

---

## 🔒 SEGURANÇA

### Row Level Security (RLS)
Todas as queries no Supabase passam por políticas RLS:

```sql
-- Usuários só podem ver seus próprios ofícios
CREATE POLICY "Users can view own oficios"
ON oficios FOR SELECT
USING (auth.jwt()->>'email' = userId);

-- Usuários só podem criar com seu próprio ID
CREATE POLICY "Users can create own oficios"
ON oficios FOR INSERT
WITH CHECK (auth.jwt()->>'email' = userId);
```

### Proteção de Rotas
O hook `useAuth` garante:
- ✅ Redirecionamento automático se não autenticado
- ✅ Acesso ao `user.email` para queries
- ✅ Session management automático

---

## 🚀 FLUXO DE AUTENTICAÇÃO

### Login com Google:

1. **Usuário clica "Continuar com Google"**
   ```typescript
   await signInWithGoogle();
   ```

2. **Supabase redireciona para OAuth Google**
   ```typescript
   supabase.auth.signInWithOAuth({
     provider: 'google',
     options: { redirectTo: `${origin}/dashboard` }
   })
   ```

3. **Google autentica e retorna ao Supabase**
   - Google valida credenciais
   - Retorna token OAuth

4. **Supabase cria/atualiza usuário**
   - Cria registro na tabela `auth.users`
   - Gera JWT com `email` no payload

5. **Redirect para Dashboard**
   - `useAuth` detecta sessão
   - Usuário é redirecionado para `/dashboard`

---

## 🛠️ CONFIGURAÇÃO INICIAL (Para novo ambiente)

### 1. Configurar Google OAuth no Supabase

Acesse: [Supabase Dashboard](https://supabase.com/dashboard/project/ghcqywthubgfenqqxoqb/auth/providers)

1. Vá em **Authentication → Providers**
2. Habilite **Google**
3. Configure:
   - **Client ID**: (do Google Cloud Console)
   - **Client Secret**: (do Google Cloud Console)
4. Adicione **Redirect URLs** autorizadas:
   ```
   https://ghcqywthubgfenqqxoqb.supabase.co/auth/v1/callback
   ```

### 2. Configurar Google Cloud Console

Acesse: [Google Cloud Console](https://console.cloud.google.com/)

1. Crie/selecione projeto
2. Vá em **APIs & Services → Credentials**
3. Crie **OAuth 2.0 Client ID**
4. Configure:
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://seu-dominio.com
     ```
   - **Authorized redirect URIs**:
     ```
     https://ghcqywthubgfenqqxoqb.supabase.co/auth/v1/callback
     ```

### 3. Configurar Supabase Site URL

No Dashboard do Supabase:
1. Vá em **Authentication → URL Configuration**
2. Configure:
   - **Site URL**: `https://seu-dominio.com`
   - **Redirect URLs**: `https://seu-dominio.com/dashboard`

---

## 🔍 DEBUGGING

### Verificar Sessão Atual:
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log(session?.user?.email);
```

### Logs de Autenticação:
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  console.log('Session:', session);
});
```

### Testar RLS no SQL Editor:
```sql
-- Simular usuário autenticado
SET request.jwt.claims = '{"email":"resper@ness.com.br"}';

-- Testar query
SELECT * FROM oficios;
```

---

## ❌ ERROS COMUNS

### "Invalid login credentials"
- ✅ Verifique se Google OAuth está habilitado no Supabase
- ✅ Confirme Client ID/Secret corretos

### "URL not allowed"
- ✅ Adicione domínio em **Redirect URLs** no Supabase
- ✅ Adicione redirect URI no Google Console

### "Row Level Security error"
- ✅ Verifique se políticas RLS estão criadas
- ✅ Confirme que `userId` está sendo passado corretamente

---

## 📊 MONITORAMENTO

### Supabase Dashboard
- **Auth Logs**: Ver tentativas de login
- **Database Logs**: Queries e erros
- **API Logs**: Requests e latência

### Métricas:
- Usuários ativos
- Sessões abertas
- Queries por segundo

---

## 🚀 DEPLOY

### Arquivo usado: `deploy-vps-complete.sh`

O script automaticamente:
1. ✅ Configura variáveis de ambiente do Supabase
2. ✅ Remove referências ao Firebase
3. ✅ Builda aplicação Next.js
4. ✅ Deploy na VPS via SSH

### Comando:
```bash
./deploy-vps-complete.sh
```

---

## 📝 NOTAS IMPORTANTES

1. **Não há Firebase no projeto** - Toda autenticação é Supabase
2. **OAuth Google gerenciado pelo Supabase** - Não precisa SDK Google
3. **RLS é obrigatório** - Sem ele, dados ficam expostos
4. **Email é usado como userId** - Chave para isolamento de dados

---

## 📚 REFERÊNCIAS

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**✅ Sistema de autenticação 100% funcional com Supabase!** 🎉

