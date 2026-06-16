import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, Send, Smile, X, FileText } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import { useAppSocket } from '../../realtime/hooks/useAppSocket';

export default function MessageInput({ onSend, disabled = false, sending = false, chatId }) {
    const [text, setText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const { socket, isConnected } = useAppSocket();

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    const emitTypingStart = () => {
        if (socket && isConnected && chatId) {
            socket.emit('typing_start', { conversationId: chatId });
        }
    };

    const emitTypingStop = () => {
        if (socket && isConnected && chatId) {
            socket.emit('typing_stop', { conversationId: chatId });
        }
    };

    const handleTextChange = (e) => {
        setText(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 112)}px`;

        if (e.target.value.trim().length > 0) {
            emitTypingStart();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                emitTypingStop();
            }, 3000);
        } else {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            emitTypingStop();
        }
    };

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

    const send = () => {
        const message = text.trim();
        const currentFile = selectedFile;
        if ((!message && !currentFile) || disabled) return;

        // Clear typing timeout and emit stop
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        emitTypingStop();

        // Optimistic UI: Xóa khung chat ngay lập tức
        setText('');
        setSelectedFile(null);
        setShowEmojiPicker(false);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = '42px';
        }

        if (currentFile) {
            const isImage = currentFile.mimeType.startsWith('image/');
            onSend({
                text: message,
                type: isImage ? 'image' : 'file',
                attachments: [{
                    fileName: currentFile.fileName,
                    url: currentFile.url,
                    mimeType: currentFile.mimeType,
                    size: currentFile.size,
                    file: currentFile.file
                }]
            }).catch(console.error);
        } else {
            onSend(message).catch(console.error);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            send();
        }
    };

    /** Chèn emoji vào vị trí con trỏ trong textarea */
    const handleEmojiSelect = (emoji) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            setText((prev) => prev + emoji);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = text.slice(0, start) + emoji + text.slice(end);
        setText(newText);

        // Đặt lại vị trí con trỏ sau emoji
        requestAnimationFrame(() => {
            textarea.focus();
            const newCursor = start + emoji.length;
            textarea.setSelectionRange(newCursor, newCursor);
            // Cập nhật chiều cao
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
        });
    };

    return (
        <div
            className="flex flex-col bg-white dark:bg-[#17212b] border-t border-slate-200 dark:border-[#1e2d3d] shrink-0"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            {selectedFile && (
                <div className="px-4 pt-3 pb-1">
                    <div className="relative inline-block group">
                        <button 
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="absolute -top-2 -right-2 bg-slate-700 text-white hover:bg-slate-800 border-2 border-white rounded-full p-0.5 shadow-md z-10 transition-colors cursor-pointer"
                            title="Xóa tệp đính kèm"
                        >
                            <X size={14} />
                        </button>
                        
                        {selectedFile.mimeType.startsWith('image/') ? (
                            <div 
                                className="rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-slate-100 flex-shrink-0"
                                style={{ width: '120px', height: '120px' }}
                            >
                                <img src={selectedFile.url} alt="preview" className="w-full h-full object-cover block" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-lg py-2 px-3 shadow-sm max-w-xs pr-6">
                                <div className="w-9 h-9 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                    <FileText size={18} />
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

            <div className="p-3 sm:p-4 flex items-start sm:items-center gap-3">
                {/* Nút emoji + attach */}
                <div className="flex items-center gap-1 text-slate-500 relative">
                    {/* Nút emoji */}
                    <div className="relative">
                        {showEmojiPicker && (
                            <EmojiPicker
                                onSelect={handleEmojiSelect}
                                onClose={() => setShowEmojiPicker(false)}
                            />
                        )}
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker((v) => !v)}
                            className={`p-2 rounded-full transition-colors cursor-pointer ${
                                showEmojiPicker
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
                            }`}
                            title="Chèn emoji"
                        >
                            <Smile size={20} />
                        </button>
                    </div>

                    {/* Nút đính kèm file */}
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Đính kèm tệp"
                    >
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        multiple={false}
                    />
                </div>

                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập tin nhắn mới..."
                    className="flex-1 px-4 py-2.5 max-h-28 resize-none bg-slate-100 dark:bg-[#1c2b38] text-slate-800 dark:text-slate-100 rounded-2xl border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition overflow-y-auto placeholder-slate-400 dark:placeholder-slate-500"
                    style={{ height: '42px' }}
                />
                <button
                    onClick={send}
                    disabled={disabled || (!text.trim() && !selectedFile)}
                    className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}
