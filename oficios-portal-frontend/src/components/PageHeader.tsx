import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export default function PageHeader({ title, subtitle, icon }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        {icon ? <div className="text-primary">{icon}</div> : null}
        <h1 className="text-3xl md:text-4xl font-semibold">{title}</h1>
      </div>
      {subtitle ? (
        <p className="text-muted-foreground text-base">{subtitle}</p>
      ) : null}
    </div>
  );
}


