// Teste Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCrE-O9tnox14nsbtkWpbbnCs42_3ewo9M",
  authDomain: "officio-474711.firebaseapp.com",
  projectId: "officio-474711",
  storageBucket: "officio-474711.firebasestorage.app",
  messagingSenderId: "491078993287",
  appId: "1:491078993287:web:b123a486df583bd2693f22",
};

console.log('Firebase Config:', firebaseConfig);
console.log('Current domain:', window.location.hostname);
console.log('Current port:', window.location.port);
console.log('Full URL:', window.location.href);

// Teste de conectividade
fetch(`https://identitytoolkit.googleapis.com/v1/projects?key=${firebaseConfig.apiKey}`)
  .then(response => {
    console.log('Firebase API Status:', response.status);
    if (response.status === 403) {
      console.error('❌ Domínio não autorizado. Adicione localhost:3000 no Firebase Console');
    } else if (response.status === 200) {
      console.log('✅ Firebase API funcionando');
    }
  })
  .catch(error => {
    console.error('❌ Erro de conectividade:', error);
  });

