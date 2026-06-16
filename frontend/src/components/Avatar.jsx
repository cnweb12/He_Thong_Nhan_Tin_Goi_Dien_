import React, { useState } from 'react';

/** Lấy chữ cái đầu từ tên (Hỗ trợ 2 ký tự như ui-avatars) */
export function getInitials(name) {
    if (!name) return '?';
    const cleanName = name.trim();
    if (!cleanName) return '?';
    return cleanName.charAt(0).toUpperCase();
}

/** Màu nền avatar từ tên — nhất quán, không random mỗi lần render */
export function getAvatarColor(name) {
    const colors = [
        '#4f8ef7', '#f75c5c', '#f7a825', '#34c77b',
        '#a855f7', '#0ea5e9', '#ec4899', '#f97316',
    ];
    if (!name) return colors[0];
    const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[code % colors.length];
}

export default function Avatar({ src, name, size = 'w-10 h-10', textClass = 'text-xs font-bold' }) {
    const [imgError, setImgError] = useState(false);
    const hasName = Boolean(name?.trim());

    if (src && !imgError) {
        return (
            <img
                src={src}
                alt={name || 'Avatar'}
                onError={() => setImgError(true)}
                className={`${size} rounded-full object-cover bg-slate-200 shrink-0`}
            />
        );
    }

    if (hasName) {
        return (
            <span
                className={`${size} rounded-full shrink-0 flex items-center justify-center text-white select-none ${textClass}`}
                style={{ backgroundColor: getAvatarColor(name) }}
                title={name}
            >
                {getInitials(name)}
            </span>
        );
    }

    return (
        <span
            className={`${size} rounded-full shrink-0 flex items-center justify-center bg-slate-300 text-slate-700 select-none ${textClass}`}
            title="Người dùng"
        >
            ?
        </span>
    );
}
