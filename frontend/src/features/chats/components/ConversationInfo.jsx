import React from 'react';
import { FileText, Image as ImageIcon, X } from 'lucide-react';
import { Avatar, EmptyState, IconButton } from '../../../components/ui';

const isPhoneLike = (value) => typeof value === 'string' && /^[+]?\d[\d\s()-]{5,}$/.test(value.trim());

const getMessageAttachments = (message) => {
    if (Array.isArray(message?.attachments) && message.attachments.length > 0) {
        return message.attachments;
    }

    if (message?.fileUrl || message?.url) {
        return [{
            url: message.fileUrl || message.url,
            mimeType: message.fileType || message.mimeType || (message.type === 'image' ? 'image/jpeg' : 'application/octet-stream'),
            fileName: message.fileName || 'attachment',
            size: message.size || message.fileSize,
        }];
    }

    return [];
};

const isImageAttachment = (attachment) => attachment?.mimeType?.startsWith('image/')
    || attachment?.url?.match(/\.(jpg|jpeg|png|gif|webp|svg)(?:\?.*)?$/i);

const formatFileSize = (size) => {
    if (!size) return '';
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ConversationInfo({ chat, messages, currentUserId, onClose }) {
    const peer = chat?.peer || {};
    const title = chat?.displayName || peer.displayName || chat?.name || 'Chưa chọn hội thoại';
    const subtitle = chat?.phone || (isPhoneLike(chat?.username) ? chat.username : '')
        || peer.phone || (isPhoneLike(peer.username) ? peer.username : '');
    const avatarUrl = chat?.avatarUrl || peer.avatarUrl || peer.displayAvatarUrl || '';
    const unread = chat?.unread || chat?.unreadCount || 0;
    const totalMessages = messages?.length || 0;
    const myMessages = Array.isArray(messages) ? messages.filter((message) => message.from === currentUserId).length : 0;

    const attachments = Array.isArray(messages)
        ? messages.flatMap((message) => getMessageAttachments(message).map((attachment, index) => ({
            ...attachment,
            id: `${message.id || message.clientMessageId || message.createdAt || 'message'}-${index}`,
            createdAt: message.createdAt,
        }))).reverse()
        : [];
    const images = attachments.filter(isImageAttachment).slice(0, 6);
    const files = attachments.filter((attachment) => !isImageAttachment(attachment)).slice(0, 5);

    return (
        <div className="w-full h-full flex-shrink-0 bg-white p-6 overflow-y-auto flex flex-col relative z-10">
            {onClose && (
                <IconButton
                    icon={X}
                    label="Đóng thông tin"
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20"
                />
            )}

            {chat ? (
                <div className="flex-1 mt-2">
                    <div className="flex items-center gap-3 mb-6">
                        <Avatar src={avatarUrl} name={title} alt={title} size="xl" shape="rounded" />
                        <div className="pr-6 min-w-0">
                            <div className="font-semibold text-slate-900 text-lg leading-tight truncate">{title}</div>
                            <div className="text-sm text-slate-500 mt-0.5 truncate">{subtitle || 'Mô tả nhóm hoặc thông tin'}</div>
                        </div>
                    </div>

                    <div className="mb-6 bg-slate-50/50 border border-slate-200 p-4 rounded-[1.25rem] shadow-sm">
                        <h4 className="font-semibold mb-3 text-slate-800 text-sm tracking-wide">THÔNG TIN NHANH</h4>
                        <div className="text-sm text-slate-600 space-y-2.5">
                            <div className="flex justify-between items-center">
                                <span>Tổng tin nhắn</span>
                                <span className="font-medium text-slate-900">{totalMessages}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Tin của tôi</span>
                                <span className="font-medium text-slate-900">{myMessages}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Tin chưa đọc</span>
                                <span className="font-medium text-blue-600">{unread}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <section>
                            <h4 className="font-semibold mb-3 text-slate-800 text-sm tracking-wide">ẢNH GẦN ĐÂY</h4>
                            {images.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {images.map((image) => (
                                        <a
                                            key={image.id}
                                            href={image.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="aspect-square overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 transition hover:opacity-90"
                                            title={image.fileName || 'Ảnh đính kèm'}
                                        >
                                            <img src={image.url} alt={image.fileName || 'Ảnh đính kèm'} className="h-full w-full object-cover" />
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={ImageIcon}
                                    compact
                                    title="Chưa có ảnh"
                                    description="Ảnh đã gửi trong cuộc trò chuyện sẽ hiển thị ở đây."
                                    className="rounded-2xl border border-slate-200 bg-slate-50"
                                />
                            )}
                        </section>

                        <section>
                            <h4 className="font-semibold mb-3 text-slate-800 text-sm tracking-wide">TỆP GẦN ĐÂY</h4>
                            {files.length > 0 ? (
                                <div className="space-y-2">
                                    {files.map((file) => (
                                        <a
                                            key={file.id}
                                            href={file.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-100"
                                        >
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 ring-1 ring-slate-200">
                                                <FileText size={18} />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold text-slate-800">{file.fileName || 'Tài liệu đính kèm'}</span>
                                                <span className="block text-xs text-slate-500">{formatFileSize(file.size) || file.mimeType || 'Tệp đính kèm'}</span>
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={FileText}
                                    compact
                                    title="Chưa có tệp"
                                    description="Tệp đã gửi trong cuộc trò chuyện sẽ hiển thị ở đây."
                                    className="rounded-2xl border border-slate-200 bg-slate-50"
                                />
                            )}
                        </section>
                    </div>
                </div>
            ) : (
                <EmptyState title="Chưa chọn hội thoại" compact className="flex-1" />
            )}
        </div>
    );
}
