import React from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from './cn';

export function EmptyState({
    icon: Icon = MessageCircle,
    title,
    description,
    action,
    compact = false,
    className,
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center text-center text-slate-500',
                compact ? 'px-3 py-4' : 'px-6 py-10',
                className,
            )}
        >
            <div className={cn('mb-3 flex items-center justify-center rounded-full bg-slate-100 text-slate-400', compact ? 'h-9 w-9' : 'h-12 w-12')}>
                <Icon size={compact ? 18 : 22} aria-hidden="true" />
            </div>
            {title && <div className="text-sm font-semibold text-slate-700">{title}</div>}
            {description && <div className="mt-1 max-w-xs text-xs leading-5 text-slate-500">{description}</div>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
