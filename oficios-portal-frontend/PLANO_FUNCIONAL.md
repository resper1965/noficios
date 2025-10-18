# 🏗️ PLANO ARQUITETURAL - n.Oficios Funcional

## 📊 ANÁLISE ATUAL

### ❌ **Dados MOCK (Hardcoded):**
```typescript
// Dashboard stats (linhas 89, 100, 111, 122)
Ofícios Ativos: 24
Em Risco: 3
Vencidos: 1
Respondidos: 156

// Ofícios recentes (linhas 137-165)
- Ofício #12345 - Processo 1234567-89.2024.1.00.0000 - 2 dias
- Ofício #12344 - Processo 1234566-88.2024.1.00.0000 - 5 dias
- Ofício #12343 - Processo 1234565-87.2024.1.00.0000 - Vencido
```

### ✅ **Já Implementado:**
- Autenticação Firebase Google OAuth
- Proteção de rotas
- UI completa com design system
- Componentes responsivos

---

## 🎯 PLANO DE IMPLEMENTAÇÃO

### **FASE 1: BACKEND LOCAL (JSON Server) - 2h**
*Desenvolvimento rápido com dados funcionais*

#### **1.1 Setup JSON Server**
```bash
npm install --save-dev json-server
```

#### **1.2 Criar db.json**
```json
{
  "oficios": [
    {
      "id": 1,
      "numero": "12345",
      "processo": "1234567-89.2024.1.00.0000",
      "autoridade": "Tribunal Regional Federal",
      "status": "ativo",
      "prazo": "2024-10-19T23:59:59Z",
      "descricao": "Requisição de informações processuais",
      "userId": "user@example.com",
      "createdAt": "2024-10-15T10:00:00Z",
      "updatedAt": "2024-10-15T10:00:00Z"
    }
  ],
  "stats": {
    "ativos": 24,
    "emRisco": 3,
    "vencidos": 1,
    "respondidos": 156
  }
}
```

#### **1.3 Script package.json**
```json
{
  "scripts": {
    "api": "json-server --watch db.json --port 3001"
  }
}
```

---

### **FASE 2: INTEGRAÇÃO FRONTEND - 3h**
*Conectar UI aos dados reais*

#### **2.1 Criar hooks de API**
```typescript
// src/hooks/useOficios.tsx
export function useOficios() {
  const [oficios, setOficios] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOficios = async () => {
    const response = await fetch('http://localhost:3001/oficios');
    const data = await response.json();
    setOficios(data);
  };

  const fetchStats = async () => {
    const response = await fetch('http://localhost:3001/stats');
    const data = await response.json();
    setStats(data);
  };

  return { oficios, stats, loading, fetchOficios, fetchStats };
}
```

#### **2.2 Atualizar Dashboard**
```typescript
// src/app/dashboard/page.tsx
const { oficios, stats, loading } = useOficios();

// Substituir dados hardcoded:
<p className="text-3xl font-bold">{stats?.ativos || 0}</p>
<p className="text-3xl font-bold">{stats?.emRisco || 0}</p>
<p className="text-3xl font-bold">{stats?.vencidos || 0}</p>
<p className="text-3xl font-bold">{stats?.respondidos || 0}</p>

// Map ofícios reais:
{oficios.map(oficio => (
  <div key={oficio.id}>
    <p>Ofício #{oficio.numero}</p>
    <p>Processo: {oficio.processo}</p>
  </div>
))}
```

---

### **FASE 3: CRUD COMPLETO - 4h**
*Implementar operações de criação, leitura, atualização e exclusão*

#### **3.1 Criar página de Ofícios**
```
src/app/oficios/
├── page.tsx           # Lista de ofícios
├── [id]/
│   └── page.tsx       # Detalhes do ofício
└── novo/
    └── page.tsx       # Criar novo ofício
```

#### **3.2 Componente de Lista**
```typescript
// src/app/oficios/page.tsx
export default function OficiosPage() {
  const { oficios, loading } = useOficios();
  
  return (
    <div>
      <h1>Gerenciar Ofícios</h1>
      <button>+ Novo Ofício</button>
      
      <table>
        {oficios.map(oficio => (
          <tr key={oficio.id}>
            <td>{oficio.numero}</td>
            <td>{oficio.processo}</td>
            <td>{oficio.status}</td>
            <td>
              <button>Editar</button>
              <button>Excluir</button>
            </td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

#### **3.3 Formulário de Criação**
```typescript
// src/app/oficios/novo/page.tsx
export default function NovoOficioPage() {
  const [formData, setFormData] = useState({
    numero: '',
    processo: '',
    autoridade: '',
    prazo: '',
    descricao: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    await fetch('http://localhost:3001/oficios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        userId: user.email,
        status: 'ativo',
        createdAt: new Date().toISOString()
      })
    });
    
    router.push('/oficios');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="numero" placeholder="Número do Ofício" />
      <input name="processo" placeholder="Número do Processo" />
      <input name="autoridade" placeholder="Autoridade" />
      <input type="datetime-local" name="prazo" />
      <textarea name="descricao" placeholder="Descrição" />
      <button type="submit">Criar Ofício</button>
    </form>
  );
}
```

---

### **FASE 4: BACKEND REAL (OPCIONAL) - 8h**
*Migrar para backend profissional*

#### **Opção A: Supabase (Recomendado)**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Operações
export async function getOficios(userId: string) {
  const { data, error } = await supabase
    .from('oficios')
    .select('*')
    .eq('userId', userId);
  
  return data;
}
```

#### **Opção B: Firebase Firestore**
```typescript
// src/lib/firestore.ts
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const db = getFirestore(app);

export async function getOficios(userId: string) {
  const snapshot = await getDocs(
    collection(db, 'oficios')
      .where('userId', '==', userId)
  );
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

#### **Opção C: Python FastAPI**
```python
# backend/main.py
from fastapi import FastAPI
from sqlalchemy import create_engine

app = FastAPI()
engine = create_engine("postgresql://...")

@app.get("/api/oficios")
async def get_oficios(user_id: str):
    return db.query(Oficio).filter(Oficio.user_id == user_id).all()
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **✅ Fase 1: Backend Local (JSON Server)**
- [ ] Instalar json-server
- [ ] Criar db.json com estrutura de dados
- [ ] Adicionar script "api" no package.json
- [ ] Testar endpoints (GET, POST, PUT, DELETE)

### **✅ Fase 2: Integração Frontend**
- [ ] Criar hook useOficios
- [ ] Criar service de API (api.ts)
- [ ] Atualizar dashboard com dados reais
- [ ] Implementar loading states
- [ ] Implementar error handling

### **✅ Fase 3: CRUD Completo**
- [ ] Criar página /oficios (lista)
- [ ] Criar página /oficios/novo (criar)
- [ ] Criar página /oficios/[id] (detalhes)
- [ ] Criar página /oficios/[id]/editar (editar)
- [ ] Implementar exclusão com confirmação
- [ ] Implementar filtros e busca
- [ ] Implementar paginação

### **✅ Fase 4: Features Avançadas**
- [ ] Upload de arquivos anexos
- [ ] Notificações de prazo
- [ ] Histórico de alterações
- [ ] Export para PDF
- [ ] Relatórios e gráficos

---

## 🗂️ ESTRUTURA DE DADOS

### **Modelo: Ofício**
```typescript
interface Oficio {
  id: number;
  numero: string;              // "12345"
  processo: string;            // "1234567-89.2024.1.00.0000"
  autoridade: string;          // "Tribunal Regional Federal"
  status: 'ativo' | 'respondido' | 'vencido';
  prazo: string;               // ISO 8601 date
  descricao: string;
  resposta?: string;
  anexos?: string[];
  userId: string;              // Firebase Auth UID
  createdAt: string;
  updatedAt: string;
}
```

### **Modelo: Stats**
```typescript
interface DashboardStats {
  ativos: number;
  emRisco: number;
  vencidos: number;
  respondidos: number;
}
```

---

## 🎯 TIMELINE ESTIMADO

| Fase | Descrição | Tempo | Complexidade |
|------|-----------|-------|--------------|
| **1** | Backend Local (JSON Server) | 2h | ⭐ Baixa |
| **2** | Integração Frontend | 3h | ⭐⭐ Média |
| **3** | CRUD Completo | 4h | ⭐⭐⭐ Alta |
| **4** | Backend Real (Opcional) | 8h | ⭐⭐⭐⭐ Muito Alta |

**Total:** 9h para aplicação funcional completa (Fases 1-3)

---

## 💡 RECOMENDAÇÃO ARQUITETURAL

### **Para Desenvolvimento Rápido (Hoje/Amanhã):**
1. **Fase 1:** JSON Server (2h)
2. **Fase 2:** Integração Frontend (3h)
3. **Fase 3:** CRUD Completo (4h)

**Resultado:** Aplicação 100% funcional em 9 horas.

### **Para Produção (Semana):**
1. Fases 1-3 (9h)
2. **Fase 4:** Migrar para Supabase (8h)
3. **Deploy:** VPS com Docker (4h)

**Resultado:** Aplicação profissional em produção em ~21 horas.

---

## 🚀 PRÓXIMA AÇÃO

**Quer que eu implemente?**

**Opção A:** Implementação completa (Fases 1-3) agora
**Opção B:** Fase por fase com sua aprovação
**Opção C:** Apenas uma fase específica

**Escolha e eu começo imediatamente!** 🏗️
