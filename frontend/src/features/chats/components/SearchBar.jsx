import React from 'react';

export default function SearchBar({ placeholder = 'Tìm kiếm' }) {
    return (
        <div className="p-3">
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</div>
                <input className="w-full pl-12 pr-3 py-2 rounded-full bg-gray-100 text-sm placeholder-gray-500" placeholder={placeholder} />
            </div>
        </div>
    );
}
