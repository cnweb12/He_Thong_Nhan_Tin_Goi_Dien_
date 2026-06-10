import React from 'react';
import { FileText, X } from 'lucide-react';
import { Avatar, EmptyState, IconButton } from '../../../components/ui';

const isPhoneLike = (value) => typeof value === 'string' && /^[+]?\d[\d\s()-]{5,}$/.test(value.trim());

export default function ConversationInfo({ chat, messages, currentUserId, onClose }) {
    const peer = chat?.peer || {};
    const title = chat?.displayName || peer.displayName || chat?.name || 'Chưa chọn hội thoại';
    const subtitle = chat?.phone || (isPhoneLike(chat?.username) ? chat.username : '')
        || peer.phone || (isPhoneLike(peer.username) ? peer.username : '');
    const avatarUrl = chat?.avatarUrl || peer.avatarUrl || peer.displayAvatarUrl || '';
    const unread = chat?.unread || chat?.unreadCount || 0;
    const totalMessages = messages?.length || 0;
    const myMessages = Array.isArray(messages) ? messages.filter((message) => message.from === currentUserId).length : 0;

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

                    <div>
                        <h4 className="font-semibold mb-3 text-slate-800 text-sm tracking-wide">TỆP ĐÍNH KÈM</h4>
                        <EmptyState
                            icon={FileText}
                            compact
                            title="Chưa có tệp"
                            description="Tệp và ảnh gần đây sẽ hiển thị ở đây."
                            className="rounded-2xl border border-slate-200 bg-slate-50"
                        />
                    </div>
                </div>
            ) : (
                <EmptyState title="Chưa chọn hội thoại" compact className="flex-1" />
            )}
        </div>
    );
}
