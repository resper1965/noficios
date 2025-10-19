'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { HelpDrawer } from './HelpDrawer';

interface FloatingHelpButtonProps {
  currentPage?: string;
}

export function FloatingHelpButton({ currentPage }: FloatingHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-30 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl transition-all hover:scale-110 group"
        title="Precisa de ajuda?"
        aria-label="Abrir central de ajuda"
      >
        <HelpCircle className="h-6 w-6" />
        <span className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Precisa de ajuda?
        </span>
      </button>

      {/* Drawer */}
      <HelpDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} currentPage={currentPage} />
    </>
  );
}

