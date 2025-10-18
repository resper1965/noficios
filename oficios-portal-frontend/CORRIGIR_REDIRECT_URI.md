# 🚨 CORRIGIR ERRO: redirect_uri_mismatch

## ❌ ERRO ATUAL:
```
Erro 400: redirect_uri_mismatch
Não é possível fazer login porque n.Oficios enviou uma solicitação inválida
```

## 🎯 CAUSA:
O OAuth Client que você criou via console **NÃO TEM** as redirect URIs do Supabase configuradas!

---

## ✅ SOLUÇÃO (2 minutos):

### PASSO 1: Abrir OAuth Client no Google

👉 **LINK DIRETO:** https://console.cloud.google.com/apis/credentials?project=oficio-noficios

---

### PASSO 2: Editar o Client correto

Na lista de credenciais, procure por:
- **Nome:** `n.Oficios Web Client`
- **Client ID:** `746454720729-9hcr81d9og47uhlls8dsiljnnill5k1v...`

Clique no **ícone de lápis** ✏️ para editar

---

### PASSO 3: Adicionar Redirect URIs

Role até a seção **"Authorized redirect URIs"**

#### Clique em "+ ADD URI" e adicione CADA UMA destas URLs:

```
https://ghcqywthubgfenqqxoqb.supabase.co/auth/v1/callback
```

```
http://localhost:3000/auth/callback
```

```
https://oficio.ness.tec.br/auth/callback
```

**IMPORTANTE:** Cole cada URL **separadamente** clicando em "+ ADD URI" para cada uma!

---

### PASSO 4: Adicionar JavaScript Origins (opcional mas recomendado)

Role até **"Authorized JavaScript origins"**

#### Clique em "+ ADD URI" e adicione:

```
https://ghcqywthubgfenqqxoqb.supabase.co
```

```
http://localhost:3000
```

```
https://oficio.ness.tec.br
```

---

### PASSO 5: Salvar

1. Clique no botão azul **"SAVE"** no final da página
2. Aguarde a confirmação

---

## 🧪 TESTAR

1. **Aguarde 1-2 minutos** (propagação das configurações)
2. **Limpe o cache** do navegador (Ctrl+Shift+Delete)
   - Ou use **aba anônima** (Ctrl+Shift+N)
3. Acesse: https://oficio.ness.tec.br/login
4. Clique: **"Continuar com Google"**
5. ✅ Deve funcionar agora!

---

## 📸 VERIFICAÇÃO

Após configurar, você deve ver algo assim:

```
Authorized redirect URIs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
https://ghcqywthubgfenqqxoqb.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback  
https://oficio.ness.tec.br/auth/callback

Authorized JavaScript origins
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
https://ghcqywthubgfenqqxoqb.supabase.co
http://localhost:3000
https://oficio.ness.tec.br
```

---

## ⚠️ IMPORTANTE

### Se mesmo assim der erro:

1. **Verifique se está editando o OAuth Client CORRETO**
   - Deve ser o "Web application"
   - Client ID: `746454720729-9hcr81d9og47uhlls8dsiljnnill5k1v...`

2. **Certifique-se de SALVAR** após adicionar as URIs

3. **Aguarde 1-2 minutos** para propagação

4. **Limpe cache** ou use aba anônima

---

## 🔍 POR QUE ISSO ACONTECEU?

Você criou o OAuth Client pelo console, mas o formulário web do Google **NÃO preenche automaticamente** as redirect URIs.

Você precisa adicionar **manualmente** cada URL que o Supabase vai usar para redirecionar após o login.

---

## 📋 CHECKLIST

- [ ] Acessei https://console.cloud.google.com/apis/credentials?project=oficio-noficios
- [ ] Encontrei "n.Oficios Web Client"
- [ ] Cliquei no ícone de lápis ✏️
- [ ] Adicionei as 3 redirect URIs (uma por vez)
- [ ] Adicionei as 3 JavaScript origins (uma por vez)
- [ ] Cliquei em "SAVE"
- [ ] Aguardei 1-2 minutos
- [ ] Limpei cache do navegador
- [ ] Testei login com Google
- [ ] ✅ Funcionou!

---

**🚀 Depois de configurar, teste e me avise!**

