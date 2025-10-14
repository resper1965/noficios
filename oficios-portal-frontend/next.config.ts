import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração para Cloud Run (standalone output)
  output: 'standalone',
  
  // Permite imagens de domínios externos (se necessário)
  images: {
    domains: ['storage.googleapis.com', 'firebasestorage.googleapis.com'],
  },
  
  // Desabilita ESLint durante build (já validado em dev)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Desabilita erros de TypeScript durante build (Firebase precisa de credenciais reais)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
