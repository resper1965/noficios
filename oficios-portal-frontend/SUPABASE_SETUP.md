# 🗄️ CONFIGURAÇÃO SUPABASE - n.Oficios

## 📋 PASSO A PASSO

### 1️⃣ CRIAR CONTA E PROJETO NO SUPABASE

1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Faça login com GitHub (ou crie conta)
4. Clique em "New Project"
5. Preencha:
   - **Name:** n-oficios
   - **Database Password:** [crie uma senha forte]
   - **Region:** South America (São Paulo)
6. Clique em "Create new project"
7. Aguarde ~2 minutos para provisionar

---

### 2️⃣ CRIAR TABELA DE OFICIOS

No painel do Supabase:

1. Vá em **"Table Editor"** (menu lateral)
2. Clique em **"Create a new table"**
3. Preencha:
   - **Name:** oficios
   - **Description:** Tabela de ofícios jurídicos

4. **Adicione as colunas:**

| Nome | Tipo | Default | Configuração |
|------|------|---------|--------------|
| `id` | `int8` | - | Primary Key, Identity |
| `numero` | `text` | - | - |
| `processo` | `text` | - | - |
| `autoridade` | `text` | - | - |
| `status` | `text` | `'ativo'` | - |
| `prazo` | `timestamptz` | - | - |
| `descricao` | `text` | - | Nullable |
| `resposta` | `text` | - | Nullable |
| `anexos` | `text[]` | `'{}'` | - |
| `userId` | `text` | - | - |
| `createdAt` | `timestamptz` | `now()` | - |
| `updatedAt` | `timestamptz` | `now()` | - |

5. Marque **"Enable Row Level Security (RLS)"**
6. Clique em **"Save"**

---

### 3️⃣ CONFIGURAR RLS (Row Level Security)

No **SQL Editor**, execute:

```sql
-- Policy: Usuários só podem ver seus próprios ofícios
CREATE POLICY "Users can view own oficios"
ON oficios
FOR SELECT
USING (auth.uid()::text = userId OR userId = auth.jwt()->>'email');

-- Policy: Usuários podem criar seus próprios ofícios
CREATE POLICY "Users can create own oficios"
ON oficios
FOR INSERT
WITH CHECK (auth.jwt()->>'email' = userId);

-- Policy: Usuários podem atualizar seus próprios ofícios
CREATE POLICY "Users can update own oficios"
ON oficios
FOR UPDATE
USING (auth.jwt()->>'email' = userId);

-- Policy: Usuários podem deletar seus próprios ofícios
CREATE POLICY "Users can delete own oficios"
ON oficios
FOR DELETE
USING (auth.jwt()->>'email' = userId);
```

---

### 4️⃣ INSERIR DADOS DE TESTE

No **SQL Editor**, execute:

```sql
INSERT INTO oficios (numero, processo, autoridade, status, prazo, descricao, "userId")
VALUES
  ('12345', '1234567-89.2024.1.00.0000', 'Tribunal Regional Federal - 1ª Região', 'ativo', '2024-10-19T23:59:59Z', 'Requisição de informações processuais', 'resper@ness.com.br'),
  ('12344', '1234566-88.2024.1.00.0000', 'Superior Tribunal de Justiça', 'ativo', '2024-10-22T23:59:59Z', 'Solicitação de documentos', 'resper@ness.com.br'),
  ('12343', '1234565-87.2024.1.00.0000', 'Tribunal de Justiça de São Paulo', 'vencido', '2024-10-16T23:59:59Z', 'Pedido de esclarecimentos', 'resper@ness.com.br'),
  ('12342', '1234564-86.2024.1.00.0000', 'Ministério Público Federal', 'respondido', '2024-10-05T23:59:59Z', 'Informações sobre investigação', 'resper@ness.com.br');
```

---

### 5️⃣ OBTER CREDENCIAIS

1. Vá em **"Project Settings"** (ícone engrenagem)
2. Clique em **"API"**
3. Copie:
   - **Project URL:** `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### 6️⃣ CONFIGURAR VARIÁVEIS DE AMBIENTE

Crie o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE:**
- Substitua os valores pelas suas credenciais
- **NÃO** commite este arquivo no git
- Adicione `.env.local` no `.gitignore`

---

### 7️⃣ ATUALIZAR O CÓDIGO

Edite `src/hooks/useOficios.tsx`:

```typescript
// Trocar de:
import { apiService } from '@/lib/api';

// Para:
import { supabaseService as apiService } from '@/lib/supabase';
```

---

### 8️⃣ TESTAR

```bash
# Reiniciar servidor dev
npm run dev
```

Acesse: http://localhost:3000

✅ Agora os dados vêm do Supabase!

---

## 🔒 SEGURANÇA

### RLS Habilitado
- ✅ Usuários só veem seus próprios ofícios
- ✅ Impossível acessar dados de outros usuários
- ✅ Queries SQL filtradas automaticamente

### Autenticação
- Usar Firebase Auth do frontend
- Supabase valida via `userId` (email)

---

## 📊 VANTAGENS DO SUPABASE

✅ **Backend real** (PostgreSQL)
✅ **Escalável** (milhões de registros)
✅ **Tempo real** (subscriptions)
✅ **Backups automáticos**
✅ **Dashboard SQL**
✅ **Gratuito** até 500MB

---

## 🚀 PRÓXIMOS PASSOS (OPCIONAL)

1. **Storage:** Upload de anexos (PDFs)
2. **Realtime:** Notificações em tempo real
3. **Functions:** Lógica serverless
4. **Backups:** Configurar backups diários

---

**Após configurar, a aplicação estará 100% funcional com banco de dados real!** 🎉

