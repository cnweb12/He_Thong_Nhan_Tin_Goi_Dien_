import React, { useEffect, useRef, useState } from 'react';
import { Paperclip, Send, Smile, X, FileText } from 'lucide-react';
import { IconButton } from '../../../components/ui';

const resizeTextarea = (textarea) => {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
};

export default function MessageInput({ onSend, disabled = false, sending = false }) {
    const [text, setText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        resizeTextarea(textareaRef.current);
    }, [text]);

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
                url: event.target.result,
            });
        };
        reader.readAsDataURL(file);

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
                        file: selectedFile.file,
                    }],
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
        <div className="flex flex-col bg-white border-t border-slate-200 shrink-0">
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
            <div className="p-3 sm:p-4 flex items-end gap-3">
                <div className="flex items-center gap-1 text-slate-500 pb-0.5">
                    <IconButton icon={Smile} label="Emoji" disabled />
                    <IconButton icon={Paperclip} label="Đính kèm tệp" onClick={() => fileInputRef.current?.click()} />
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={disabled || sending}
                    />
                </div>

                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập tin nhắn..."
                    className="min-h-10 flex-1 resize-none overflow-y-auto rounded-2xl border-transparent bg-slate-100 px-4 py-2.5 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <IconButton
                    icon={Send}
                    label="Gửi tin nhắn"
                    onClick={send}
                    disabled={disabled || sending || (!text.trim() && !selectedFile)}
                    className="h-10 w-10 bg-blue-500 text-white shadow-lg hover:bg-blue-600 disabled:bg-slate-300"
                />
            </div>
        </div>
    );
}
