# 🎯 PRÓXIMOS PASSOS - n.Oficios

**Data:** 18 de Outubro de 2025  
**Status Atual:** 96% Completo  
**Tempo estimado para conclusão:** 2-4 horas

---

## ✅ RESUMO DA VERIFICAÇÃO

### **Ambiente:** 96% Configurado (27/28 ✅)

**O que está funcionando:**
- ✅ Todas as dependências instaladas (Node, npm, Firebase, react-pdf, etc)
- ✅ Estrutura do projeto completa
- ✅ Arquivos de configuração (.env.local, .env.production)
- ✅ Backend Python com 15 Cloud Functions
- ✅ Frontend Next.js com Portal HITL
- ✅ Hooks de autenticação (`useAuthSupabase`, `useAuthGoogle`)

**O que foi identificado:**
- ⚠️ O hook `useAuth.tsx` mencionado nos docs na verdade são dois hooks:
  - `useAuthSupabase.tsx` ✅
  - `useAuthGoogle.tsx` ✅

---

## 🚀 AÇÃO IMEDIATA: TESTAR O SISTEMA

### **Passo 1: Popular Dados de Teste** (5 minutos)

```bash
# 1. Acesse o Supabase SQL Editor
# https://supabase.com/dashboard/project/[seu-projeto]/sql

# 2. Execute o SQL (já existe em POPULAR_DADOS_TESTE.sql)
```

### **Passo 2: Testar Localmente** (10 minutos)

```bash
cd /home/resper/noficios/oficios-portal-frontend

# Iniciar em modo desenvolvimento
npm run dev

# Abrir no navegador
# http://localhost:3000
```

### **Passo 3: Verificar Funcionalidades** (15 minutos)

1. **Landing Page:**
   - [ ] Carregar página inicial
   - [ ] Login com Google funciona
   - [ ] Redirecionamento para dashboard

2. **Dashboard:**
   - [ ] Mostrar indicadores SLA
   - [ ] Listar ofícios aguardando revisão
   - [ ] Botão "Revisar" funciona

3. **Portal HITL:**
   - [ ] Abrir ofício para revisão
   - [ ] Ver PDF renderizado
   - [ ] Revisar dados da IA
   - [ ] Aprovar ofício

---

## 📋 CHECKLIST DE DEPLOY

### **Preparação (30 minutos)**

```bash
# 1. Build de produção
cd /home/resper/noficios/oficios-portal-frontend
npm run build

# Verificar se build foi bem-sucedido
# Deve gerar pasta .next/

# 2. Testar build localmente
npm run start

# 3. Verificar se tudo funciona em produção
```

### **Deploy no VPS (15 minutos)**

```bash
# Opção 1: Script automatizado
./deploy-hitl.sh

# Opção 2: Deploy completo
./deploy-vps-complete.sh

# Verificar logs
docker logs oficios-portal-frontend
```

### **Verificação Pós-Deploy (10 minutos)**

```bash
# 1. Acessar aplicação
# https://oficio.ness.tec.br

# 2. Fazer login

# 3. Testar fluxo completo:
#    - Dashboard
#    - HITL
#    - Aprovação

# 4. Verificar logs
ssh root@62.72.8.164
docker logs oficios-portal-frontend -f
```

---

## 🧪 TESTES E2E (OPCIONAL - 1-2 horas)

Se quiser implementar testes automatizados:

```bash
# Instalar Playwright
npm install --save-dev @playwright/test

# Criar arquivo de teste
mkdir -p tests
cat > tests/fluxo-hitl.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test('Fluxo completo HITL', async ({ page }) => {
  // 1. Acessar aplicação
  await page.goto('https://oficio.ness.tec.br');
  
  // 2. Fazer login
  await page.click('text=Entrar com Google');
  
  // 3. Acessar dashboard
  await expect(page).toHaveURL(/dashboard/);
  
  // 4. Clicar em revisar ofício
  await page.click('text=Revisar');
  
  // 5. Verificar portal HITL
  await expect(page.locator('h1')).toContainText('Revisão');
  
  // 6. Aprovar ofício
  await page.click('text=Aprovar');
  
  // 7. Verificar sucesso
  await expect(page.locator('.toast')).toBeVisible();
});
EOF

# Executar testes
npx playwright test
```

---

## 📊 COMANDOS ÚTEIS

### **Desenvolvimento:**
```bash
# Instalar dependências
npm install

# Modo desenvolvimento
npm run dev

# Build de produção
npm run build

# Executar build
npm run start

# Linter
npm run lint
```

### **Deploy:**
```bash
# Deploy completo
./deploy-vps-complete.sh

# Deploy apenas HITL
./deploy-hitl.sh

# Ver logs do container
docker logs oficios-portal-frontend -f

# Reiniciar container
docker restart oficios-portal-frontend
```

### **Banco de Dados:**
```bash
# Popular dados de teste
# Executar SQL no Supabase Dashboard

# Verificar dados
# SELECT * FROM oficios WHERE status = 'AGUARDANDO_COMPLIANCE';

# Limpar dados
# DELETE FROM oficios;
```

---

## 🎯 OBJETIVO FINAL

**Ter o sistema 100% funcional em produção:**

1. ✅ Ambiente configurado (96%)
2. 🔄 Dados de teste populados
3. 🔄 Testes locais executados
4. 🔄 Build de produção gerado
5. 🔄 Deploy no VPS realizado
6. 🔄 Smoke tests em produção
7. 🔄 Sistema validado end-to-end

---

## 📝 NOTAS IMPORTANTES

### **Arquitetura Atual:**
```
Frontend (Next.js + Supabase)
    ↓ API Gateway
Backend (Python/GCP + Firestore)
    ↓ Sincronização
Supabase ↔ Firestore (Dual Write)
```

### **Fluxo Completo:**
```
1. Email → Gmail (marcador INGEST)
2. W1 → OCR + LLM → Firestore + Supabase
3. Dashboard → Mostrar ofício
4. Portal HITL → Revisão humana
5. W3 → Atualizar status
6. W4 → Gerar resposta via RAG
7. Notificação → Resposta pronta
```

### **URLs Importantes:**
- **Frontend:** https://oficio.ness.tec.br
- **Supabase:** https://supabase.com/dashboard
- **Firebase:** https://console.firebase.google.com
- **GCP:** https://console.cloud.google.com

---

## 🆘 TROUBLESHOOTING

### **Se o build falhar:**
```bash
# Limpar cache
rm -rf .next node_modules
npm install
npm run build
```

### **Se o deploy falhar:**
```bash
# Verificar logs
docker logs oficios-portal-frontend

# Reiniciar container
docker restart oficios-portal-frontend

# Re-deploy
./deploy-vps-complete.sh
```

### **Se a autenticação falhar:**
```bash
# Verificar variáveis de ambiente
cat .env.local | grep SUPABASE

# Verificar OAuth no Google Console
# https://console.cloud.google.com/apis/credentials
```

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

O projeto estará 100% completo quando:

- [ ] `npm run build` executa sem erros
- [ ] `npm run start` inicia aplicação
- [ ] Login com Google funciona
- [ ] Dashboard mostra ofícios
- [ ] Portal HITL abre corretamente
- [ ] PDF é renderizado
- [ ] Aprovação dispara W4
- [ ] Deploy no VPS funciona
- [ ] Aplicação acessível via HTTPS

---

## 🎉 RESULTADO ESPERADO

Após executar estes passos, você terá:

✅ **Sistema completo de automação de ofícios judiciais**
✅ **Portal HITL com revisão humana guiada**
✅ **Integração completa Frontend ↔ Backend**
✅ **IA cognitiva com OCR + LLM + RAG**
✅ **Deploy em produção funcionando**
✅ **Documentação completa**

**Transformando 3.5 horas de trabalho manual em 5 minutos automatizados!** 🚀

---

**Próxima ação:** Executar Passo 1 (Popular dados de teste)

**Comando:** Acessar https://supabase.com/dashboard e executar `POPULAR_DADOS_TESTE.sql`

