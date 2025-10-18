'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle, XCircle, Plus, X, User } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ReviewData {
  numero_oficio?: string;
  numero_processo?: string;
  autoridade_emissora?: string;
  prazo_resposta?: string;
  descricao?: string;
  contexto?: string;
  notas?: string;
  referencias?: string[];
  responsavel?: string;
}

interface ComplianceReviewFormProps {
  initialData: {
    numero_oficio?: string;
    numero_processo?: string;
    autoridade_emissora?: string;
    prazo_resposta?: string;
    descricao?: string;
  };
  confidences?: Record<string, number>;
  onSave: (data: ReviewData) => Promise<void>;
  onApprove: (data: ReviewData) => Promise<void>;
  onReject: (motivo: string) => Promise<void>;
}

export function ComplianceReviewForm({
  initialData,
  confidences = {},
  onSave,
  onApprove,
  onReject,
}: ComplianceReviewFormProps) {
  const [formData, setFormData] = useState(initialData);
  const [contexto, setContexto] = useState('');
  const [notas, setNotas] = useState('');
  const [referencias, setReferencias] = useState<string[]>([]);
  const [novaReferencia, setNovaReferencia] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [saving, setSaving] = useState(false);
  const [usuarios, setUsuarios] = useState<Array<{ id: string; nome: string; email: string }>>([]);

  // Carregar lista de usuários
  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) return;

      const response = await fetch('/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.usuarios || []);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddReferencia = () => {
    if (novaReferencia.trim()) {
      setReferencias(prev => [...prev, novaReferencia.trim()]);
      setNovaReferencia('');
    }
  };

  const handleRemoveReferencia = (index: number) => {
    setReferencias(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveRascunho = async () => {
    setSaving(true);
    try {
      await onSave({
        ...formData,
        contexto,
        notas,
        referencias,
        responsavel,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAprovar = async () => {
    setSaving(true);
    try {
      await onApprove({
        ...formData,
        contexto,
        notas,
        referencias,
        responsavel,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRejeitar = async () => {
    if (!motivoRejeicao.trim()) {
      alert('Por favor, informe o motivo da rejeição');
      return;
    }

    setSaving(true);
    try {
      await onReject(motivoRejeicao);
      setShowRejectModal(false);
    } finally {
      setSaving(false);
    }
  };

  const getFieldConfidence = (field: string) => {
    return (confidences[field] || 0) * 100;
  };

  const isFieldLowConfidence = (field: string) => {
    return getFieldConfidence(field) < 80;
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">✏️  Corrigir e Enriquecer</h3>
        <p className="text-sm text-gray-400 mt-1">
          Revise os dados extraídos e adicione contexto jurídico
        </p>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Dados Principais */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Dados Principais *
          </h4>

          {/* Número Ofício */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Número do Ofício *
              {isFieldLowConfidence('numero_oficio') && (
                <span className="ml-2 text-xs text-yellow-400">
                  ⚠️  Confiança {Math.round(getFieldConfidence('numero_oficio'))}%
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.numero_oficio || ''}
              onChange={(e) => handleFieldChange('numero_oficio', e.target.value)}
              className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 transition-all ${
                isFieldLowConfidence('numero_oficio')
                  ? 'border-yellow-500 focus:ring-yellow-500/50'
                  : 'border-gray-600 focus:ring-blue-500/50'
              }`}
              placeholder="Ex: 12345"
              required
            />
          </div>

          {/* Número Processo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Número do Processo *
              {isFieldLowConfidence('numero_processo') && (
                <span className="ml-2 text-xs text-yellow-400">
                  ⚠️  Confiança {Math.round(getFieldConfidence('numero_processo'))}%
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.numero_processo || ''}
              onChange={(e) => handleFieldChange('numero_processo', e.target.value)}
              className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 transition-all ${
                isFieldLowConfidence('numero_processo')
                  ? 'border-yellow-500 focus:ring-yellow-500/50'
                  : 'border-gray-600 focus:ring-blue-500/50'
              }`}
              placeholder="Ex: 1234567-89.2024.1.00.0000"
              required
            />
          </div>

          {/* Autoridade */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Autoridade Emissora *
              {isFieldLowConfidence('autoridade_emissora') && (
                <span className="ml-2 text-xs text-yellow-400">
                  ⚠️  Confiança {Math.round(getFieldConfidence('autoridade_emissora'))}%
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.autoridade_emissora || ''}
              onChange={(e) => handleFieldChange('autoridade_emissora', e.target.value)}
              className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 transition-all ${
                isFieldLowConfidence('autoridade_emissora')
                  ? 'border-yellow-500 focus:ring-yellow-500/50'
                  : 'border-gray-600 focus:ring-blue-500/50'
              }`}
              placeholder="Ex: Tribunal Regional Federal da 1ª Região"
              required
            />
          </div>

          {/* Prazo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prazo de Resposta *
            </label>
            <input
              type="date"
              value={formData.prazo_resposta?.split('T')[0] || ''}
              onChange={(e) => handleFieldChange('prazo_resposta', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição Resumida
            </label>
            <textarea
              value={formData.descricao || ''}
              onChange={(e) => handleFieldChange('descricao', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Resumo do que o ofício solicita..."
            />
          </div>
        </div>

        {/* Contexto Jurídico */}
        <div className="space-y-4 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
            <span>📚 Contexto Jurídico</span>
            <span className="text-xs normal-case text-gray-500">(Opcional)</span>
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Informações Adicionais
            </label>
            <textarea
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Ex: Este processo já teve decisão favorável em 2023. Precedente: Processo 123456-78.2023..."
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Adicione contexto que ajudará a IA a gerar uma resposta mais precisa
            </p>
          </div>

          {/* Referências Legais */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Referências Legais
            </label>
            
            {referencias.length > 0 && (
              <div className="space-y-2 mb-3">
                {referencias.map((ref, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded-lg"
                  >
                    <span className="text-sm text-gray-300">• {ref}</span>
                    <button
                      onClick={() => handleRemoveReferencia(index)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={novaReferencia}
                onChange={(e) => setNovaReferencia(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddReferencia()}
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Ex: Art. 5º da Lei 105/2001"
              />
              <button
                onClick={handleAddReferencia}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Adicionar</span>
              </button>
            </div>
          </div>

          {/* Notas Internas */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notas Internas (Privado)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Observações internas para sua equipe..."
            />
            <p className="text-xs text-gray-500 mt-1">
              🔒 Estas notas não serão incluídas na resposta ao ofício
            </p>
          </div>

          {/* Atribuir Responsável */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Atribuir Responsável</span>
            </label>
            <select
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Nenhum (sem atribuição)</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nome} ({usuario.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              💡 O responsável receberá alertas sobre prazos deste ofício
              {usuarios.length === 0 && ' (Carregando usuários...)'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="p-4 border-t border-gray-700 space-y-3">
        {/* Salvar Rascunho */}
        <button
          onClick={handleSaveRascunho}
          disabled={saving}
          className="w-full flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          <span>{saving ? 'Salvando...' : 'Salvar Rascunho'}</span>
        </button>

        {/* Aprovar */}
        <button
          onClick={handleAprovar}
          disabled={saving}
          className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-semibold disabled:opacity-50"
        >
          <CheckCircle className="h-5 w-5" />
          <span>✅ APROVAR E GERAR RESPOSTA</span>
        </button>

        {/* Rejeitar */}
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={saving}
          className="w-full flex items-center justify-center space-x-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600 text-red-400 px-4 py-3 rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          <XCircle className="h-5 w-5" />
          <span>Rejeitar Ofício</span>
        </button>
      </div>

      {/* Modal de Rejeição */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-red-600 max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-red-400 mb-4">
              ❌ Rejeitar Ofício
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              Informe o motivo da rejeição para registro no sistema:
            </p>

            <textarea
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 mb-4"
              placeholder="Ex: PDF ilegível, dados insuficientes, ofício duplicado..."
              autoFocus
            />

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejeitar}
                disabled={!motivoRejeicao.trim() || saving}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
              >
                {saving ? 'Rejeitando...' : 'Confirmar Rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

