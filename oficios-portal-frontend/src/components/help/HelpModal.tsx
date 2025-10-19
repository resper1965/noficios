'use client';

import { X, BookOpen, Lightbulb, Keyboard, Link as LinkIcon } from 'lucide-react';
import { HelpTopic } from '@/lib/help-content';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: HelpTopic;
}

export function HelpModal({ isOpen, onClose, topic }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-900/50 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">{topic.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Content */}
          <div>
            <p className="text-gray-300 leading-relaxed">{topic.content}</p>
          </div>

          {/* Examples */}
          {topic.examples && topic.examples.length > 0 && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <BookOpen className="h-4 w-4 text-green-400" />
                <h3 className="text-sm font-semibold text-green-400">Exemplos</h3>
              </div>
              <ul className="space-y-2">
                {topic.examples.map((example, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start">
                    <span className="mr-2 text-green-400 flex-shrink-0">•</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          {topic.tips && topic.tips.length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                <h3 className="text-sm font-semibold text-yellow-400">Dicas</h3>
              </div>
              <ul className="space-y-2">
                {topic.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start">
                    <span className="mr-2 text-yellow-400 flex-shrink-0">💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Shortcuts */}
          {topic.shortcuts && topic.shortcuts.length > 0 && (
            <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Keyboard className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-purple-400">Atalhos de Teclado</h3>
              </div>
              <ul className="space-y-2">
                {topic.shortcuts.map((shortcut, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-center">
                    <kbd className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs font-mono mr-2">
                      {shortcut.split(' - ')[0]}
                    </kbd>
                    <span className="text-gray-400">{shortcut.split(' - ')[1]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Topics */}
          {topic.relatedTopics && topic.relatedTopics.length > 0 && (
            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <LinkIcon className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-blue-400">Tópicos Relacionados</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {topic.relatedTopics.map((relatedKey, index) => (
                  <button
                    key={index}
                    className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 text-blue-400 rounded-lg transition-colors"
                    onClick={() => {
                      // TODO: Navigate to related topic
                      console.log('Navigate to:', relatedKey);
                    }}
                  >
                    {relatedKey}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-900/50 border-t border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Precisa de mais ajuda?{' '}
              <a
                href="mailto:suporte@ness.com.br"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                suporte@ness.com.br
              </a>
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

