import { SignUp } from '@clerk/nextjs';
import { ProductBrand } from '@/components/Logo';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-gray-700/50 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mb-4">
            <ProductBrand product="Oficios" size="lg" variant="light" />
          </div>
          <p className="text-gray-300 text-lg">
            Crie sua conta
          </p>
        </div>
        
        <SignUp 
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
          path="/sign-up"
          signInUrl="/login"
          afterSignUpUrl="/dashboard"
        />

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Plataforma de automação jurídica com conformidade LGPD total
          </p>
        </div>
      </div>
    </div>
  );
}

