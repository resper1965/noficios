'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { SignIn } from '@clerk/nextjs';
import { ProductBrand } from '@/components/Logo';

export default function LoginPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-gray-700/50 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mb-4">
            <ProductBrand product="Oficios" size="lg" variant="light" />
          </div>
          <p className="text-gray-300 text-lg">
            Acesse sua conta para continuar
          </p>
        </div>
        
        <div className="clerk-signin-wrapper">
          <SignIn 
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-transparent shadow-none',
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                socialButtonsBlockButton: 'bg-gray-700 hover:bg-gray-600 border-gray-600',
                formFieldInput: 'bg-gray-700/50 border-gray-600 text-white',
                footerActionLink: 'text-blue-400 hover:text-blue-300',
              }
            }}
            routing="path"
            path="/login"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
          />
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Plataforma de automação jurídica com conformidade LGPD total
          </p>
        </div>
      </div>
    </div>
  );
}