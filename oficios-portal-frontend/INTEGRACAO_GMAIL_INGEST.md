# 📧 INTEGRAÇÃO GMAIL COM MARCADOR INGEST

## 🎯 VISÃO GERAL

O sistema processa automaticamente emails de ofícios que são marcados com o label **"INGEST"** no Gmail.

---

## 🔄 FLUXO AUTOMÁTICO

```
Email de Ofício chega →
  ↓
Regra Gmail aplica label "INGEST" →
  ↓
n.Oficios sincroniza (manual ou automático) →
  ↓
Email Parser extrai dados →
  ↓
AI Parser valida e melhora →
  ↓
Cria Ofício no Supabase →
  ↓
Marca email como "Processado"
```

---

## 📋 CONFIGURAÇÃO DA REGRA GMAIL

### 1. Criar Label INGEST

1. Abra Gmail: https://mail.google.com
2. No menu lateral, role até "Labels"
3. Clique em **"Create new label"**
4. Nome: **INGEST**
5. Clique em **"Create"**

---

### 2. Criar Regra de Filtro

1. No Gmail, clique no ícone de **busca** 🔍
2. Clique em **"Show search options"** (seta para baixo)
3. Configure:
   - **From:** (deixe vazio ou adicione domínios específicos)
   - **Subject:** `ofício` (ou palavras-chave)
   - **Has attachment:** ✅ Marque
4. Clique em **"Create filter"**
5. Marque:
   - ✅ **Apply the label:** INGEST
   - ✅ **Also apply filter to matching messages** (opcional)
6. Clique em **"Create filter"**

---

## 🔧 EXEMPLOS DE REGRAS

### Regra 1: Todos os ofícios com anexo
```
Has the words: ofício OR oficio
Has attachment: Yes
→ Apply label: INGEST
```

### Regra 2: De autoridades específicas
```
From: @trf1.jus.br OR @tj.sp.gov.br
Has attachment: Yes
→ Apply label: INGEST
```

### Regra 3: Com padrões específicos no assunto
```
Subject: (ofício OR requisição OR intimação)
Has attachment: Yes
→ Apply label: INGEST
```

---

## 🚀 USO NO n.Oficios

### Sincronização Manual

1. Acesse: https://oficio.ness.tec.br/configuracoes
2. Clique em **"Sincronizar E-mails"**
3. O sistema:
   - Busca emails com label INGEST
   - Extrai dados (número, processo, autoridade, prazo)
   - Valida com IA se necessário
   - Cria ofícios automaticamente
   - Marca como "Processado"

### Resultado

- ✅ Ofícios importados automaticamente
- ✅ Anexos baixados
- ✅ Email marcado como lido
- ✅ Label "n.Oficios/Processado" adicionado

---

## 🧪 TESTAR

### 1. Enviar Email de Teste

Envie para si mesmo um email com:
- **Assunto:** `Ofício nº 12345 - Teste`
- **Corpo:**
  ```
  Processo: 1234567-89.2024.4.01.3800
  Autoridade: Tribunal Regional Federal
  Prazo: 30/10/2024
  ```
- **Anexo:** Qualquer PDF

### 2. Aplicar Label INGEST

1. Abra o email
2. Clique em Labels (ícone de etiqueta)
3. Marque **INGEST**

### 3. Sincronizar no n.Oficios

1. Vá em https://oficio.ness.tec.br/configuracoes
2. Clique "Sincronizar E-mails"
3. ✅ Deve aparecer na lista de importados

---

## 📊 LABELS USADOS PELO SISTEMA

| Label | Quando Aplicado | Significado |
|-------|-----------------|-------------|
| `INGEST` | Manual/Regra Gmail | Email aguardando processamento |
| `n.Oficios/Processado` | Após sync bem-sucedido | Ofício criado no sistema |
| `n.Oficios/Revisão` | Parsing com baixa confiança | Requer revisão manual |
| `n.Oficios/Erro` | Falha no processamento | Erro durante importação |

---

## 🔍 MONITORAMENTO

### Ver emails no INGEST:
```
No Gmail: pesquise "label:INGEST"
```

### Ver emails processados:
```
No Gmail: pesquise "label:n.Oficios/Processado"
```

### Ver emails com erro:
```
No Gmail: pesquise "label:n.Oficios/Erro"
```

---

## 🛠️ CÓDIGO TÉCNICO

### Buscar por Label:
```typescript
const emails = await gmailService.searchByLabel('INGEST', 50);
```

### Adicionar Label após processar:
```typescript
await gmailService.addLabel(emailId, 'n.Oficios/Processado');
```

---

## ⚡ AUTOMAÇÃO FUTURA

### Sync Automático (Cron)

Possível implementação com Edge Functions:

```typescript
// supabase/functions/gmail-sync-cron/index.ts
Deno.cron("Sync Gmail INGEST", "*/30 * * * *", async () => {
  // Executa sync a cada 30 minutos
  await syncGmailIngest();
});
```

### Webhook do Gmail

Usar Gmail Push Notifications:
1. Configurar Pub/Sub no Google Cloud
2. Receber notificações em tempo real
3. Processar assim que email chega

---

## 📋 CHECKLIST DE SETUP

- [ ] Criar label INGEST no Gmail
- [ ] Criar regra de filtro automático
- [ ] Conectar Gmail no n.Oficios (Configurações)
- [ ] Testar com email de exemplo
- [ ] Verificar ofício criado no dashboard
- [ ] Configurar regras adicionais conforme necessário

---

## 🆘 TROUBLESHOOTING

### Label INGEST não aparece
- Verifique se criou o label no Gmail
- Labels são case-sensitive

### Emails não são processados
- Verifique conexão Gmail em Configurações
- Veja console do navegador (F12) para erros
- Confirme que email tem anexo

### Parsing falha
- Email aparece em "Precisam Revisão"
- Revise manualmente e ajuste regex patterns
- Melhore prompts da IA no ai-parser.ts

---

**✅ Workflow otimizado para processar emails de ofícios automaticamente!**

