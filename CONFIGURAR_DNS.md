# 🌐 Configuração DNS - n.Oficios

**Status:** ⚠️ DNS NÃO CONFIGURADO (bloqueia HTTPS)

---

## 🔴 PROBLEMA IDENTIFICADO

O Traefik está configurado corretamente, mas o DNS não aponta para o servidor.

**Erro no log:**
```
DNS problem: NXDOMAIN looking up A for api.oficio.ness.tec.br
DNS problem: NXDOMAIN looking up A for oficio.ness.tec.br
```

**Significado:** Os domínios não existem no DNS.

---

## ✅ SOLUÇÃO: Configurar DNS

### **Passo 1: Acessar Provedor DNS**

Acesse o painel onde `ness.tec.br` está registrado (ex: CloudFlare, GoDaddy, Registro.br, etc.)

### **Passo 2: Adicionar Registros A**

Adicione 2 registros do tipo `A`:

```
Nome: oficio.ness.tec.br
Tipo: A
Valor: 62.72.8.164
TTL: 300 (5 minutos)
```

```
Nome: api.oficio.ness.tec.br
Tipo: A
Valor: 62.72.8.164
TTL: 300 (5 minutos)
```

### **Passo 3: Aguardar Propagação**

- **Tempo:** 5-60 minutos
- **Teste:** `nslookup oficio.ness.tec.br`

### **Passo 4: Traefik Auto-Obtém Certificado**

Quando DNS propagar:
1. Traefik detecta domínio acessível
2. Solicita certificado Let's Encrypt automaticamente
3. HTTPS funciona! ✅

---

## 🧪 TESTAR DNS

### **Verificar se DNS propagou:**
```bash
# Testar resolução DNS
nslookup oficio.ness.tec.br
nslookup api.oficio.ness.tec.br

# Ou usar dig
dig oficio.ness.tec.br +short
dig api.oficio.ness.tec.br +short

# Deve retornar: 62.72.8.164
```

### **Testar HTTPS:**
```bash
# Aguardar 2 minutos após DNS propagar
curl -I https://oficio.ness.tec.br

# Deve retornar: 200 OK (após certificado emitido)
```

---

## ⏱️ TIMELINE

```
Agora:        DNS não configurado ❌
            ↓
5-60 min:     Adicionar registros A
            ↓
+5 min:       DNS propagado ✅
            ↓
+2 min:       Traefik obtém certificado ✅
            ↓
Final:        HTTPS funcionando! ✅
```

**Tempo total:** ~10-70 minutos

---

## 📋 CHECKLIST

```
[ ] 1. Acessar provedor DNS (onde ness.tec.br está)
[ ] 2. Adicionar: oficio.ness.tec.br → 62.72.8.164
[ ] 3. Adicionar: api.oficio.ness.tec.br → 62.72.8.164
[ ] 4. Aguardar 5-60 min (propagação)
[ ] 5. Testar: nslookup oficio.ness.tec.br
[ ] 6. Aguardar 2 min (Traefik obtém cert)
[ ] 7. Testar: https://oficio.ness.tec.br
[ ] 8. ✅ HTTPS funcionando!
```

---

## 🎯 ENQUANTO ISSO...

### **Sistema JÁ está funcionando via HTTP:**
```
http://62.72.8.164:3000  →  Frontend ✅
http://62.72.8.164:8000  →  Backend ✅
```

### **Após configurar DNS:**
```
https://oficio.ness.tec.br      →  Frontend ✅
https://api.oficio.ness.tec.br  →  Backend ✅
```

---

## 💡 DICA

Se não tiver acesso ao DNS de `ness.tec.br`:

### **Opção A: Usar subdomínio que você controle**
```yaml
# docker-compose.vps.yml
labels:
  - "traefik.http.routers.frontend.rule=Host(`oficios.seudominio.com`)"
```

### **Opção B: Usar IP + porta (atual)**
- Funciona, mas sem HTTPS automático
- Menos profissional
- `http://62.72.8.164:3000`

---

## ✅ RESUMO

**Problema:** DNS não configurado  
**Solução:** Adicionar 2 registros A no provedor DNS  
**Tempo:** 10-70 minutos  
**Resultado:** HTTPS automático com Let's Encrypt ✅

**Sistema já está PRONTO, só aguardando DNS!** 🚀

---

**Team All BMAD | Configuração DNS**
