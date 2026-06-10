import React from 'react';
import { cn } from './cn';

const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-11 w-11',
};

const iconSizes = {
    sm: 16,
    md: 20,
    lg: 22,
};

const toneClasses = {
    neutral: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-200',
    primary: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-200',
    success: 'text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-200',
    danger: 'text-red-600 hover:bg-red-50 focus:ring-red-200',
    ghost: 'text-white/80 hover:bg-white/10 focus:ring-white/20',
};

export function IconButton({
    icon: Icon,
    label,
    size = 'md',
    tone = 'neutral',
    active = false,
    disabled = false,
    className,
    children,
    type = 'button',
    ...props
}) {
    return (
        <button
            type={type}
            aria-label={label}
            title={label}
            disabled={disabled}
            className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
                sizeClasses[size] || sizeClasses.md,
                toneClasses[tone] || toneClasses.neutral,
                active && 'bg-slate-100',
                className,
            )}
            {...props}
        >
            {Icon ? <Icon size={iconSizes[size] || iconSizes.md} aria-hidden="true" /> : children}
        </button>
    );
}
