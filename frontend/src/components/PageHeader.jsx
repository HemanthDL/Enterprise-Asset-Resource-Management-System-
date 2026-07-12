/**
 * Reusable page header with title, description, and action buttons slot.
 */
import { cn } from '@/lib/utils';

export default function PageHeader({ title, description, children, className }) {
  return (
    <div className={cn('flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6', className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
