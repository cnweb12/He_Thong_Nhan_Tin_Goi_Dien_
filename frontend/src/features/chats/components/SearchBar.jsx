import React from 'react';

export default function SearchBar({ placeholder = 'Tìm kiếm', value, onChange }) {
    return (
        <div className="px-4 py-3">
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</div>
                <input
                    value={value}
                    onChange={(event) => onChange?.(event.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-[1.25rem] bg-[#f2f7ff] text-sm placeholder-slate-400 border border-transparent focus:bg-white focus:border-[#b8d4ff] focus:outline-none focus:ring-4 focus:ring-[#dbeafe]"
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
}
