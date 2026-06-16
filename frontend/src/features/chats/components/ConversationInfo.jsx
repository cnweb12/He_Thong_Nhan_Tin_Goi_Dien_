import React from 'react';
import { X, FileText, Image as ImageIcon } from 'lucide-react';

const isPhoneLike = (value) => typeof value === 'string' && /^[+]?\d[\d\s()-]{5,}$/.test(value.trim());

export default function ConversationInfo({ chat, messages, currentUserId, onClose }) {
    const peer = chat?.peer || {};
    const title = peer.displayName || chat?.displayName || chat?.name || 'Chưa chọn hội thoại';
    const subtitle = peer.phone || (isPhoneLike(peer.username) ? peer.username : '')
        || chat?.phone || (isPhoneLike(chat?.username) ? chat.username : '');
    const avatarUrl = peer.avatarUrl || peer.displayAvatarUrl || chat?.avatarUrl || chat?.displayAvatarUrl || '';
    const unread = chat?.unread || 0;
    const totalMessages = messages?.length || 0;
    const myMessages = Array.isArray(messages) ? messages.filter((message) => message.from === currentUserId).length : 0;

    // Extract all attachments from messages
    const allAttachments = (messages || []).reduce((acc, msg) => {
        if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
            return acc.concat(msg.attachments);
        } else if (msg.fileUrl || msg.url) {
            // Support older message format if necessary
            acc.push({
                url: msg.fileUrl || msg.url,
                mimeType: msg.fileType || msg.mimeType || (msg.type === 'image' ? 'image/jpeg' : 'application/octet-stream'),
                fileName: msg.fileName || 'attachment',
                size: msg.size || msg.fileSize
            });
        }
        return acc;
    }, []);

    return (
        <div className="w-full h-full flex-shrink-0 bg-white dark:bg-[#17212b] p-6 overflow-y-auto flex flex-col relative z-10">
            {onClose && (
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#1c2b38] text-slate-500 dark:text-slate-400 transition-colors z-20 cursor-pointer"
                    aria-label="Đóng thông tin"
                >
                    <X size={20} />
                </button>
            )}
            
            {chat ? (
                <div className="flex-1 mt-2">
                    <div className="flex items-center gap-3 mb-6">
                        {avatarUrl ? (
                            <img src={avatarUrl} className="w-16 h-16 rounded-[1.4rem] object-cover bg-slate-200 shadow-sm ring-1 ring-slate-200" alt={title} />
                        ) : (
                            <div className="w-16 h-16 rounded-[1.4rem] bg-slate-100 flex items-center justify-center text-lg font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                                {(title || 'C').slice(0, 1).toUpperCase()}
                            </div>
                        )}
                        <div className="pr-6">
                            <div className="font-semibold text-slate-900 text-lg leading-tight">{title}</div>
                            <div className="text-sm text-slate-500 mt-0.5">{subtitle || 'Mô tả nhóm hoặc thông tin'}</div>
                        </div>
                    </div>

                    <div className="mb-6 bg-slate-50/50 dark:bg-[#1c2b38] border border-slate-200 dark:border-[#1e2d3d] p-4 rounded-[1.25rem] shadow-sm">
                        <h4 className="font-semibold mb-3 text-slate-800 dark:text-slate-200 text-sm tracking-wide">THÔNG TIN NHANH</h4>
                        <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2.5">
                            <div className="flex justify-between items-center">
                                <span>Tổng tin nhắn</span>
                                <span className="font-medium text-slate-900 dark:text-slate-100">{totalMessages}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Tin của tôi</span>
                                <span className="font-medium text-slate-900 dark:text-slate-100">{myMessages}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Tin chưa đọc</span>
                                <span className="font-medium text-blue-600 dark:text-blue-400">{unread}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-3 text-slate-800 dark:text-slate-200 text-sm tracking-wide">TỆP ĐÍNH KÈM ({allAttachments.length})</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {allAttachments.length > 0 ? (
                                allAttachments.map((att, idx) => {
                                    const isImg = att.mimeType?.startsWith('image/');
                                    return (
                                        <a 
                                            key={idx} 
                                            href={att.url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="aspect-square bg-slate-100 rounded-[1rem] hover:bg-slate-200 transition cursor-pointer flex items-center justify-center overflow-hidden border border-slate-200 relative group"
                                            title={att.fileName}
                                        >
                                            {isImg ? (
                                                <img src={att.url} alt={att.fileName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 text-slate-500">
                                                    <FileText size={24} />
                                                    <span className="text-[10px] font-medium truncate w-full px-2 text-center">{att.fileName?.split('.').pop()?.toUpperCase() || 'FILE'}</span>
                                                </div>
                                            )}
                                        </a>
                                    );
                                })
                            ) : (
                                <>
                                    <div className="aspect-square bg-slate-100 rounded-[1rem] flex items-center justify-center text-slate-400 text-xs">Trống</div>
                                    <div className="aspect-square bg-slate-50 border border-slate-200 rounded-[1rem] flex items-center justify-center text-slate-400 text-xs">Trống</div>
                                    <div className="aspect-square bg-slate-100 rounded-[1rem] flex items-center justify-center text-slate-400 text-xs">Trống</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-slate-500 flex-1 flex items-center justify-center text-sm">Chưa chọn hội thoại</div>
            )}
        </div>
    );
}
