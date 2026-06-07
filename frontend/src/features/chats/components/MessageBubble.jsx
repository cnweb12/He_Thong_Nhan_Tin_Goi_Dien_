import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Check, AlertCircle, FileText, Download, Trash2, X, FileArchive, FileCode, FileAudio, FileVideo, File } from 'lucide-react';

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
        <div className={`flex items-end ${isMine ? 'justify-end' : 'justify-start'} gap-2 mb-2`}>
            {!isMine && <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-700 shrink-0">T</div>}

            <div className={`flex flex-col max-w-[74%] ${isMine ? 'items-end' : 'items-start'} gap-1.5`}>
                {/* Phân vùng 1: Hiển thị file/hình ảnh đính kèm */}
                {hasAttachments && (
                    <div className={`flex flex-col gap-2 ${isMine ? 'items-end' : 'items-start'}`}>
                        {attachments.map((att, idx) => {
                            // Kiểm tra ảnh kỹ hơn để tránh bỏ sót
                            const isImage = att.mimeType?.startsWith('image/') || 
                                            m.type === 'image' || 
                                            (att.url && att.url.match(/\.(jpg|jpeg|png|gif|webp|svg)(?:\?.*)?$/i));

                            if (isImage) {
                                return (
                                    <div 
                                        key={idx} 
                                        className="relative group overflow-hidden rounded-2xl border border-slate-200/50 shadow-sm max-w-[240px] sm:max-w-xs cursor-pointer block p-0 outline-none active:scale-[0.98] transition-transform z-10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log("🔥 [CLICK EVENT] Đã kích hoạt mở ảnh:", att.url);
                                            setPreviewImage(att);
                                        }}
                                    >
                                        <img 
                                            src={att.url} 
                                            alt={att.fileName || 'image'} 
                                            className="w-full object-cover bg-slate-100 block pointer-events-none select-none" 
                                            style={{ maxHeight: '280px' }} 
                                        />
                                        {/* Lớp phủ mờ báo hiệu có thể click xem */}
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                );
                            }
                            
                            // Giao diện cho File tài liệu (PDF, Word, Zip...)
                            return (
                                <button
                                    key={idx} 
                                    type="button"
                                    onClick={(e) => handleDownloadFile(e, att.url, att.fileName)}
                                    className={`flex items-center gap-3 p-3 rounded-2xl border shadow-sm transition-colors max-w-[240px] sm:max-w-xs cursor-pointer text-left w-full
                                        ${isMine ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isMine ? 'bg-slate-700 text-slate-300' : 'bg-blue-50 text-blue-500'}`}>
                                        {getFileIcon(att.fileName)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{att.fileName || 'Tài liệu đính kèm'}</div>
                                        {att.size && <div className={`text-xs mt-0.5 ${isMine ? 'text-slate-400' : 'text-slate-500'}`}>{(att.size / 1024).toFixed(1)} KB</div>}
                                    </div>
                                    <div className={`p-2 rounded-full shrink-0 ${isMine ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}>
                                        <Download size={16} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Phân vùng 2: Khung chữ văn bản */}
                {hasText && (
                    <div className={`px-4 py-2.5 shadow-sm ${isMine ? 'bg-slate-900 text-white rounded-[1.4rem] rounded-br-sm' : 'bg-white text-slate-900 rounded-[1.4rem] rounded-bl-sm border border-slate-100'}`}>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.text}</div>
                    </div>
                )}

                {/* Phân vùng 3: Trạng thái và thời gian */}
                <div className={`flex items-center gap-1 mt-0.5 px-1 text-slate-400`}>
                    <span className="text-[11px]">{m.time}</span>
                    {getStatusIcon()}
                </div>
            </div>

            {isMine && <div className="w-8 h-8 shrink-0" />}

            {/* Modal hiển thị ảnh phóng to (Lightbox) */}
            {previewImage && createPortal(
                <div 
                    className="fixed flex flex-col" 
                    style={{ 
                        top: 0, left: 0, right: 0, bottom: 0,
                        width: '100vw', height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.92)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        zIndex: 10000000,
                        display: 'flex'
                    }}
                >
                    {console.log("🛠 [PORTAL RENDER] Modal ảnh đang hiển thị")}
                    {/* Thanh công cụ phía trên (Header) ép về bên phải */}
                    <div 
                        className="z-50 shrink-0"
                        style={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            gap: '10px', // Khoảng cách giữa 2 nút (Tải về và X)
                            padding: '5px 32px' // Spacing: 24px lề trên/dưới, 32px lề trái/phải
                        }}
                    >
                        <a 
                            href={getDownloadUrl(previewImage.url)}
                            download={previewImage.fileName || 'image.jpg'}
                            target="_blank"
                            rel="noopener noreferrer"
                             className="text-white opacity-80 hover:opacity-100 transition-all hover:scale-125 flex items-center justify-center"
                            title="Tải ảnh về máy"
                        >
                             <Download size={28} color="white" strokeWidth={2.5} />
                        </a>
                        <button 
                             type="button"
                             className="text-white opacity-80 hover:opacity-100 transition-all hover:scale-125 cursor-pointer outline-none flex items-center justify-center appearance-none bg-transparent border-none"
                             onClick={() => {
                                 console.log("❌ [CLOSE EVENT] Đã bấm nút đóng");
                                 setPreviewImage(null);
                             }}
                            title="Đóng (X)"
                        >
                             <X size={28} color="white" strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Vùng hiển thị ảnh */}
                    <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
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
