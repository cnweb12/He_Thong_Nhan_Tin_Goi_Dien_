import React from 'react';

export default function SearchBar({ placeholder = 'Tìm kiếm', value, onChange }) {
    return (
        <div className="p-3">
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</div>
                <input
                    value={value}
                    onChange={(event) => onChange?.(event.target.value)}
                    className="w-full pl-12 pr-3 py-3 rounded-2xl bg-slate-100/90 text-sm placeholder-slate-400 border border-transparent focus:bg-white focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
}
