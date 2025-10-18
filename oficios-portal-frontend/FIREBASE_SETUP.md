# 🔥 Configuração Firebase - Autenticação Cross-Platform

## 📋 **O QUE FOI IMPLEMENTADO**

### **1. Firebase Auth Client** ✅
**Arquivo:** `src/lib/firebase-auth.ts`

**Funcionalidades:**
- Inicialização Firebase App (lazy)
- Obter ID Token para backend Python
- Sign in com custom token
- Sincronização Supabase → Firebase

---

### **2. API Route de Sincronização** ✅
**Arquivo:** `src/app/api/auth/sync-firebase/route.ts`

**Funcionalidade:**
- Recebe token Supabase
- Valida usuário
- Gera custom token Firebase (quando configurado)

---

### **3. Integração com Python Backend** ✅
**Arquivo:** `src/lib/python-backend.ts` (atualizado)

**Mudança:**
- `getFirebaseToken()` agora usa Firebase Auth real
- Fallback para mock se Firebase não disponível

---

## 🚀 **PRÓXIMOS PASSOS**

### **PASSO 1: Adicionar Variáveis de Ambiente**

Edite `.env.local`:

```bash
# Supabase (já existente)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Firebase (ADICIONAR)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=oficio-noficios.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=oficio-noficios
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=oficio-noficios.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin SDK (server-side)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
```

**Onde obter:**
1. Ir ao [Firebase Console](https://console.firebase.google.com/project/oficio-noficios/settings/general)
2. Copiar configuração do "Web App"

---

### **PASSO 2: Instalar Dependências**

```bash
cd oficios-portal-frontend

# Firebase Client
npm install firebase

# Firebase Admin SDK (server-side)
npm install firebase-admin
```

---

### **PASSO 3: Configurar Firebase Admin SDK**

**Arquivo:** `src/lib/firebase-admin.ts` (CRIAR)

```typescript
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

export function getFirebaseAdmin() {
  if (!adminApp && getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS!),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } else if (!adminApp) {
    adminApp = getApps()[0];
  }
  return adminApp;
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdmin());
}
```

---

### **PASSO 4: Atualizar API Route**

**Arquivo:** `src/app/api/auth/sync-firebase/route.ts`

Descomentar e implementar geração de custom token:

```typescript
import { getFirebaseAdminAuth } from '@/lib/firebase-admin';

// Dentro do POST handler:
const customToken = await getFirebaseAdminAuth().createCustomToken(user.id, {
  email: user.email,
  supabase_id: user.id,
});

return NextResponse.json({
  firebaseCustomToken: customToken,
  userId: user.id,
  email: user.email,
});
```

---

### **PASSO 5: Integrar no Hook useAuth**

**Arquivo:** `src/hooks/useAuthSupabase.tsx`

Adicionar sincronização Firebase após login Supabase:

```typescript
import { syncSupabaseToFirebase } from '@/lib/firebase-auth';

const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    // ...
  });

  if (!error) {
    // Após login Supabase bem-sucedido, sincronizar com Firebase
    const session = (await supabase.auth.getSession()).data.session;
    if (session) {
      await syncSupabaseToFirebase(session.access_token);
    }
  }
};
```

---

### **PASSO 6: Testar Autenticação Dupla**

```bash
# 1. Rodar frontend
npm run dev

# 2. Fazer login via Supabase (Google OAuth)
# Abrir: http://localhost:3000/login

# 3. Verificar no console:
# ✅ Supabase auth: user_xyz
# ✅ Firebase auth sincronizado: user_xyz

# 4. Testar chamada ao backend Python:
curl -X POST http://localhost:3000/api/webhook/oficios \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "org_001",
    "oficio_id": "test_123",
    "action": "approve_compliance"
  }'

# Deve usar Firebase token real (não mock)
```

---

## 🔐 **FLUXO DE AUTENTICAÇÃO**

### **Login Flow:**
```
1. Usuário clica "Login com Google"
   ↓
2. Supabase OAuth → Usuário autenticado no Supabase
   ↓
3. Frontend chama POST /api/auth/sync-firebase
   com token Supabase
   ↓
4. Backend valida token Supabase
   ↓
5. Firebase Admin gera custom token
   ↓
6. Frontend autentica no Firebase com custom token
   ↓
7. Usuário agora tem 2 tokens:
   - Supabase token (para DB/Storage)
   - Firebase token (para backend Python/GCP)
```

### **Chamada ao Backend Python:**
```
1. Frontend precisa chamar backend Python
   ↓
2. getFirebaseToken() → Obtém ID token atual
   ↓
3. Inclui em Authorization: Bearer <firebase-token>
   ↓
4. Backend Python valida com Firebase Admin
   ↓
5. Executa ação (W3 webhook-update)
```

---

## ⚠️  **IMPORTANTE**

### **Service Account Key**
1. Ir ao [Firebase Console → Service Accounts](https://console.firebase.google.com/project/oficio-noficios/settings/serviceaccounts/adminsdk)
2. Clicar "Generate new private key"
3. Baixar JSON
4. Salvar em local seguro (NÃO commitar no git!)
5. Apontar `GOOGLE_APPLICATION_CREDENTIALS` para o arquivo

**NO SERVIDOR (VPS):**
```bash
# Copiar service account key
scp serviceAccountKey.json root@62.72.8.164:/opt/oficios/

# SSH na VPS
ssh root@62.72.8.164

# Adicionar ao .env
echo "GOOGLE_APPLICATION_CREDENTIALS=/opt/oficios/serviceAccountKey.json" >> /opt/oficios/.env

# Restart
cd /opt/oficios
docker-compose restart
```

---

## ✅ **CHECKLIST DE CONCLUSÃO**

- [ ] Variáveis Firebase adicionadas ao `.env.local`
- [ ] `npm install firebase firebase-admin`
- [ ] Service Account Key baixado e configurado
- [ ] Firebase Admin SDK implementado
- [ ] API Route `/api/auth/sync-firebase` atualizada
- [ ] Hook `useAuth` integrado com Firebase
- [ ] Testado login → Sync Firebase → Chamada backend
- [ ] Deploy na VPS com variáveis corretas

---

## 🎯 **RESULTADO ESPERADO**

Após configuração completa:
- ✅ Login via Supabase (Google OAuth ou Email)
- ✅ Sincronização automática com Firebase
- ✅ Backend Python recebe tokens válidos
- ✅ Portal HITL pode chamar W3 webhook-update
- ✅ Aprovação de ofícios funcional

---

**Tempo estimado:** 2-4 horas  
**Complexidade:** Média  
**Prioridade:** 🔴 CRÍTICA

---

**Próximo passo:** Instalar dependências e configurar variáveis de ambiente

