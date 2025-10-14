/**
 * Componente Logo da ness.
 * Wordmark com ponto na cor #00ade8
 */

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark'; // light = texto preto, dark = texto branco
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', variant = 'dark', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const textColor = variant === 'light' ? 'text-black' : 'text-white';

  return (
    <div className={`font-medium ${sizeClasses[size]} ${className}`}>
      <span className={textColor}>ness</span>
      <span className="text-primary">.</span>
    </div>
  );
}





