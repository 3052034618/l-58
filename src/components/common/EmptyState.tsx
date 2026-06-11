import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
        {icon || <Inbox className="w-10 h-10 text-slate-400" />}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mb-6 max-w-sm">{description}</p>
      )}
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
