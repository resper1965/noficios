'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsPlatformAdmin, useAuth } from '@/hooks/useAuth';
import CreateOrganizationForm from './components/CreateOrganizationForm';
import { Shield } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function GovernancePage() {
  const router = useRouter();
  const { loading } = useAuth();
  const isPlatformAdmin = useIsPlatformAdmin();

  useEffect(() => {
    // Redireciona se não for Platform Admin
    if (!loading && !isPlatformAdmin) {
      router.push('/dashboard');
    }
  }, [loading, isPlatformAdmin, router]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Acesso negado
  if (!isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-4">
            Esta página é restrita a administradores da plataforma.
          </p>
          <p className="text-sm text-muted-foreground">
            Role necessário: <code className="bg-muted px-2 py-1 rounded">platform_admin</code>
          </p>
        </div>
      </div>
    );
  }

  // Conteúdo da página (apenas para Platform Admin)
  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader
        title="Administração de Plataforma"
        subtitle="Gestão de tenants e configurações globais do sistema"
        icon={<Shield className="h-8 w-8" />}
      />

      {/* Seções */}
      <div className="space-y-8">
        {/* Cadastro de Organização */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-1">Cadastro de Tenants</h2>
            <p className="text-sm text-muted-foreground">
              Crie novas organizações na plataforma com isolamento completo de dados
            </p>
          </div>
          
          <CreateOrganizationForm />
        </section>

        {/* Outras seções (placeholder) */}
        <section className="mt-12">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-1">Organizações Ativas</h2>
            <p className="text-sm text-muted-foreground">
              Lista de todas as organizações cadastradas
            </p>
          </div>
          
          <div className="p-8 rounded-lg border border-dashed border-muted-foreground/30 text-center">
            <p className="text-muted-foreground">
              Componente de listagem em desenvolvimento
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}



