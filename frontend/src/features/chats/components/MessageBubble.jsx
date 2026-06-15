import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Check, AlertCircle, FileText, Download, Trash2, X, FileArchive, FileCode, FileAudio, FileVideo, File } from 'lucide-react';

/** Lấy chữ cái đầu từ displayName để làm fallback avatar */
function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/** Màu nền avatar từ tên — nhất quán, không random mỗi lần render */
function getAvatarColor(name) {
    const colors = [
        '#4f8ef7', '#f75c5c', '#f7a825', '#34c77b',
        '#a855f7', '#0ea5e9', '#ec4899', '#f97316',
    ];
    if (!name) return colors[0];
    const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[code % colors.length];
}

function resolveSenderInConversation(fromId, chat) {
    if (!fromId || !chat) return null;

    const candidates = [];
    if (chat.peer) candidates.push(chat.peer);
    if (chat.participant) candidates.push(chat.participant);
    if (Array.isArray(chat.members)) candidates.push(...chat.members);
    if (Array.isArray(chat.participants)) candidates.push(...chat.participants);
    if (!chat.members && !chat.participants && (chat.displayName || chat.name || chat.phone || chat.username)) {
        candidates.push(chat);
    }

    for (const item of candidates) {
        if (!item) continue;
        const user = item.user || item;
        const ids = [
            user?.userId,
            user?.id,
            user?._id,
            item?.userId,
            item?._id,
            item?.id,
        ]
            .filter(Boolean)
            .map((value) => value.toString());

        if (ids.includes(fromId.toString())) {
            return user;
        }
    }

    return null;
}

function Avatar({ sender }) {
    const [imgError, setImgError] = useState(false);
    const name = sender?.displayName || sender?.username || sender?.phone || sender?.name || '';
    const src = sender?.avatarUrl || sender?.displayAvatarUrl;
    const hasName = Boolean(name.trim());

    // Debug log
    if (!hasName) {
        console.warn('[Avatar] No name found:', {
            displayName: sender?.displayName,
            username: sender?.username,
            phone: sender?.phone,
            name: sender?.name,
            sender,
        });
    }

    if (src && !imgError) {
        return (
            <img
                src={src}
                alt={name || 'Avatar'}
                onError={() => setImgError(true)}
                className="w-7 h-7 rounded-full bg-slate-200 flex-shrink-0 object-cover"
            />
        );
    }

    if (hasName) {
        return (
            <span
                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold select-none"
                style={{ backgroundColor: getAvatarColor(name) }}
                title={name}
            >
                {getInitials(name)}
            </span>
        );
    }

    return (
        <span
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-300 text-slate-700 text-[10px] font-semibold select-none"
            title="Người dùng"
        >
            ?
        </span>
    );
}

export default function MessageBubble({ m, isMine, currentUserId, chat }) {
    const [previewImage, setPreviewImage] = useState(null);
    const messageSender = m.sender || m.senderInfo || m.user || m.fromUser;
    const resolvedSender = resolveSenderInConversation(m.from, chat);

    // Merge: ưu tiên thông tin từ message, nhưng lấy avatar/displayName từ chat nếu message không có
    const sender = messageSender
        ? {
            ...messageSender,
            avatarUrl: messageSender?.avatarUrl || resolvedSender?.avatarUrl,
            displayAvatarUrl: messageSender?.displayAvatarUrl || resolvedSender?.displayAvatarUrl,
            displayName: messageSender?.displayName || resolvedSender?.displayName,
            name: messageSender?.name || resolvedSender?.name,
            username: messageSender?.username || resolvedSender?.username,
            phone: messageSender?.phone || resolvedSender?.phone,
        }
        : resolvedSender;

    console.log('[MessageBubble] Sender Resolution:', {
        from: m.from,
        messageSender,
        resolvedSender,
        finalSender: sender,
        hasName: Boolean((sender?.displayName || sender?.username || sender?.phone || sender?.name || '').trim()),
    });

    const getStatusIcon = () => {
        if (!isMine || !m.status) return null;
        switch (m.status) {
            case 'sending': return <Clock className="w-3 h-3 text-slate-400" />;
            case 'sent': return <Check className="w-3 h-3 text-blue-500" />;
            case 'error': return <AlertCircle className="w-3 h-3 text-red-500" />;
            default: return null;
        }
    };

    const attachments = Array.isArray(m.attachments) && m.attachments.length > 0
        ? m.attachments
        : (m.fileUrl || m.url)
            ? [{ url: m.fileUrl || m.url, mimeType: m.fileType || m.mimeType || (m.type === 'image' ? 'image/jpeg' : 'application/octet-stream'), fileName: m.fileName || 'attachment', size: m.size || m.fileSize }]
            : [];

    const hasAttachments = attachments.length > 0;
    const hasText = Boolean(m.text && m.text.trim());

    const getFileIcon = (fileName) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <FileArchive size={22} />;
        if (['pdf'].includes(ext)) return <FileText size={22} className="text-red-500" />;
        if (['doc', 'docx', 'txt'].includes(ext)) return <FileText size={22} className="text-blue-500" />;
        if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileCode size={22} className="text-emerald-500" />;
        if (['mp3', 'wav', 'ogg'].includes(ext)) return <FileAudio size={20} />;
        if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return <FileVideo size={20} />;
        return <File size={22} />;
    };

    const getDownloadUrl = (url) => {
        if (!url || typeof url !== 'string') return '';
        if (url.includes('/upload/') && !url.includes('/raw/upload/') && !url.includes('fl_attachment')) {
            return url.replace('/upload/', '/upload/fl_attachment/');
        }
        return url;
    };

    const handleDownloadFile = async (e, url, fileName) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName || 'download';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            window.open(url, '_blank');
        }
    };

    return (
        <div className={`flex items-end ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
            {/* Avatar người gửi (chỉ hiện khi không phải mình) */}
            {!isMine && <Avatar sender={sender} />}

            <div className={`flex flex-col max-w-[90%] sm:max-w-[65%] ${isMine ? 'items-end' : 'items-start'} gap-1.5`}>
                {/* File / ảnh đính kèm */}
                {hasAttachments && (
                    <div className={`flex flex-col gap-2 w-full ${isMine ? 'items-end' : 'items-start'}`}>
                        {attachments.map((att, idx) => {
                            const isImage = att.mimeType?.startsWith('image/')
                                || m.type === 'image'
                                || (att.url && att.url.match(/\.(jpg|jpeg|png|gif|webp|svg)(?:\?.*)?$/i));

                            if (isImage) {
                                return (
                                    <div
                                        key={idx}
                                        className="relative group overflow-hidden rounded-xl border border-black/10 shadow-sm max-w-[240px] sm:max-w-xs cursor-pointer active:scale-[0.98] transition-transform"
                                        onClick={(e) => { e.stopPropagation(); setPreviewImage(att); }}
                                    >
                                        <img src={att.url} alt={att.fileName || 'image'} className="w-full object-cover bg-slate-200 block pointer-events-none select-none" style={{ maxHeight: '280px' }} />
                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                );
                            }

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={(e) => handleDownloadFile(e, att.url, att.fileName)}
                                    className={`flex items-center gap-3 p-2.5 rounded-xl border shadow-sm transition-colors max-w-[250px] sm:max-w-xs cursor-pointer text-left w-full
                                        ${isMine ? 'bg-blue-500 border-blue-600/50 hover:bg-blue-600 text-white' : 'bg-slate-200 border-slate-300/80 hover:bg-slate-300/70 text-slate-800'}`}
                                >
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isMine ? 'bg-blue-600/80 text-blue-100' : 'bg-white/80 text-slate-600'}`}>
                                        {getFileIcon(att.fileName)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold truncate">{att.fileName || 'Tài liệu đính kèm'}</div>
                                        {att.size && <div className={`text-xs mt-0.5 ${isMine ? 'text-blue-100' : 'text-slate-500'}`}>{(att.size / 1024).toFixed(1)} KB</div>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Text */}
                {hasText && (
                    <div className={`px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words
                        ${isMine
                            ? 'bg-blue-500 text-white rounded-2xl rounded-br-lg'
                            : 'bg-slate-200 text-slate-800 rounded-2xl rounded-bl-lg'
                        }`}
                    >
                        {m.text}
                    </div>
                )}

                {/* Timestamp + status */}
                <div className={`flex items-center gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    {m.time && <span className="text-[10px] text-slate-400">{m.time}</span>}
                    {getStatusIcon()}
                </div>
            </div>

            {isMine && <div className="w-7 h-7 shrink-0" />}

            {/* Lightbox */}
            {previewImage && createPortal(
                <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex flex-col z-[100]" onClick={() => setPreviewImage(null)}>
                    <div className="flex-shrink-0 text-right p-4">
                        <a href={getDownloadUrl(previewImage.url)} download={previewImage.fileName || 'image.jpg'} target="_blank" rel="noopener noreferrer"
                            className="inline-block p-2 text-white/80 hover:text-white transition-opacity mr-2" title="Tải ảnh về máy"
                            onClick={(e) => e.stopPropagation()}>
                            <Download size={24} />
                        </a>
                        <button type="button" className="inline-block p-2 text-white/80 hover:text-white transition-opacity"
                            onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }} title="Đóng">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4 overflow-auto min-h-0">
                        <img src={previewImage.url} alt={previewImage.fileName || 'Preview'}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
                            onClick={(e) => e.stopPropagation()} />
                    </div>
                </div>
                , document.body)}
        </div>
    );
}
