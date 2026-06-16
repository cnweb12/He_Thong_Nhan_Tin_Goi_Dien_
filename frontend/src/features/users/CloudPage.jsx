import React, { useEffect, useRef, useState } from 'react';
import { 
  Cloud, Send, Paperclip, FileText, Image as ImageIcon, 
  Trash2, Download, Search, CheckCircle2, UserRound, X
} from 'lucide-react';
import { uploadFilesApi } from '../../services/upload.service';

export default function CloudPage({ accessToken, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const currentUserId = currentUser?.userId || currentUser?.id || currentUser?._id || 'guest';
  const localStorageKey = `cloud_messages_${currentUserId}`;

  // Load history from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(localStorageKey);
    if (raw) {
      try {
        setMessages(JSON.parse(raw));
      } catch (e) {
        console.error('Không tải được lịch sử Cloud:', e);
      }
    } else {
      // Seed default welcome message
      const welcome = {
        id: 'welcome',
        text: 'Chào mừng bạn đến với Cloud của tôi! Đây là không gian riêng tư của bạn để lưu trữ nhanh các tin nhắn, hình ảnh và tài liệu quan trọng.',
        createdAt: new Date().toISOString(),
        type: 'text',
        attachments: []
      };
      setMessages([welcome]);
      localStorage.setItem(localStorageKey, JSON.stringify([welcome]));
    }
  }, [localStorageKey]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveMessagesToLocal = (newMsgs) => {
    setMessages(newMsgs);
    localStorage.setItem(localStorageKey, JSON.stringify(newMsgs));
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
        url: event.target.result // preview base64
      });
    };
    reader.readAsDataURL(file);
    e.target.value = null; // reset
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text && !selectedFile) return;

    let finalAttachments = [];
    setUploading(true);

    try {
      if (selectedFile) {
        setStatusMsg('Đang tải tệp lên Cloud...');
        // Call backend upload api to store the file
        const uploaded = await uploadFilesApi([selectedFile.file], accessToken);
        if (uploaded && uploaded.length > 0) {
          finalAttachments = uploaded.map((f) => ({
            fileName: f.originalname,
            url: f.url,
            mimeType: f.mimetype,
            size: f.size
          }));
        }
      }

      const newMsg = {
        id: `cloud-${Date.now()}`,
        text,
        createdAt: new Date().toISOString(),
        type: selectedFile ? (selectedFile.mimeType.startsWith('image/') ? 'image' : 'file') : 'text',
        attachments: finalAttachments
      };

      const updated = [...messages, newMsg];
      saveMessagesToLocal(updated);
      setInputText('');
      setSelectedFile(null);
      setStatusMsg('Đã lưu trữ thành công!');
      setTimeout(() => setStatusMsg(null), 2000);
    } catch (err) {
      console.error('Không tải được tệp:', err);
      alert('Không tải được tệp lên máy chủ. Đang gửi tạm dưới dạng văn bản.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMessage = (msgId) => {
    if (!window.confirm('Bạn muốn xóa mục này khỏi Cloud?')) return;
    const updated = messages.filter((m) => m.id !== msgId);
    saveMessagesToLocal(updated);
  };

  const handleClearAll = () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử Cloud? Hành động này không thể hoàn tác.')) return;
    saveMessagesToLocal([]);
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' });
  };

  // Filter messages by search query
  const filteredMessages = messages.filter((m) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const matchesText = (m.text || '').toLowerCase().includes(query);
    const matchesFile = (m.attachments || []).some((a) => (a.fileName || '').toLowerCase().includes(query));
    return matchesText || matchesFile;
  });

  return (
    <div className="w-full h-full flex overflow-hidden bg-slate-50 dark:bg-[#0e1621]">
      {/* Cột trái phụ: Cloud Stats & Search */}
      <div className="hidden md:flex w-[280px] h-full bg-white border-r border-slate-200 flex-col flex-shrink-0 dark:bg-[#232e3c] dark:border-[#1e2d3d]">
        <div className="p-4 border-b border-slate-200 dark:border-[#1e2d3d]">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 dark:text-slate-100">
            <Cloud className="text-blue-500" size={20} />
            Cloud của tôi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Bộ nhớ truyền tin cá nhân</p>
        </div>

        <div className="p-3 border-b border-slate-200 dark:border-[#1e2d3d]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tin nhắn, tệp..."
              className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-xs transition dark:bg-[#1c2b38] dark:border-[#1e2d3d] dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trạng thái bộ nhớ</p>
              <div className="mt-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl dark:bg-[#1c2b38] dark:border-[#1e2d3d]">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Tổng số tệp/ghi chú</p>
                <p className="text-lg font-extrabold text-blue-600 mt-1">{messages.length}</p>
                <p className="text-[10px] text-slate-400 mt-1">Dữ liệu được lưu an toàn trên trình duyệt này.</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mẹo sử dụng</p>
              <ul className="mt-2 text-xs text-slate-500 space-y-2 list-disc pl-4">
                <li>Kéo thả hoặc dán hình ảnh để gửi nhanh.</li>
                <li>Hỗ trợ tải lên mọi định dạng tệp (PDF, Word, Excel).</li>
                <li>Dữ liệu đồng bộ với server qua link tải an toàn.</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleClearAll}
            className="w-full py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer dark:border-red-900/40 dark:hover:bg-red-900/20"
          >
            <Trash2 size={13} />
            Xóa toàn bộ bộ nhớ Cloud
          </button>
        </div>
      </div>

      {/* Cột phải: Chat Area */}
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-slate-100 dark:bg-[#0e1621]">
        {/* Header */}
        <header className="h-[68px] border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 dark:border-[#1e2d3d] dark:bg-[#17212b]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-md">
              <Cloud size={22} />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-sm dark:text-slate-100">Cloud của tôi</h1>
              <p className="text-xs text-green-500 font-medium">Không gian cá nhân riêng tư</p>
            </div>
          </div>
        </header>

        {/* Thông báo tải tệp */}
        {statusMsg && (
          <div className="mx-6 mt-4 p-2.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm shrink-0">
            <CheckCircle2 size={14} className="text-blue-600 animate-pulse" />
            {statusMsg}
          </div>
        )}

        {/* Danh sách ghi chú */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Cloud size={48} className="text-slate-200 mb-2" />
              <p className="text-sm font-semibold">Thư mục trống</p>
              <p className="text-xs mt-1">Chưa tìm thấy ghi chú hoặc tài liệu nào phù hợp.</p>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
              const prevMsg = filteredMessages[idx - 1];
              const showDateHeader = !prevMsg || 
                new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

              return (
                <div key={msg.id} className="space-y-3">
                  {showDateHeader && (
                    <div className="flex justify-center my-4">
                      <span className="bg-slate-200/80 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {formatDateHeader(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end group">
                    <div className="max-w-[70%] flex flex-col items-end">
                      <div className="bg-blue-600 text-white rounded-2xl p-3 shadow-md relative group hover:shadow-lg transition">
                        {/* Nút xóa */}
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="absolute -left-9 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
                          title="Xóa dòng này"
                        >
                          <Trash2 size={13} />
                        </button>

                        {/* Văn bản */}
                        {msg.text && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap select-text">{msg.text}</p>
                        )}

                        {/* Tệp đính kèm */}
                        {msg.attachments && msg.attachments.map((file, fIdx) => {
                          const isImg = file.mimeType?.startsWith('image/') || msg.type === 'image';
                          return (
                            <div key={fIdx} className={`mt-2 ${msg.text ? 'border-t border-white/20 pt-2' : ''}`}>
                              {isImg ? (
                                <a href={file.url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-white/10 max-w-sm">
                                  <img src={file.url} alt="cloud preview" className="max-h-60 w-full object-cover block" />
                                </a>
                              ) : (
                                <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-xl p-3 max-w-sm">
                                  <div className="h-9 w-9 bg-white/25 text-white flex items-center justify-center rounded-lg">
                                    <FileText size={18} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate text-white">{file.fileName}</p>
                                    <p className="text-[10px] text-white/70">{(file.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                  <a
                                    href={file.url}
                                    download={file.fileName}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition"
                                    title="Tải tệp"
                                  >
                                    <Download size={14} />
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <span className="text-[10px] text-slate-400 font-semibold mt-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Khung soạn thảo */}
        <div className="flex flex-col bg-white border-t border-slate-200 shrink-0 dark:bg-[#17212b] dark:border-[#1e2d3d]">
          {selectedFile && (
            <div className="px-4 pt-3 pb-1">
              <div className="relative inline-block group">
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="absolute -top-2 -right-2 bg-slate-700 text-white hover:bg-slate-800 border-2 border-white rounded-full p-0.5 shadow-md z-10 cursor-pointer"
                  title="Hủy đính kèm"
                >
                  <X size={12} />
                </button>

                {selectedFile.mimeType.startsWith('image/') ? (
                  <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-slate-100" style={{ width: '100px', height: '100px' }}>
                    <img src={selectedFile.url} alt="preview" className="w-full h-full object-cover block" />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-lg py-1.5 px-3 max-w-xs pr-6">
                    <FileText size={16} className="text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{selectedFile.fileName}</p>
                      <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-4 flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex-shrink-0 cursor-pointer disabled:opacity-50 dark:bg-[#1c2b38] dark:hover:bg-[#223044] dark:text-slate-300"
              title="Đính kèm tài liệu hoặc ảnh"
            >
              <Paperclip size={18} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Nhập ghi chú nhanh hoặc tin nhắn..."
              disabled={uploading}
              className="flex-1 px-4 py-2.5 bg-slate-150 border-transparent rounded-2xl outline-none focus:bg-slate-100 focus:ring-2 focus:ring-blue-500 transition text-sm disabled:opacity-50 dark:bg-[#1c2b38] dark:text-slate-100 dark:placeholder-slate-500"
            />

            <button
              onClick={handleSend}
              disabled={uploading || (!inputText.trim() && !selectedFile)}
              className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition shrink-0 cursor-pointer disabled:opacity-50 disabled:bg-slate-350"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
