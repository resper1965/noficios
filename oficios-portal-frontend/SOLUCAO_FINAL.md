# 🔥 FIREBASE - SOLUÇÃO FINAL

## ❌ ERRO:
```
Firebase: Error (auth/requests-from-referer-http://localhost:3000-are-blocked.)
```

## ✅ SOLUÇÃO RÁPIDA (3 PASSOS):

### 1️⃣ ABRA O DIAGNÓSTICO:
No navegador, abra o arquivo:
```
check-firebase-config.html
```

### 2️⃣ EXECUTE O TESTE:
- Clique em "Executar Diagnóstico Completo"
- Veja se o Status HTTP é 200 ou 403

### 3️⃣ SE FOR 403, FAÇA ISSO:

**A. Verifique Firebase Console:**
URL: https://console.firebase.google.com/u/1/project/officio-474711/authentication/settings

Em "Authorized domains", deve ter EXATAMENTE:
```
localhost
```

**NÃO pode ter:**
- localhost:3000
- http://localhost
- Qualquer coisa com porta

**B. Verifique API Key no Google Cloud:**
URL: https://console.cloud.google.com/apis/credentials?project=officio-474711

Procure a key: AIzaSyCrE-O9tnox14nsbtkWpbbnCs42_3ewo9M

**Opção 1 (mais fácil):**
- Application restrictions: **None**

**Opção 2 (mais segura):**
- Application restrictions: **HTTP referrers**
- Adicione: `http://localhost/*`

**C. Aguarde e Limpe Cache:**
1. Aguarde 1-2 minutos após salvar
2. Pressione Ctrl+Shift+Delete
3. Limpe todo o cache
4. Feche e abra o navegador
5. Teste novamente

---

## 📞 VERIFICAÇÃO FINAL:

Execute no terminal:
```bash
cd /home/resper/noficios/oficios-portal-frontend
npm run dev
```

Abra: http://localhost:3000

Clique em "Continuar com Google"

**Se ainda der erro 403:**
- Tire print da seção "Authorized domains" do Firebase
- Tire print das restrições da API Key no Google Cloud
- Me envie os prints

---

## 🎯 ARQUIVOS DE AJUDA:

- **check-firebase-config.html** → Diagnóstico interativo
- **SOLUCAO_AVANCADA.md** → Guia completo com todas as soluções
- **FIREBASE_FIX_AGORA.md** → Guia rápido

---

**Execute o diagnóstico agora!**
