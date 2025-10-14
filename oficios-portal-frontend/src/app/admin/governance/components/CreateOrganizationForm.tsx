'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { createApiClient } from '@/lib/api';
import { Building2, Mail, Globe, Cpu } from 'lucide-react';

interface FormData {
  name: string;
  email_domains: string;
  admin_email: string;
  notification_email: string;
  config_llm_model: string;
}

export default function CreateOrganizationForm() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      config_llm_model: 'llama-3.1-8b-instant'
    }
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Converte string de domínios em array
      const email_domains = data.email_domains
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0);

      if (email_domains.length === 0) {
        throw new Error('Informe pelo menos um domínio de email');
      }

      // Valida formato de domínios
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z0-9-.]+$/;
      for (const domain of email_domains) {
        if (!domainRegex.test(domain)) {
          throw new Error(`Domínio inválido: ${domain}`);
        }
      }

      // Prepara payload
      const payload = {
        name: data.name,
        email_domains,
        admin_email: data.admin_email,
        notification_email: data.notification_email || data.admin_email,
        config_llm_model: data.config_llm_model,
      };

      // Chama API
      const apiClient = createApiClient(getToken);
      const response = await apiClient.post<any>('create_organization', payload);

      console.log('Organização criada:', response);

      // Sucesso
      setSuccess(true);
      reset();

      // Limpa mensagem de sucesso após 5 segundos
      setTimeout(() => setSuccess(false), 5000);

    } catch (err: any) {
      console.error('Erro ao criar organização:', err);
      setError(err.message || 'Erro ao criar organização');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Cadastro de Nova Organização
        </CardTitle>
        <CardDescription>
          Crie um novo tenant na plataforma. Cada organização terá isolamento completo de dados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nome da Organização */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Nome da Organização *
            </Label>
            <Input
              id="name"
              {...register('name', { required: 'Nome é obrigatório' })}
              placeholder="Empresa XYZ Ltda"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Domínios */}
          <div className="space-y-2">
            <Label htmlFor="email_domains" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Domínios de Email *
            </Label>
            <Input
              id="email_domains"
              {...register('email_domains', { required: 'Domínios são obrigatórios' })}
              placeholder="empresa.com.br, empresa.com"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Separe múltiplos domínios por vírgula. Exemplo: xyz.com.br, xyz.com
            </p>
            {errors.email_domains && (
              <p className="text-sm text-red-500">{errors.email_domains.message}</p>
            )}
          </div>

          {/* Email do Admin */}
          <div className="space-y-2">
            <Label htmlFor="admin_email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email do Administrador *
            </Label>
            <Input
              id="admin_email"
              type="email"
              {...register('admin_email', { 
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email inválido'
                }
              })}
              placeholder="admin@empresa.com.br"
              disabled={loading}
            />
            {errors.admin_email && (
              <p className="text-sm text-red-500">{errors.admin_email.message}</p>
            )}
          </div>

          {/* Email de Notificação */}
          <div className="space-y-2">
            <Label htmlFor="notification_email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email de Notificação
            </Label>
            <Input
              id="notification_email"
              type="email"
              {...register('notification_email')}
              placeholder="compliance@empresa.com.br (opcional)"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Se não informado, será usado o email do administrador
            </p>
          </div>

          {/* Modelo LLM Padrão */}
          <div className="space-y-2">
            <Label htmlFor="config_llm_model" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Modelo LLM Padrão
            </Label>
            <select
              id="config_llm_model"
              {...register('config_llm_model')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              <option value="llama-3.1-8b-instant">Llama 3.1 8B (Rápido, Econômico)</option>
              <option value="llama-3.1-70b-versatile">Llama 3.1 70B (Alto Desempenho)</option>
              <option value="gpt-4o-mini">GPT-4o Mini (Premium)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Modelo usado para extração e composição de respostas
            </p>
          </div>

          {/* Mensagens de feedback */}
          {success && (
            <div className="p-4 rounded-md bg-green-50 border border-green-200">
              <p className="text-sm text-green-800 font-medium">
                ✓ Organização criada com sucesso!
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-800 font-medium">
                ✗ {error}
              </p>
            </div>
          )}

          {/* Botão de submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Criando...' : 'Criar Organização'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}





