import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Check, AlertCircle, FileText, Download, X, FileArchive, FileCode, FileAudio, FileVideo, File } from 'lucide-react';
import { Avatar } from '../../../components/ui';

export default function MessageBubble({ m, isMine }) {
    const [previewImage, setPreviewImage] = useState(null);

    const getStatusIcon = () => {
        if (!isMine || !m.status) return null;

        switch (m.status) {
            case 'sending':
                return <Clock className="w-3 h-3 text-slate-400" />;
            case 'sent':
                return <Check className="w-3 h-3 text-blue-500" />;
            case 'error':
                return <AlertCircle className="w-3 h-3 text-red-500" />;
            default:
                return null;
        }
    };

    const attachments = Array.isArray(m.attachments) && m.attachments.length > 0
        ? m.attachments
        : (m.fileUrl || m.url) 
            ? [{ 
                url: m.fileUrl || m.url, 
                mimeType: m.fileType || m.mimeType || (m.type === 'image' ? 'image/jpeg' : 'application/octet-stream'), 
                fileName: m.fileName || 'attachment', 
                size: m.size || m.fileSize 
            }] 
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

    // Hàm trợ giúp ép Cloudinary trả về file dưới dạng tải xuống
    const getDownloadUrl = (url) => {
        if (!url || typeof url !== 'string') return '';
        
        // Nếu là link Cloudinary và không phải resource 'raw' (vì raw không hỗ trợ transformation)
        if (url.includes('/upload/') && !url.includes('/raw/upload/') && !url.includes('fl_attachment')) {
            /**
             * Đối với các file PDF hoặc tài liệu khác lỡ được upload dưới dạng 'image' (nằm trong /image/upload/),
             * việc thêm fl_attachment là CỰC KỲ QUAN TRỌNG. 
             * Nó ép Cloudinary gửi header Content-Disposition: attachment, giúp tải file về 
             * thay vì cố gắng render file đó như một hình ảnh (gây lỗi 400 nếu không có addon PDF).
             */
            return url.replace('/upload/', '/upload/fl_attachment/');
        }
        return url;
    };
            
    /**
     * Hàm tải tệp tin an toàn (Blob Download)
     * Giải quyết triệt để lỗi 400 của Cloudinary và lỗi "This page isn't working"
     */
    const handleDownloadFile = async (e, url, fileName) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            // Tải dữ liệu thô từ URL
            const response = await fetch(url);
            const blob = await response.blob();
            
            // Tạo một đường dẫn ảo trong bộ nhớ trình duyệt
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.body.appendChild(document.createElement('a'));
            link.href = blobUrl;
            link.download = fileName || 'download';
            
            // Kích hoạt lệnh tải về
            document.body.appendChild(link);
            link.click();
            
            // Dọn dẹp bộ nhớ
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Lỗi khi tải tệp:", error);
            window.open(url, '_blank');
        }
    };

    return (
        <div className={`flex items-end ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
            {!isMine && (
                <Avatar src={m.sender?.avatarUrl} name={m.sender?.displayName || '?'} alt={m.sender?.displayName || 'Avatar'} size="xs" />
            )}

            <div className={`flex flex-col max-w-[70%] sm:max-w-[65%] ${isMine ? 'items-end' : 'items-start'} gap-1.5`}>
                {/* Phân vùng 1: Hiển thị file/hình ảnh đính kèm */}
                {hasAttachments && (
                    <div className={`flex flex-col gap-2 w-full ${isMine ? 'items-end' : 'items-start'}`}>
                        {attachments.map((att, idx) => {
                            const isImage = att.mimeType?.startsWith('image/') || 
                                            m.type === 'image' || 
                                            (att.url && att.url.match(/\.(jpg|jpeg|png|gif|webp|svg)(?:\?.*)?$/i));

                            if (isImage) {
                                return (
                                    <div 
                                        key={idx} 
                                        className="relative group overflow-hidden rounded-xl border border-black/10 shadow-sm max-w-[240px] sm:max-w-xs cursor-pointer block p-0 outline-none active:scale-[0.98] transition-transform"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewImage(att);
                                        }}
                                    >
                                        <img 
                                            src={att.url} 
                                            alt={att.fileName || 'image'} 
                                            className="w-full object-cover bg-slate-200 block pointer-events-none select-none" 
                                            style={{ maxHeight: '280px' }} 
                                        />
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

                {/* Phân vùng 2: Khung chữ văn bản */}
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
            </div>

            {isMine && <div className="w-7 h-7 shrink-0" />}

            {/* Modal hiển thị ảnh phóng to (Lightbox) */}
            {previewImage && createPortal(
                <div 
                    className="fixed inset-0 bg-black/90 backdrop-blur-lg flex flex-col z-[100]"
                    onClick={() => setPreviewImage(null)}
                >
                    {/* Thanh công cụ phía trên */}
                    <div className="flex-shrink-0 text-right p-4">
                        <a 
                            href={getDownloadUrl(previewImage.url)}
                            download={previewImage.fileName || 'image.jpg'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block p-2 text-white/80 hover:text-white transition-opacity mr-2"
                            title="Tải ảnh về máy"
                            onClick={(e) => e.stopPropagation()}
                        >
                             <Download size={24} />
                        </a>
                        <button 
                            type="button"
                            className="inline-block p-2 text-white/80 hover:text-white transition-opacity"
                            onClick={(e) => {
                                 e.stopPropagation();
                                 setPreviewImage(null);
                             }}
                            title="Đóng"
                        >
                             <X size={24} />
                        </button>
                    </div>

                    {/* Vùng hiển thị ảnh */}
                    <div className="flex-1 flex items-center justify-center p-4 overflow-auto min-h-0">
                        <img 
                            src={previewImage.url} 
                            alt={previewImage.fileName || 'Preview'} 
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
                            onClick={(e) => e.stopPropagation()} 
                        />
                    </div>
                </div>
            , document.body)}
        </div>
    );
}
