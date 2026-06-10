import React from 'react';
import { Search } from 'lucide-react';
import { cn } from './cn';

export function SearchInput({ value, onChange, placeholder = 'Tim kiem', disabled = false, className }) {
    return (
        <div className={cn('relative', className)}>
            <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
            />
            <input
                value={value}
                disabled={disabled}
                onChange={(event) => onChange?.(event.target.value)}
                className="w-full rounded-2xl border border-transparent bg-slate-100 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 transition focus:border-blue-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder={placeholder}
            />
        </div>
    );
}
