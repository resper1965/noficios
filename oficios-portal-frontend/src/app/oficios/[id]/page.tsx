'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOficio } from '@/hooks/useOficios';
import { supabaseService as apiService } from '@/lib/supabase';
import { ProductBrand } from '@/components/Logo';
import {
  ArrowLeft,
  FileText,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Loader2
} from 'lucide-react';

export default function OficioDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { oficio, loading, error } = useOficio(resolvedParams.id);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!oficio || !confirm('Tem certeza que deseja excluir este ofício?')) {
      return;
    }

    try {
      setDeleting(true);
      await apiService.deleteOficio(oficio.id);
      router.push('/oficios');
    } catch (err) {
      alert('Erro ao excluir ofício');
      console.error(err);
      setDeleting(false);
    }
  };

  const handleMarkAsRespondido = async () => {
    if (!oficio) return;

    const resposta = prompt('Informe a resposta do ofício:');
    if (!resposta) return;

    try {
      await apiService.updateOficio(oficio.id, {
        status: 'respondido',
        resposta,
      });
      router.push('/oficios');
    } catch (err) {
      alert('Erro ao atualizar ofício');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !oficio) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/oficios')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-blue-400">Ofício não encontrado</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            {error || 'Ofício não encontrado'}
          </div>
        </main>
      </div>
    );
  }

  const prazoDate = new Date(oficio.prazo);
  const now = new Date();
  const diffMs = prazoDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let prazoText = '';
  let prazoColor = '';
  let statusBadge = null;

  if (oficio.status === 'vencido') {
    const diasVencido = Math.abs(diffDays);
    prazoText = `Vencido há ${diasVencido} dia${diasVencido !== 1 ? 's' : ''}`;
    prazoColor = 'text-red-400';
    statusBadge = (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-900/50 text-red-400 border border-red-700">
        <AlertCircle className="h-4 w-4 mr-2" />
        Vencido
      </span>
    );
  } else if (oficio.status === 'respondido') {
    prazoText = 'Concluído';
    prazoColor = 'text-green-400';
    statusBadge = (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-900/50 text-green-400 border border-green-700">
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Respondido
      </span>
    );
  } else {
    prazoText = diffDays <= 1 ? (diffDays === 0 ? 'Vence hoje' : `${diffDays} dia`) : `${diffDays} dias restantes`;
    prazoColor = diffDays <= 1 ? 'text-red-400' : diffDays <= 3 ? 'text-yellow-400' : 'text-green-400';
    statusBadge = (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/50 text-blue-400 border border-blue-700">
        <Clock className="h-4 w-4 mr-2" />
        Ativo
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/oficios')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-blue-400">Detalhes do Ofício</h1>
          </div>
          <div className="flex items-center space-x-2">
            {oficio.status !== 'respondido' && (
              <button
                onClick={handleMarkAsRespondido}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Marcar como Respondido</span>
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span>{deleting ? 'Excluindo...' : 'Excluir'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-blue-900/40 to-blue-800/40 px-6 py-8 border-b border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Ofício #{oficio.numero}</h2>
                {statusBadge}
              </div>
              <div className={`text-right ${prazoColor}`}>
                <p className="text-2xl font-bold">{prazoText}</p>
                <p className="text-sm text-gray-400">
                  {prazoDate.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-6 space-y-6">
            {/* Processo */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-medium text-gray-400 uppercase">Processo</h3>
              </div>
              <p className="text-lg text-white">{oficio.processo}</p>
            </div>

            {/* Autoridade */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Building2 className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-medium text-gray-400 uppercase">Autoridade</h3>
              </div>
              <p className="text-lg text-white">{oficio.autoridade}</p>
            </div>

            {/* Descrição */}
            {oficio.descricao && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Descrição</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{oficio.descricao}</p>
              </div>
            )}

            {/* Resposta */}
            {oficio.resposta && (
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-400 uppercase mb-2">Resposta</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{oficio.resposta}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-6 border-t border-gray-700 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Criado em</p>
                <p className="text-white">
                  {new Date(oficio.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Última atualização</p>
                <p className="text-white">
                  {new Date(oficio.updatedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

