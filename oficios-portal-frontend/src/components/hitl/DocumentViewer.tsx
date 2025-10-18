'use client';

import { useState } from 'react';
import { Download, ZoomIn, ZoomOut, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configurar worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentViewerProps {
  pdfUrl?: string;
  ocrText?: string;
  oficioNumero: string;
}

export function DocumentViewer({ pdfUrl, ocrText, oficioNumero }: DocumentViewerProps) {
  const [viewMode, setViewMode] = useState<'pdf' | 'text'>('pdf');
  const [zoom, setZoom] = useState(1.0);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

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
            {viewMode === 'pdf' && pdfUrl && (
              <>
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  title="Diminuir zoom"
                >
                  <ZoomOut className="h-4 w-4 text-gray-300" />
                </button>
                <span className="text-sm text-gray-400 min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(Math.min(2.0, zoom + 0.25))}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="h-4 w-4 text-gray-300" />
                </button>
              </>
            )}

            {/* Page Navigation */}
            {viewMode === 'pdf' && pdfUrl && numPages > 1 && (
              <>
                <div className="h-6 w-px bg-gray-600 mx-2"></div>
                <button
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={pageNumber === 1}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-300" />
                </button>
                <span className="text-sm text-gray-400 min-w-[80px] text-center">
                  Pág. {pageNumber} / {numPages}
                </span>
                <button
                  onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                  disabled={pageNumber === numPages}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Próxima página"
                >
                  <ChevronRight className="h-4 w-4 text-gray-300" />
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
            <div className="flex items-center justify-center">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-400">Carregando PDF...</p>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center py-12 text-red-400">
                    <FileText className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Erro ao carregar PDF</p>
                    <p className="text-sm text-gray-400 mt-2">Tente visualizar o texto OCR</p>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={zoom}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-lg"
                />
              </Document>
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

