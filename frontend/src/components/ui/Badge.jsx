import React from 'react';
import { cn } from './cn';

const toneClasses = {
    primary: 'bg-blue-500 text-white',
    neutral: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-700',
};

const sizeClasses = {
    sm: 'min-h-5 min-w-5 px-1.5 text-[10px]',
    md: 'min-h-6 min-w-6 px-2 text-xs',
};

export function Badge({ children, tone = 'neutral', size = 'sm', pill = true, className }) {
    return (
        <span
            className={cn(
                'inline-flex items-center justify-center font-bold leading-none',
                pill ? 'rounded-full' : 'rounded-md',
                toneClasses[tone] || toneClasses.neutral,
                sizeClasses[size] || sizeClasses.sm,
                className,
            )}
        >
            {children}
        </span>
    );
}
