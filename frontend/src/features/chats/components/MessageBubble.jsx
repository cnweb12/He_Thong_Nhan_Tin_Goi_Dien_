import React from 'react';
import { Clock, Check, AlertCircle, FileText, Download } from 'lucide-react';

export default function MessageBubble({ m, isMine }) {
    const getStatusIcon = () => {
        if (!isMine || !m.status) return null;

        switch (m.status) {
            case 'sending':
                return <Clock className="w-3 h-3 text-gray-400" />;
            case 'sent':
                return <Check className="w-3 h-3 text-blue-400" />;
            case 'error':
                return <AlertCircle className="w-3 h-3 text-red-400" />;
            default:
                return null;
        }
    };

    const hasAttachments = Array.isArray(m.attachments) && m.attachments.length > 0;

    return (
        <div className={`flex items-end ${isMine ? 'justify-end' : 'justify-start'} gap-3`}>
            {!isMine && <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-700 shrink-0">T</div>}

            <div className={`px-4 py-3 max-w-[74%] shadow-[0_10px_30px_rgba(15,23,42,0.06)] ${isMine ? 'bg-slate-900 text-white rounded-[1.2rem] rounded-br-md' : 'bg-white text-slate-900 rounded-[1.2rem] rounded-bl-md border border-slate-100'}`}>
                {hasAttachments && (
                    <div className="flex flex-col gap-2 mb-2">
                        {m.attachments.map((att, idx) => {
                            const isImage = att.mimeType?.startsWith('image/') || m.type === 'image';
                            if (isImage) {
                                return (
                                    <div key={idx} className="rounded-lg overflow-hidden border border-slate-200/20 max-w-full">
                                        <img src={att.url} alt={att.fileName} className="max-w-full max-h-60 object-contain bg-slate-100/10" />
                                    </div>
                                );
                            }
                            return (
                                <a 
                                    key={idx} 
                                    href={att.url} 
                                    download={att.fileName}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isMine ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'}`}
                                >
                                    <FileText className={isMine ? 'text-white/80' : 'text-slate-500'} size={24} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{att.fileName}</div>
                                        {att.size && <div className={`text-xs ${isMine ? 'text-white/60' : 'text-slate-400'}`}>{(att.size / 1024).toFixed(1)} KB</div>}
                                    </div>
                                    <Download size={18} className={isMine ? 'text-white/80' : 'text-slate-400'} />
                                </a>
                            );
                        })}
                    </div>
                )}
                {m.text && <div className="text-sm leading-6 whitespace-pre-wrap break-words">{m.text}</div>}
                <div className={`flex items-center gap-1 mt-1 ${isMine ? 'text-white/75' : 'text-slate-500'}`}>
                    <span className="text-[11px]">{m.time}</span>
                    {getStatusIcon()}
                </div>
            </div>

            {isMine && <div className="w-8 h-8 shrink-0" />}
        </div>
    );
}
