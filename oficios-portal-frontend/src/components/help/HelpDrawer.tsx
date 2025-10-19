'use client';

import { useState } from 'react';
import { X, Search, BookOpen, HelpCircle } from 'lucide-react';
import { helpCategories, searchHelp, HelpTopic } from '@/lib/help-content';
import { HelpModal } from './HelpModal';

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: string;
}

export function HelpDrawer({ isOpen, onClose, currentPage }: HelpDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);

  const searchResults = searchQuery.length > 2 ? searchHelp(searchQuery) : [];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Drawer */}
        <div className="relative bg-gray-800 border-l border-gray-700 w-full max-w-md h-full overflow-hidden flex flex-col shadow-2xl animate-slideInRight">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-900/50 rounded-lg">
                  <HelpCircle className="h-5 w-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Central de Ajuda</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar ajuda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Current Page Help */}
            {currentPage && !searchQuery && (
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">
                  Você está em: {currentPage}
                </h3>
                <p className="text-sm text-gray-300">
                  Clique nos ícones <HelpCircle className="inline h-3 w-3" /> ao lado de cada
                  elemento para ver ajuda específica.
                </p>
              </div>
            )}

            {/* Search Results */}
            {searchQuery.length > 2 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  Resultados da busca ({searchResults.length})
                </h3>
                {searchResults.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum resultado encontrado</p>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map(({ key, topic }) => (
                      <button
                        key={key}
                        onClick={() => setSelectedTopic(topic)}
                        className="w-full text-left p-3 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-blue-600 rounded-lg transition-all"
                      >
                        <p className="text-sm font-medium text-white">{topic.title}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {topic.content}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Categories */}
            {!searchQuery && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Categorias</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(helpCategories).map(([key, label]) => (
                    <button
                      key={key}
                      className="p-4 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-blue-600 rounded-lg transition-all text-left"
                    >
                      <BookOpen className="h-5 w-5 text-blue-400 mb-2" />
                      <p className="text-sm font-medium text-white">{label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links */}
            {!searchQuery && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Links Rápidos</h3>
                <div className="space-y-2">
                  <a
                    href="/docs/MANUAL_DO_USUARIO.md"
                    className="block p-3 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-blue-600 rounded-lg transition-all"
                  >
                    <p className="text-sm font-medium text-white">📖 Manual Completo</p>
                    <p className="text-xs text-gray-400 mt-1">Documentação completa do sistema</p>
                  </a>
                  <a
                    href="/docs/GUIA_RAPIDO.md"
                    className="block p-3 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-blue-600 rounded-lg transition-all"
                  >
                    <p className="text-sm font-medium text-white">⚡ Guia Rápido</p>
                    <p className="text-xs text-gray-400 mt-1">Início rápido em 3 passos</p>
                  </a>
                  <a
                    href="mailto:suporte@ness.com.br"
                    className="block p-3 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-blue-600 rounded-lg transition-all"
                  >
                    <p className="text-sm font-medium text-white">📧 Suporte</p>
                    <p className="text-xs text-gray-400 mt-1">suporte@ness.com.br</p>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Topic Modal */}
      {selectedTopic && (
        <HelpModal
          isOpen={!!selectedTopic}
          onClose={() => setSelectedTopic(null)}
          topic={selectedTopic}
        />
      )}
    </>
  );
}

