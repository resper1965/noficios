# 🎨 Frontend - Portal de Ofícios (Next.js)

**Versão:** 1.0.0  
**Stack:** Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui  
**Design System:** ness. (Montserrat + #00ade8)

---

## ✅ O Que Foi Implementado

### Fundação (Camada 1)

- ✅ **lib/utils.ts**: Utilitários (cn para classes)
- ✅ **lib/firebase.ts**: Configuração Firebase Auth
- ✅ **lib/api.ts**: Cliente HTTP seguro com JWT
  - Classe `ApiClient` completa
  - Injeção automática de Bearer Token
  - Tratamento de erros 401/403
  - Suporte a upload de arquivos
  - Tipos TypeScript para API

- ✅ **hooks/useAuth.tsx**: Context de autenticação
  - `useAuth()`: Hook principal
  - `useUserData()`: Dados do usuário (org_id, role)
  - `useIsPlatformAdmin()`: Verifica se é Platform Admin
  - `useIsOrgAdmin()`: Verifica se é Org Admin+
  - Custom claims do Firebase

- ✅ **components/Logo.tsx**: Componente ness.
  - Wordmark com ponto #00ade8
  - Variantes: light/dark
  - Tamanhos: sm/md/lg

- ✅ **components/ui/**: Componentes shadcn/ui base
  - Button (variantes + tamanhos)
  - Input (com validação)
  - Card (estrutura de card)
  - Label (para formulários)

### Portal de Governança (Implementado)

- ✅ **app/admin/governance/page.tsx**
  - Página protegida (Platform Admin only)
  - Verificação de RBAC
  - Mensagem de acesso negado
  - Layout elegante

- ✅ **app/admin/governance/components/CreateOrganizationForm.tsx**
  - Formulário completo de cadastro
  - Validação de campos obrigatórios
  - Conversão de domínios (string → array)
  - Validação de formato de domínios
  - Select de modelo LLM
  - Feedback de sucesso/erro
  - Integração com API (POST /create_organization)
  - Ícones monocromáticos (Lucide)

---

## 📋 Estrutura de Arquivos

```
oficios-portal-frontend/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── governance/
│   │   │       ├── page.tsx                ✅ Página protegida
│   │   │       └── components/
│   │   │           └── CreateOrganizationForm.tsx  ✅
│   │   ├── dashboard/                      📋 A implementar
│   │   ├── revisao/[id]/                   📋 A implementar
│   │   └── page.tsx                        📋 Landing/Login
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx                  ✅
│   │   │   ├── input.tsx                   ✅
│   │   │   ├── card.tsx                    ✅
│   │   │   └── label.tsx                   ✅
│   │   └── Logo.tsx                        ✅
│   │
│   ├── lib/
│   │   ├── utils.ts                        ✅
│   │   ├── firebase.ts                     ✅
│   │   └── api.ts                          ✅ Cliente HTTP completo
│   │
│   └── hooks/
│       └── useAuth.tsx                     ✅ Auth context
│
├── .env.example                            ✅
└── package.json
```

---

## 🚀 Setup e Uso

### 1. Configuração

```bash
# Copiar .env.example para .env.local
cp .env.example .env.local

# Editar .env.local com suas credenciais Firebase
nano .env.local
```

### 2. Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:3000`

### 3. Build para Produção

```bash
npm run build
npm start
```

---

## 🔐 Segurança e RBAC

### Verificação de Role

```typescript
// Em qualquer componente
import { useIsPlatformAdmin } from '@/hooks/useAuth';

const isPlatform = useIsPlatformAdmin();

if (!isPlatformAdmin) {
  return <AccessDenied />;
}
```

### Chamadas à API

```typescript
import { useAuth } from '@/hooks/useAuth';
import { createApiClient } from '@/lib/api';

const { getToken } = useAuth();
const apiClient = createApiClient(getToken);

// GET
const metrics = await apiClient.get('get_metrics?org_id=org123');

// POST
const result = await apiClient.post('create_organization', {
  name: 'Empresa XYZ',
  email_domains: ['xyz.com.br']
});

// PATCH
await apiClient.patch('update_organization', {
  org_id: 'org123',
  notification_email: 'novo@empresa.com'
});

// Upload
const formData = new FormData();
formData.append('file', file);
formData.append('org_id', 'org123');

await apiClient.upload('upload_knowledge_document', formData);
```

---

## 📋 Roadmap Pendente

### Camada 2: Landing/Login (Prioritário)
- [ ] `app/page.tsx` - Landing page split 60/40
  - Área 1: Branding ness. + Proposta de valor
  - Área 2: Login com Google OAuth
  - Design elegante e minimalista

### Camada 3: Dashboard SLA
- [ ] `app/dashboard/page.tsx`
  - Tabela de ofícios (Shadcn/ui DataTable)
  - Cards de métricas (Total, Em Risco, Vencidos)
  - Filtros (Atribuídos a mim, Status, Pesquisa)
  - Ações (Abrir revisão, Atribuir)

### Camada 4: Portal de Revisão HITL
- [ ] `app/revisao/[id]/page.tsx`
  - Split Panel (Raw Text | Formulário de correção)
  - Badge de confiança LLM
  - Ícones de alerta (confiança < 0.85)
  - Botão "Validar e Enviar"
  - React Hook Form para edição

### Camada 5: Admin Governance Completo
- [ ] Listagem de organizações
- [ ] Dashboard de métricas (gráficos)
- [ ] Upload de conhecimento (W7)
- [ ] Visualização de auditoria
- [ ] Simulador QA (W6)

---

## 🎨 Design System ness.

### Cores

```typescript
// Primary (Ponto da ness.)
colors: {
  primary: {
    DEFAULT: '#00ade8',
    50: '#e6f7fd',
    500: '#00ade8',
    900: '#00222e',
  }
}
```

### Tipografia

```typescript
// Font Montserrat
fontFamily: {
  sans: ['Montserrat', 'system-ui', 'sans-serif'],
}
```

### Ícones

- **Biblioteca:** Lucide React
- **Estilo:** Monocromáticos, traço fino (stroke-width: 1.5)
- **Uso:** `<Building2 className="h-4 w-4" />`

---

## 🧪 Testes

### Testar Cadastro de Organização

1. Fazer login como Platform Admin
2. Navegar para `/admin/governance`
3. Preencher formulário
4. Submit → Verificar response na Network tab
5. Confirmar criação no Firestore

---

## 📊 Status da Implementação

| Componente | Status | Arquivos |
|------------|--------|----------|
| **Fundação** | ✅ 100% | lib/*, hooks/*, Logo |
| **UI Base** | ✅ 100% | components/ui/* |
| **Governança** | ✅ 100% | admin/governance/* |
| **Landing/Login** | 📋 0% | app/page.tsx |
| **Dashboard** | 📋 0% | app/dashboard/* |
| **Revisão HITL** | 📋 0% | app/revisao/[id]/* |

**Total Implementado:** ~30% do frontend completo

---

**Próximos passos:** Implementar Landing/Login (Camada 2) seguindo o design split 60/40 com branding ness.





