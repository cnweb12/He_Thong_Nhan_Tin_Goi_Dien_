import React, { useRef, useState } from 'react';
import { Paperclip, Send, Smile, X, Image as ImageIcon, FileText } from 'lucide-react';

export default function MessageInput({ onSend, disabled = false, sending = false }) {
    const [text, setText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            setSelectedFile({
                file,
                fileName: file.name,
                mimeType: file.type,
                size: file.size,
                url: event.target.result // Base64 data URL
            });
        };
        reader.readAsDataURL(file);
        
        // Reset input value so same file can be selected again if removed
        e.target.value = null;
    };

    const send = async () => {
        const message = text.trim();
        if ((!message && !selectedFile) || disabled || sending) return;

        try {
            if (selectedFile) {
                const isImage = selectedFile.mimeType.startsWith('image/');
                await onSend({
                    text: message,
                    type: isImage ? 'image' : 'file',
                    attachments: [{
                        fileName: selectedFile.fileName,
                        url: selectedFile.url,
                        mimeType: selectedFile.mimeType,
                        size: selectedFile.size,
                        file: selectedFile.file
                    }]
                });
                setSelectedFile(null);
            } else {
                await onSend(message);
            }
            setText('');
        } catch {
            // Keep the draft so the user can retry after a backend error.
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            send();
        }
    };

    return (
        <div className="flex flex-col bg-white/90 backdrop-blur border-t border-slate-200 shrink-0">
            {selectedFile && (
                <div className="px-4 pt-3 pb-1">
                    <div className="relative inline-block group">
                        <button 
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="absolute -top-2 -right-2 bg-slate-800 text-white hover:bg-slate-900 border border-white rounded-full p-1 shadow-sm z-10 transition-colors cursor-pointer"
                            title="Xóa tệp đính kèm"
                        >
                            <X size={14} />
                        </button>
                        
                        {selectedFile.mimeType.startsWith('image/') ? (
                            <div 
                                className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-slate-100 flex-shrink-0"
                                style={{ width: '160px', height: '160px' }}
                            >
                                <img src={selectedFile.url} alt="preview" className="w-full h-full object-cover block" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 shadow-sm max-w-xs pr-6">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-700 truncate">{selectedFile.fileName}</p>
                                    <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="p-4 flex items-center gap-3">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    // Allow images and common files
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                />
                <div className="flex items-center gap-1 text-slate-600">
                    <button type="button" className="p-2.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"><Smile size={18} /></button>
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Đính kèm tệp"
                    >
                        <Paperclip size={18} />
                    </button>
                </div>

                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-4 py-3.5 rounded-[1.2rem] border border-slate-200 bg-slate-50 shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-300"
                />
                <button
                    onClick={send}
                    disabled={disabled || sending || (!text.trim() && !selectedFile)}
                    className="w-11 h-11 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-[0_14px_28px_rgba(15,23,42,0.20)] hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}
