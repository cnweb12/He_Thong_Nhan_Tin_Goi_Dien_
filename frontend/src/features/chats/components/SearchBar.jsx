import React, { useId } from 'react';
import { Search, X } from 'lucide-react';

/**
 * SearchBar — ô tìm kiếm dùng chung.
 *
 * Props:
 *  - value       : string
 *  - onChange    : (value: string) => void
 *  - placeholder : string (mặc định 'Tìm kiếm')
 *  - onClear     : () => void — tùy chọn, nếu có sẽ hiện nút X
 *  - loading     : boolean — hiện spinner nhỏ thay icon kính lúp
 */
export default function SearchBar({
    value = '',
    onChange,
    placeholder = 'Tìm kiếm',
    onClear,
    loading = false,
}) {
    const inputId = useId();

    const handleClear = () => {
        onChange?.('');
        onClear?.();
    };

    return (
        <div className="px-4 py-3">
            <div className="relative flex items-center">
                {/* Icon kính lúp / spinner */}
                <span
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                >
                    {loading ? (
                        /* spinner nhỏ */
                        <svg
                            className="animate-spin h-4 w-4 text-blue-400"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12" cy="12" r="10"
                                stroke="currentColor" strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                        </svg>
                    ) : (
                        <Search size={16} />
                    )}
                </span>

                <input
                    id={inputId}
                    type="search"
                    autoComplete="off"
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    placeholder={placeholder}
                    className="
                        w-full pl-10 pr-8 py-2.5 rounded-[1.25rem]
                        bg-[#f2f7ff] dark:bg-[#1c2b38] text-sm text-slate-700 dark:text-slate-200
                        placeholder-slate-400 dark:placeholder-slate-500 border border-transparent
                        focus:bg-white dark:focus:bg-[#223044] focus:border-[#b8d4ff] dark:focus:border-[#2b5278]
                        focus:outline-none focus:ring-4 focus:ring-[#dbeafe] dark:focus:ring-[#2b5278]/20
                        transition-all duration-150
                    "
                />

                {/* Nút xoá — chỉ hiện khi có chữ */}
                {value.length > 0 && (
                    <button
                        type="button"
                        onClick={handleClear}
                        aria-label="Xoá tìm kiếm"
                        className="absolute right-3 top-1/2 -translate-y-1/2
                                   text-slate-400 hover:text-slate-600
                                   transition-colors focus:outline-none cursor-pointer"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}