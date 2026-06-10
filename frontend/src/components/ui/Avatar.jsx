import React from 'react';
import { cn } from './cn';

const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-16 w-16 text-lg',
};

const statusClasses = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-400',
    busy: 'bg-amber-500',
};

const getInitials = (name) => {
    const parts = String(name || '?')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) return '?';
    return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
};

export function Avatar({
    src,
    name,
    size = 'md',
    shape = 'circle',
    status = 'none',
    alt,
    className,
}) {
    const initials = getInitials(name);
    const roundedClass = shape === 'rounded' ? 'rounded-[1.1rem]' : 'rounded-full';

    return (
        <span className={cn('relative inline-flex shrink-0', className)}>
            {src ? (
                <img
                    src={src}
                    alt={alt || name || 'Avatar'}
                    className={cn(
                        'object-cover bg-slate-200 ring-1 ring-black/5',
                        sizeClasses[size] || sizeClasses.md,
                        roundedClass,
                    )}
                />
            ) : (
                <span
                    aria-label={alt || name || 'Avatar'}
                    className={cn(
                        'inline-flex items-center justify-center bg-slate-200 font-semibold text-slate-700 ring-1 ring-black/5',
                        sizeClasses[size] || sizeClasses.md,
                        roundedClass,
                    )}
                >
                    {initials}
                </span>
            )}
            {status !== 'none' && (
                <span
                    className={cn(
                        'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white',
                        statusClasses[status] || statusClasses.offline,
                    )}
                    aria-hidden="true"
                />
            )}
        </span>
    );
}
