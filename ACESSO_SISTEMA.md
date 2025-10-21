# 🌐 Como Acessar o Sistema - n.Oficios

**Status:** Sistema ONLINE ✅ | HTTPS aguardando DNS ⏳

---

## ✅ ACESSO FUNCIONANDO AGORA

### **Use o IP direto (HTTP):**
```
http://62.72.8.164:3000
```

**Status:** ✅ **FUNCIONANDO PERFEITAMENTE**

---

## ❌ ERRO 404 - POR QUE ACONTECE?

Se você está vendo `404` ao acessar `https://oficio.ness.tec.br`:

### **Causa:**
O DNS ainda não está configurado. O domínio `oficio.ness.tec.br` não aponta para o servidor.

### **Solução:**
Use o IP direto enquanto DNS não é configurado:
```
http://62.72.8.164:3000  ← USE ESTE!
```

---

## 🔧 CONFIGURAR DNS (Para HTTPS funcionar)

### **Passo 1: Acessar Provedor DNS**

Acesse o painel onde `ness.tec.br` está registrado:
- CloudFlare
- GoDaddy
- Registro.br
- Ou outro provedor

### **Passo 2: Adicionar Registros**

Adicione 2 registros do tipo `A`:

```
Nome: oficio
Host: oficio.ness.tec.br
Tipo: A
Valor: 62.72.8.164
TTL: 300
```

```
Nome: api.oficio
Host: api.oficio.ness.tec.br
Tipo: A
Valor: 62.72.8.164
TTL: 300
```

### **Passo 3: Aguardar Propagação**

Tempo: 5-60 minutos

**Testar se propagou:**
```bash
nslookup oficio.ness.tec.br
# Deve retornar: 62.72.8.164
```

### **Passo 4: HTTPS Automático**

Após DNS propagar:
1. Traefik detecta domínio acessível
2. Solicita certificado Let's Encrypt
3. HTTPS funciona automaticamente! ✅

---

## 📱 ACESSOS DISPONÍVEIS

### **AGORA (sem DNS):**
```
✅ Frontend: http://62.72.8.164:3000
✅ Backend:  http://62.72.8.164:8000
```

### **DEPOIS DO DNS:**
```
✅ Frontend: https://oficio.ness.tec.br
✅ Backend:  https://api.oficio.ness.tec.br
```

---

## 🧪 TESTAR O SISTEMA

### **1. Acesse via HTTP:**
```
http://62.72.8.164:3000
```

### **2. Faça Login:**
- Clique em "Login com Google"
- Autorize acesso
- Você será redirecionado para o dashboard

### **3. Explore:**
- Dashboard SLA
- Portal HITL
- Sistema de Help (botão ?)

---

## ❓ TROUBLESHOOTING

### **Erro: "This site can't be reached"**
**Solução:** Use HTTP em vez de HTTPS
```
http://62.72.8.164:3000  ← Correto
https://62.72.8.164:3000 ← Não funciona ainda
```

### **Erro: "404 Not Found"**
**Causa:** Tentando acessar via domínio sem DNS
**Solução:** Use o IP direto
```
http://62.72.8.164:3000  ← USE ESTE
```

### **Página não carrega:**
**Verificar se containers estão rodando:**
```bash
ssh root@62.72.8.164 'docker ps'
```

Ambos devem estar "Up" e "healthy"

---

## 📋 CHECKLIST ACESSO

```
✅ Usar IP direto: http://62.72.8.164:3000
❌ NÃO usar HTTPS ainda (sem DNS)
❌ NÃO usar domínio ainda (sem DNS)
⏳ Configurar DNS quando possível
⏳ Depois: usar https://oficio.ness.tec.br
```

---

## 🎯 RESUMO

### **Como acessar HOJE:**
1. Abra navegador
2. Digite: `http://62.72.8.164:3000`
3. Faça login com Google
4. ✅ Sistema funcionando!

### **Para HTTPS futuro:**
1. Configure DNS (ver `CONFIGURAR_DNS.md`)
2. Aguarde propagação (5-60 min)
3. Acesse: `https://oficio.ness.tec.br`
4. ✅ HTTPS automático!

---

## 💡 DICA

**Marque nos favoritos:**
```
Nome: n.Oficios
URL:  http://62.72.8.164:3000
```

**Depois do DNS, atualize para:**
```
URL:  https://oficio.ness.tec.br
```

---

## ✅ CONCLUSÃO

**Sistema está 100% FUNCIONAL via HTTP!**

- **URL atual:** http://62.72.8.164:3000 ✅
- **HTTPS futuro:** https://oficio.ness.tec.br (após DNS)
- **Status:** PRODUCTION-READY!

**Use via HTTP agora, configure DNS quando puder.** 🚀

---

**Team All BMAD | Acesso ao Sistema**
