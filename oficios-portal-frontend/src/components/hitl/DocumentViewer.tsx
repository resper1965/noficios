'use client';

import { useState } from 'react';
import { Download, ZoomIn, ZoomOut, FileText } from 'lucide-react';

interface DocumentViewerProps {
  pdfUrl?: string;
  ocrText?: string;
  oficioNumero: string;
}

export function DocumentViewer({ pdfUrl, ocrText, oficioNumero }: DocumentViewerProps) {
  const [viewMode, setViewMode] = useState<'pdf' | 'text'>('pdf');
  const [zoom, setZoom] = useState(100);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-400" />
            <span>Documento Original</span>
          </h3>
          
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            {viewMode === 'pdf' && (
              <>
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  title="Diminuir zoom"
                >
                  <ZoomOut className="h-4 w-4 text-gray-300" />
                </button>
                <span className="text-sm text-gray-400 min-w-[50px] text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="h-4 w-4 text-gray-300" />
                </button>
              </>
            )}

            {/* Download */}
            {pdfUrl && (
              <a
                href={pdfUrl}
                download={`oficio-${oficioNumero}.pdf`}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                title="Baixar PDF"
              >
                <Download className="h-4 w-4 text-white" />
              </a>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('pdf')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'pdf'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Ver PDF
          </button>
          <button
            onClick={() => setViewMode('text')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'text'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Ver Texto (OCR)
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'pdf' ? (
          pdfUrl ? (
            <div className="flex items-center justify-center h-full">
              {/* TODO: Integrar react-pdf ou iframe */}
              <iframe
                src={pdfUrl}
                className="w-full h-full rounded-lg"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                title={`PDF Ofício ${oficioNumero}`}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FileText className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">PDF não disponível</p>
              <p className="text-sm">Visualize o texto OCR extraído</p>
            </div>
          )
        ) : (
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono">
                {ocrText || 'Texto OCR não disponível'}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer Tip */}
      <div className="p-4 bg-blue-900/10 border-t border-gray-700">
        <p className="text-xs text-gray-400 flex items-center space-x-2">
          <span>💡</span>
          <span>
            {viewMode === 'pdf' 
              ? 'Use o PDF para conferir se a IA leu corretamente'
              : 'Este é o texto que a IA analisou para extrair os dados'
            }
          </span>
        </p>
      </div>
    </div>
  );
}

