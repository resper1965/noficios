# 🚀 Primeiros Passos - n.Oficios

**Bem-vindo ao n.Oficios!**  
Este guia te ajudará a configurar e usar a plataforma pela primeira vez.

---

## 📍 Acesso ao Sistema

### URL Principal:
```
https://oficio.ness.tec.br
```

### Outras URLs importantes:
- **Admin Portal:** https://oficio.ness.tec.br/admin/governance
- **Dashboard:** https://oficio.ness.tec.br/dashboard
- **Segurança:** https://oficio.ness.tec.br/security
- **Políticas:** https://oficio.ness.tec.br/policies/terms

---

## 1️⃣ Primeiro Login (Platform Admin)

### Antes de começar:

Você precisa configurar o primeiro usuário admin. Siga o guia `SETUP_DOMINIO.md` seção **"Primeiro Acesso - Criando Usuário Admin"**.

**Resumo:**
1. Crie usuário no Firebase Authentication
2. Configure custom claims com `ROLE_PLATFORM_ADMIN`
3. Faça login em: https://oficio.ness.tec.br

### Ao fazer login pela primeira vez:

1. **Modal de Aceite de Políticas:** 
   - Você verá um modal com Termos de Uso e Política de Privacidade
   - Role até o final de cada documento
   - Clique em "Aceito e Concordo"

2. **Banner de Cookies:**
   - Você verá um banner de consentimento de cookies
   - Escolha: "Aceitar Todos", "Apenas Essenciais" ou "Gerenciar Preferências"

3. **Redirecionamento:**
   - Você será redirecionado para `/dashboard`

---

## 2️⃣ Criar Primeira Organização

Como **Platform Admin**, você pode criar organizações (tenants):

### Passos:

1. Acesse: https://oficio.ness.tec.br/admin/governance

2. Preencha o formulário:
   - **Nome:** Nome da empresa/organização
   - **Domínios:** E-mails autorizados (ex: `@empresa.com.br`)
   - **E-mail de Ingestão:** E-mail que receberá ofícios (ex: `oficios@empresa.com.br`)
   - **Modelo LLM:** Escolha entre:
     - `llama-3.1-8b` (padrão, rápido e barato)
     - `llama-3.1-70b` (mais preciso)
     - `gpt-4o-mini` (OpenAI)

3. Clique em **Criar Organização**

4. **Anote o `org_id`** retornado (você precisará dele para criar usuários)

---

## 3️⃣ Adicionar Usuários à Organização

### No Firebase Console:

1. Acesse: https://console.firebase.google.com
2. Selecione: **oficio-automation-production-2024**
3. Vá em: **Authentication → Users**
4. Clique em: **Add user**
5. Preencha:
   - **E-mail:** usuario@empresa.com.br (deve ter o domínio da org)
   - **Senha:** Temporária (o usuário poderá trocar)

### Configure Custom Claims:

Use Firebase CLI ou script Node.js:

```javascript
// set-user-role.js
const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'oficio-automation-production-2024'
});

// Para Org Admin
admin.auth().setCustomUserClaims('UID_DO_USUARIO', {
  role: 'ROLE_ORG_ADMIN',
  org_id: 'org_123abc' // ID da organização criada
});

// Para usuário comum (compliance team)
admin.auth().setCustomUserClaims('OUTRO_UID', {
  role: 'ROLE_USER',
  org_id: 'org_123abc'
});
```

Execute:
```bash
node set-user-role.js
```

---

## 4️⃣ Popular Base de Conhecimento (RAG)

Para que o sistema gere respostas inteligentes, você precisa alimentar a base de conhecimento:

### O que fazer upload:

- ✅ Políticas internas da empresa
- ✅ Procedimentos operacionais
- ✅ Legislação aplicável (leis, normas, regulamentos)
- ✅ Templates de resposta
- ✅ Histórico de respostas aprovadas
- ✅ FAQs jurídicas

### Como fazer upload:

**Opção A: Interface Web (em desenvolvimento)**
```
https://oficio.ness.tec.br/admin/knowledge (futura feature)
```

**Opção B: API (atual)**

```bash
# Obtenha seu JWT token após login
JWT_TOKEN="seu_token_aqui"

# Upload de documento
curl -X POST \
  https://southamerica-east1-oficio-automation-production-2024.cloudfunctions.net/upload_knowledge_document \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@documento.pdf" \
  -F "title=Política de Privacidade Interna" \
  -F "tipo=POLICY"
```

---

## 5️⃣ Testar o Sistema (Simulador)

Antes de processar ofícios reais, teste o fluxo:

### Simular Ingestion:

```bash
curl -X POST \
  https://southamerica-east1-oficio-automation-production-2024.cloudfunctions.net/simulate_ingestion \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "raw_text": "OFÍCIO Nº 456/2024\n\nIlustrísima Senhora,\n\nSolicitamos informações sobre o Processo nº 1234567-89.2024.8.01.0001, referente ao cumprimento da Lei 12.345/2020.\n\nPrazo: 10 (dez) dias.\n\nAtenciosamente,\nJuíza Maria Silva",
    "target_domain": "empresa.com.br"
  }'
```

### O que acontece:

1. Sistema extrai dados estruturados (W1):
   - Autoridade: "Juíza Maria Silva"
   - Processo: "1234567-89.2024.8.01.0001"
   - Prazo: "10 dias"
   - Solicitações: Array de solicitações identificadas

2. Calcula prioridade e SLA

3. Armazena no Firestore (status: AGUARDANDO_COMPLIANCE)

4. Você verá o ofício no Dashboard

---

## 6️⃣ Usar o Dashboard

### Acessar:
```
https://oficio.ness.tec.br/dashboard
```

### Funcionalidades:

1. **Indicadores SLA:**
   - Total Ofícios Ativos
   - Em Risco (< 24h)
   - Vencidos

2. **Tabela de Ofícios:**
   - Filtros por status, prioridade
   - Busca por processo, autoridade
   - Ações: Visualizar, Atribuir, Responder

3. **Atribuir a um usuário:**
   - Clique no ofício
   - Selecione usuário
   - Ofício fica na fila do usuário

4. **Revisar e Corrigir (HITL):**
   - Acesse `/revisao/[id]` (futura feature)
   - Valide/corrija dados extraídos
   - Envie para composição de resposta

---

## 7️⃣ Configurar Alertas SLA (W2)

O sistema monitora prazos automaticamente:

### Configure Cloud Scheduler:

```bash
# Criar job de SLA monitoring (roda a cada 4 horas)
gcloud scheduler jobs create http sla-monitor \
  --location southamerica-east1 \
  --schedule="0 */4 * * *" \
  --uri="https://southamerica-east1-oficio-automation-production-2024.cloudfunctions.net/monitor_sla" \
  --http-method=GET \
  --project=oficio-automation-production-2024
```

### O que acontece:

- Sistema verifica ofícios próximos do prazo
- Envia alertas baseados em urgência:
  - **VENCIDO:** Alerta imediato
  - **CRÍTICO:** < 24h para vencer
  - **URGENTE:** < 48h para vencer
  - **ATENÇÃO:** < 72h para vencer

---

## 8️⃣ Integrar com E-mail (Ingestion Automática)

Para processar ofícios automaticamente ao receber e-mails:

### Opção A: Gmail API

1. Configure conta de serviço no GCP
2. Autorize acesso ao Gmail da sua organização
3. Configure filtro para encaminhar e-mails com "ofício" no assunto

### Opção B: SendGrid Inbound Parse

1. Configure webhook apontando para W1 Cloud Function
2. Configure MX records do seu domínio
3. E-mails enviados para `oficios@empresa.com.br` são processados automaticamente

---

## 9️⃣ Visualizar Logs e Auditoria

### Auditoria (LGPD Art. 37):

```bash
# Via API
curl -X GET \
  "https://southamerica-east1-oficio-automation-production-2024.cloudfunctions.net/get_audit_trail?org_id=org_123&start_date=2024-10-01" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Logs de Acesso ao Raw Text:

Todos os acessos ao conteúdo bruto dos ofícios são registrados:

```json
{
  "action": "ACCESS_RAW_TEXT",
  "user_id": "usuario@empresa.com.br",
  "oficio_id": "oficio_789",
  "timestamp": "2024-10-10T15:30:00Z",
  "ip_address": "200.x.x.x",
  "details": "URL assinada gerada (válida 60 min)"
}
```

---

## 🔟 Manutenção e Operação

### Backup (Firestore):

Configure backups automáticos:

```bash
gcloud firestore backups schedules create \
  --database='(default)' \
  --recurrence=weekly \
  --retention=14w \
  --project=oficio-automation-production-2024
```

### Monitoramento:

- **Uptime checks:** Configure no Cloud Monitoring
- **Alertas de erro:** Configure notificações via e-mail/Slack
- **Budget alerts:** Configure alertas de custo no Billing

---

## 📚 Recursos Adicionais

### Documentação:
- [LGPD_COMPLIANCE.md](oficios-automation/LGPD_COMPLIANCE.md) - Conformidade
- [DEPLOY_INSTRUCTIONS.md](DEPLOY_INSTRUCTIONS.md) - Deploy completo
- [SETUP_DOMINIO.md](SETUP_DOMINIO.md) - Configuração de domínio
- [CONFIG_PRODUCAO.md](oficios-portal-frontend/CONFIG_PRODUCAO.md) - Configurações

### Suporte:
- **E-mail:** suporte@ness.tec.br
- **DPO (LGPD):** dpo@ness.tec.br
- **GitHub Issues:** (se projeto open source)

---

## ✅ Checklist de Configuração Inicial

- [ ] Primeiro admin criado
- [ ] Login funcionando em `oficio.ness.tec.br`
- [ ] Primeira organização criada
- [ ] Usuários convidados e configurados
- [ ] Base de conhecimento populada (mínimo 5 documentos)
- [ ] Teste de simulação realizado
- [ ] Dashboard acessível e funcionando
- [ ] SLA monitoring configurado (Cloud Scheduler)
- [ ] E-mail de ingestão configurado (opcional)
- [ ] Backup do Firestore configurado
- [ ] Monitoramento e alertas configurados

---

## 🎯 Próximas Features (Roadmap)

- [ ] Portal HITL completo (`/revisao/[id]`)
- [ ] Interface de upload de conhecimento
- [ ] Sidebar de navegação
- [ ] Exportação de relatórios
- [ ] Integração Slack (notificações)
- [ ] Mobile app (PWA)
- [ ] Assinatura digital de respostas

---

**🎉 Sistema configurado e pronto para uso!**

Acesse agora: **https://oficio.ness.tec.br**

*powered by ness.* 💙





