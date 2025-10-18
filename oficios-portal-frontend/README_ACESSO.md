# 🌐 n.Oficios - Acesso e Deploy

## 📍 COMO ACESSAR A APLICAÇÃO

### ✅ URL OFICIAL (VPS):
👉 **https://oficio.ness.tec.br**

### ✅ Páginas disponíveis:
- **Login:** https://oficio.ness.tec.br/login
- **Dashboard:** https://oficio.ness.tec.br/dashboard
- **Ofícios:** https://oficio.ness.tec.br/oficios

---

## ⚠️ IMPORTANTE: App roda APENAS na VPS

### ✅ Ambiente de Produção (VPS):
- **Servidor:** 62.72.8.164
- **Container:** oficios-frontend
- **URL:** https://oficio.ness.tec.br
- **Status:** ✅ Sempre rodando

### ❌ Não há ambiente local:
- ❌ Não execute `npm run dev`
- ❌ Não use `localhost:3000`
- ✅ Desenvolva e teste direto na VPS

---

## 🔧 WORKFLOW DE DESENVOLVIMENTO

### 1️⃣ Editar código localmente
```bash
# Edite os arquivos em:
cd /home/resper/noficios/oficios-portal-frontend/src
```

### 2️⃣ Commit no Git
```bash
git add .
git commit -m "sua mensagem"
git push origin main
```

### 3️⃣ Deploy na VPS
```bash
cd /home/resper/noficios/oficios-portal-frontend
./deploy-vps-complete.sh
```

### 4️⃣ Testar
```
https://oficio.ness.tec.br/login
```

---

## 🚀 SCRIPT DE DEPLOY

O script `deploy-vps-complete.sh` faz:
1. ✅ Copia código para VPS
2. ✅ Faz build da aplicação
3. ✅ Reconstrói container Docker
4. ✅ Reinicia aplicação
5. ✅ Pronto para usar!

**Tempo:** ~2 minutos

---

## 🔑 AUTENTICAÇÃO

### Opções de Login:
1. **Google OAuth** - Continuar com Google
2. **Email/Senha** - Continuar com E-mail

### Configurações:
- **Google Cloud Project:** oficio-noficios
- **Supabase Project:** ghcqywthubgfenqqxoqb
- **OAuth Client ID:** 746454720729-9hcr81d9og47uhlls8dsiljnnill5k1v...

---

## 📊 MONITORAMENTO

### Ver logs da aplicação:
```bash
ssh root@62.72.8.164
cd /opt/oficios
docker compose logs -f oficios-frontend
```

### Reiniciar aplicação:
```bash
ssh root@62.72.8.164
cd /opt/oficios
docker compose restart oficios-frontend
```

### Ver status:
```bash
ssh root@62.72.8.164
docker ps | grep oficios
```

---

## 🆘 TROUBLESHOOTING

### App não carrega:
```bash
ssh root@62.72.8.164
cd /opt/oficios
docker compose restart
```

### Erro de autenticação:
- Verifique: `CORRIGIR_REDIRECT_URI.md`
- Verifique: `CONFIGURAR_GOOGLE_SUPABASE.md`

### Deploy falhou:
```bash
# Execute novamente:
./deploy-vps-complete.sh
```

---

## 📚 DOCUMENTAÇÃO

- **Autenticação:** `AUTENTICACAO_SUPABASE.md`
- **OAuth Config:** `CONFIGURAR_OAUTH_NOVO_PROJETO.md`
- **Redirect URI:** `CORRIGIR_REDIRECT_URI.md`
- **Checklist:** `CHECKLIST_FINAL.md`
- **Debug:** `DEBUG_AUTENTICACAO.md`

---

## 🎯 LINKS ÚTEIS

- **App Produção:** https://oficio.ness.tec.br
- **Supabase Dashboard:** https://supabase.com/dashboard/project/ghcqywthubgfenqqxoqb
- **Google Cloud Console:** https://console.cloud.google.com/apis/credentials?project=oficio-noficios
- **GitHub Repo:** https://github.com/resper1965/noficios

---

**✅ Use sempre https://oficio.ness.tec.br para acessar!**

