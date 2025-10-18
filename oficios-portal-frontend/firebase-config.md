# Configuração Firebase - n.Oficios

## Domínios Autorizados

Adicione os seguintes domínios no Firebase Console:

### Desenvolvimento Local:
- `localhost:3000`
- `localhost:3001`
- `localhost:3002`
- `localhost:3003`

### Produção:
- `oficio.ness.tec.br`
- `oficios-portal-frontend-491078993287.southamerica-east1.run.app`

## Passos para Configurar:

1. Acesse: https://console.firebase.google.com/u/1/project/officio-474711/authentication/settings
2. Vá em: Authentication → Settings → Authorized domains
3. Clique em "Add domain"
4. Adicione cada domínio da lista acima
5. Salve as alterações

## Configuração Atual:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCrE-O9tnox14nsbtkWpbbnCs42_3ewo9M",
  authDomain: "officio-474711.firebaseapp.com",
  projectId: "officio-474711",
  storageBucket: "officio-474711.firebasestorage.app",
  messagingSenderId: "491078993287",
  appId: "1:491078993287:web:b123a486df583bd2693f22",
};
```

## Teste:

Após adicionar os domínios, teste o login em:
- http://localhost:3000
- http://localhost:3001
- http://localhost:3002
- http://localhost:3003

