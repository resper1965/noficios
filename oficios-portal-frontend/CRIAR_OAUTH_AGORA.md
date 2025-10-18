# ⚡ CRIAR OAUTH 2.0 CLIENT - 5 MINUTOS

## ✅ JÁ FEITO:
- ✅ Projeto criado: `oficio-noficios`
- ✅ OAuth Brand configurado: "n.Oficios"
- ✅ APIs habilitadas

## 🚀 FAÇA AGORA (5 passos rápidos):

### LINK DIRETO:
👉 **https://console.cloud.google.com/apis/credentials/oauthclient?project=oficio-noficios**

---

### PASSO 1: Tipo de Aplicação
- Selecione: **Web application**

### PASSO 2: Nome
- Digite: **n.Oficios Web Client**

### PASSO 3: JavaScript Origins
Clique em "+ ADD URI" e adicione (um por linha):

```
http://localhost:3000
https://oficio.ness.tec.br
https://ghcqywthubgfenqqxoqb.supabase.co
```

### PASSO 4: Redirect URIs
Clique em "+ ADD URI" e adicione (um por linha):

```
https://ghcqywthubgfenqqxoqb.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
https://oficio.ness.tec.br/auth/callback
```

### PASSO 5: Criar
- Clique em **"CREATE"**
- Uma janela popup vai aparecer com:
  - **Client ID:** (copie isso)
  - **Client Secret:** (copie isso)

---

## 📋 DEPOIS DE COPIAR AS CREDENCIAIS:

### Configure no Supabase:
👉 **https://supabase.com/dashboard/project/ghcqywthubgfenqqxoqb/auth/providers**

1. Encontre **Google** na lista
2. Clique para expandir
3. **Habilite** o toggle
4. Cole:
   - **Client ID:** (do passo 5)
   - **Client Secret:** (do passo 5)
5. Clique **"Save"**

---

## 🧪 TESTAR:

### Desenvolvimento:
```bash
cd oficios-portal-frontend
npm run dev
```
Abra: http://localhost:3000/login
Clique: "Continuar com Google"

### Produção:
Abra: https://oficio.ness.tec.br/login
Clique: "Continuar com Google"

---

## ✅ CHECKLIST:

- [ ] Abrir link direto do OAuth Client
- [ ] Configurar tipo "Web application"
- [ ] Adicionar 3 JavaScript Origins
- [ ] Adicionar 3 Redirect URIs
- [ ] Copiar Client ID e Secret
- [ ] Configurar no Supabase
- [ ] Testar login

---

**⏱️ Tempo total: 5 minutos**
**🎉 Depois disso: Login 100% funcional!**

