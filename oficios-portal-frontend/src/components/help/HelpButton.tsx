'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { HelpModal } from './HelpModal';
import { getHelpTopic } from '@/lib/help-content';

interface HelpButtonProps {
  topic: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  label?: string;
  className?: string;
}

export function HelpButton({
  topic,
  size = 'sm',
  variant = 'icon',
  label,
  className = '',
}: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const helpTopic = getHelpTopic(topic);

  if (!helpTopic) {
    console.warn(`Help topic not found: ${topic}`);
    return null;
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  if (variant === 'button') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`
            flex items-center space-x-2 px-3 py-2 text-sm
            text-blue-400 hover:text-blue-300 
            bg-blue-900/20 hover:bg-blue-900/30
            border border-blue-700/50 hover:border-blue-600
            rounded-lg transition-all
            ${className}
          `}
          title={helpTopic.title}
        >
          <HelpCircle className={sizeClasses[size]} />
          {label && <span>{label}</span>}
        </button>
        <HelpModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          topic={helpTopic}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`
          inline-flex items-center justify-center
          text-gray-400 hover:text-blue-400 
          transition-colors cursor-help
          ${className}
        `}
        title={`Ajuda: ${helpTopic.title}`}
        aria-label={`Ajuda sobre ${helpTopic.title}`}
      >
        <HelpCircle className={sizeClasses[size]} />
      </button>
      <HelpModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        topic={helpTopic}
      />
    </>
  );
}

