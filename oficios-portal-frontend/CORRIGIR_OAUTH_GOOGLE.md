# 🔧 CORRIGIR ERRO: redirect_uri_mismatch

## 🚨 PROBLEMA

```
Erro 400: redirect_uri_mismatch
Acesso bloqueado: a solicitação do app n.Oficios é inválida
```

Este erro ocorre porque o **Google Cloud Console** não tem a URL de redirecionamento do Supabase configurada.

---

## ✅ SOLUÇÃO RÁPIDA (5 minutos)

### PASSO 1: Abrir Google Cloud Console

Acesse: https://console.cloud.google.com/

1. Faça login com: **resper@bekaa.eu**
2. Selecione o projeto: **officio-474711** (ou o projeto correto)

---

### PASSO 2: Acessar Credenciais OAuth

No menu lateral:
1. Clique em **"APIs & Services"**
2. Clique em **"Credentials"** (Credenciais)

Ou acesse diretamente:
https://console.cloud.google.com/apis/credentials

---

### PASSO 3: Editar OAuth 2.0 Client ID

Na lista de credenciais:
1. Encontre o **"OAuth 2.0 Client IDs"** (pode ter nome como "Web client" ou "n.Oficios")
2. Clique no **ícone de lápis** ✏️ para editar

---

### PASSO 4: Adicionar URIs de Redirecionamento

Na seção **"Authorized redirect URIs"**:

#### ✅ URLs QUE DEVEM ESTAR CONFIGURADAS:

```
https://ghcqywthubgfenqqxoqb.supabase.co/auth/v1/callback
http://localhost:3000/api/auth/callback
https://oficio.ness.tec.br/api/auth/callback
```

#### Como adicionar:
1. Clique em **"+ ADD URI"**
2. Cole cada URL acima (uma por vez)
3. Clique em **"SAVE"** (Salvar)

---

### PASSO 5: Adicionar JavaScript Origins (Opcional mas Recomendado)

Na seção **"Authorized JavaScript origins"**:

```
https://ghcqywthubgfenqqxoqb.supabase.co
http://localhost:3000
https://oficio.ness.tec.br
```

1. Clique em **"+ ADD URI"**
2. Cole cada URL
3. Clique em **"SAVE"**

---

## 🧪 TESTAR

### Teste 1: Localhost
1. Acesse: http://localhost:3000/login
2. Clique em "Continuar com Google"
3. ✅ Deve funcionar sem erro 400

### Teste 2: Produção
1. Acesse: https://oficio.ness.tec.br/login
2. Clique em "Continuar com Google"
3. ✅ Deve funcionar sem erro 400

---

## 📸 VERIFICAÇÃO VISUAL

Após configurar, sua tela deve mostrar algo assim:

```
Authorized redirect URIs
[x] https://ghcqywthubgfenqqxoqb.supabase.co/auth/v1/callback
[x] http://localhost:3000/api/auth/callback
[x] https://oficio.ness.tec.br/api/auth/callback

Authorized JavaScript origins
[x] https://ghcqywthubgfenqqxoqb.supabase.co
[x] http://localhost:3000
[x] https://oficio.ness.tec.br
```

---

## ⚠️ IMPORTANTE

1. **Aguarde 1-2 minutos** após salvar as alterações no Google Console
2. **Limpe o cache do navegador** ou use aba anônima para testar
3. Se ainda der erro, verifique se está usando o projeto correto no Google Console

---

## 🔍 TROUBLESHOOTING

### Erro persiste após configurar?

1. **Verifique o projeto no Google Console**:
   - Tem certeza que está editando o projeto correto?
   - O Project ID é: `officio-474711`

2. **Verifique as credenciais no Supabase**:
   - Acesse: https://supabase.com/dashboard/project/ghcqywthubgfenqqxoqb/auth/providers
   - Verifique se o **Client ID** e **Client Secret** do Google estão preenchidos

3. **Teste com curl**:
   ```bash
   curl -I https://ghcqywthubgfenqqxoqb.supabase.co/auth/v1/callback
   ```
   Deve retornar `200` ou `405` (não `404`)

---

## 📚 LINKS ÚTEIS

- **Google Console**: https://console.cloud.google.com/apis/credentials
- **Supabase Auth**: https://supabase.com/dashboard/project/ghcqywthubgfenqqxoqb/auth/providers
- **Docs Google OAuth**: https://developers.google.com/identity/protocols/oauth2

---

**✅ Após seguir estes passos, o login com Google deve funcionar perfeitamente!**

