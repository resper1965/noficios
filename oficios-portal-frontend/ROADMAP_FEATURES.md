# 🧙 n.Oficios - Roadmap de Features

## 📊 STATUS ATUAL (COMPLETO)

✅ **MVP Funcional em Produção:**
- URL: https://oficio.ness.tec.br
- Autenticação: Firebase Google OAuth
- Backend: Supabase PostgreSQL
- CRUD: Completo
- Deploy: VPS Ubuntu + Docker + SSL

---

## 🎯 PRÓXIMAS FEATURES - PLANEJAMENTO ESTRATÉGICO

### **FASE 5: GESTÃO DE ANEXOS** (~2h) ⭐ PRIORIDADE ALTA
**Por quê primeiro:** Ofícios jurídicos sempre têm documentos anexos

**Implementação:**
1. Supabase Storage bucket para PDFs
2. Upload de múltiplos arquivos
3. Lista de anexos por ofício
4. Download de documentos
5. Preview inline de PDFs

**Arquivos a criar:**
- `src/lib/storage.ts` - Service de upload
- `src/components/FileUpload.tsx` - Componente de upload
- `src/components/FileList.tsx` - Lista de anexos
- Atualizar `src/app/oficios/[id]/page.tsx` - Adicionar seção de anexos
- Atualizar `src/app/oficios/novo/page.tsx` - Upload ao criar

**SQL Supabase:**
```sql
-- Criar bucket de storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('oficios-attachments', 'oficios-attachments', false);

-- Políticas de acesso
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'oficios-attachments');
```

---

### **FASE 6: SISTEMA DE NOTIFICAÇÕES** (~3h) ⭐ PRIORIDADE ALTA
**Por quê:** Evitar vencimento de prazos

**Implementação:**
1. Verificação diária de prazos (cron job)
2. Email notifications (Resend ou SendGrid)
3. Push notifications no navegador
4. Dashboard de alertas
5. Configuração de antecedência (1, 3, 7 dias)

**Arquivos a criar:**
- `src/lib/notifications.ts` - Service de notificações
- `src/components/NotificationBell.tsx` - Sino de notificações
- `src/app/api/cron/check-prazos/route.ts` - API route para cron
- `src/hooks/useNotifications.tsx` - Hook de notificações

**Dependências:**
```bash
npm install @supabase/supabase-js resend
npm install --save-dev @types/node
```

**Supabase Function:**
```sql
-- Função para buscar ofícios próximos do prazo
CREATE OR REPLACE FUNCTION get_oficios_em_risco()
RETURNS TABLE (
  id BIGINT,
  numero TEXT,
  prazo TIMESTAMPTZ,
  dias_restantes INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.numero,
    o.prazo,
    EXTRACT(DAY FROM (o.prazo - NOW()))::INT as dias_restantes
  FROM oficios o
  WHERE o.status = 'ativo'
    AND o.prazo > NOW()
    AND o.prazo < NOW() + INTERVAL '7 days'
  ORDER BY o.prazo ASC;
END;
$$ LANGUAGE plpgsql;
```

---

### **FASE 7: RELATÓRIOS E DASHBOARDS** (~4h) ⭐ PRIORIDADE MÉDIA
**Por quê:** Análise de performance e métricas

**Implementação:**
1. Gráficos com Chart.js ou Recharts
2. Relatórios por período (semana, mês, ano)
3. Export para PDF (react-pdf)
4. Export para Excel (xlsx)
5. Métricas avançadas

**Arquivos a criar:**
- `src/components/charts/OficiosPorStatus.tsx` - Gráfico de pizza
- `src/components/charts/OficiosPorPeriodo.tsx` - Gráfico de linha
- `src/components/reports/MonthlyReport.tsx` - Relatório mensal
- `src/lib/export.ts` - Service de export
- `src/app/relatorios/page.tsx` - Página de relatórios

**Dependências:**
```bash
npm install recharts react-pdf @react-pdf/renderer xlsx
npm install --save-dev @types/recharts
```

**Métricas a implementar:**
- Taxa de resposta (respondidos / total)
- Tempo médio de resposta
- Ofícios por autoridade
- Tendências mensais
- Eficiência por período

---

### **FASE 8: INTEGRAÇÃO GMAIL API** (~8h) ⭐ PRIORIDADE BAIXA
**Por quê:** Automação completa, mas complexa

**Implementação:**
1. OAuth Gmail API
2. Buscar emails com ofícios
3. Parsing de conteúdo (regex + IA)
4. Extração de PDFs anexos
5. Criação automática de ofícios
6. Sincronização bidirecional

**Arquivos a criar:**
- `src/lib/gmail.ts` - Gmail API client
- `src/lib/parser.ts` - Parser de emails
- `src/app/api/gmail/sync/route.ts` - API route para sync
- `src/components/GmailSync.tsx` - Componente de sincronização
- `src/app/configuracoes/page.tsx` - Configurações Gmail

**Dependências:**
```bash
npm install googleapis @google-cloud/storage
npm install openai  # Para parsing com IA
```

**Fluxo:**
```
Email chegando → Gmail API detecta
    ↓
Parser extrai: número, processo, autoridade, prazo
    ↓
IA valida e completa dados faltantes
    ↓
Cria ofício automaticamente no Supabase
    ↓
Notifica usuário
```

---

### **FASE 9: MULTI-USUÁRIO E PERMISSÕES** (~6h) ⭐ PRIORIDADE BAIXA
**Por quê:** Trabalho em equipe

**Implementação:**
1. Sistema de organizações
2. Convites de usuários
3. Níveis de permissão (Admin, Editor, Viewer)
4. Compartilhamento de ofícios
5. Histórico de ações (audit log)

**Schema Supabase:**
```sql
-- Tabela de organizações
CREATE TABLE organizacoes (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de membros
CREATE TABLE membros_organizacao (
  id BIGSERIAL PRIMARY KEY,
  "orgId" BIGINT REFERENCES organizacoes(id),
  "userId" TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Atualizar oficios com orgId
ALTER TABLE oficios ADD COLUMN "orgId" BIGINT REFERENCES organizacoes(id);
```

---

### **FASE 10: IA E AUTOMAÇÃO AVANÇADA** (~10h) ⭐ PRIORIDADE FUTURA
**Por quê:** Diferencial competitivo

**Implementação:**
1. GPT-4 para sugestões de resposta
2. Classificação automática de ofícios
3. Templates de resposta inteligentes
4. Análise de sentimento
5. Predição de prazos

**Arquivos a criar:**
- `src/lib/openai.ts` - OpenAI client
- `src/components/AISuggestions.tsx` - Sugestões de IA
- `src/app/api/ai/suggest-response/route.ts` - API route
- `src/hooks/useAI.tsx` - Hook de IA

**Features:**
- Sugestão de resposta baseada no histórico
- Classificação de urgência automática
- Resumo automático de ofícios longos
- Detecção de informações faltantes

---

## 📋 CRONOGRAMA RECOMENDADO

### **Semana 1 (Essencial):**
- **Dia 1-2:** Fase 5 - Upload de Anexos (2h)
- **Dia 3-4:** Fase 6 - Notificações (3h)
- **Dia 5:** Testes e ajustes

### **Semana 2 (Análise):**
- **Dia 1-3:** Fase 7 - Relatórios e Gráficos (4h)
- **Dia 4-5:** Refinamentos e UX

### **Semana 3 (Automação):**
- **Dia 1-5:** Fase 8 - Gmail API (8h)

### **Semana 4+ (Avançado):**
- Fase 9 - Multi-usuário (6h)
- Fase 10 - IA e Automação (10h)

---

## 🎯 RECOMENDAÇÃO IMEDIATA

**COMECE COM:**
1. **Upload de Anexos** (2h) - Mais útil imediatamente
2. **Notificações** (3h) - Crítico para não perder prazos

**Total:** 5 horas para ter aplicação completa com features essenciais

---

## 🚀 PRÓXIMA AÇÃO

**Escolha:**
- **Opção A:** Implementar Fase 5 (Anexos) agora
- **Opção B:** Implementar Fase 6 (Notificações) agora
- **Opção C:** Implementar ambas em sequência (5h)

**Qual você prefere?**

