import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { getAllMessagesApi, deleteMessageApi } from '../services/adminApi';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
};

export default function MessagesPage() {
  const { accessToken } = useAuth();

  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [conversationId, setConversationId] = useState('');
  const [senderId, setSenderId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadMessages = useCallback(async (page = 1) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getAllMessagesApi(accessToken, {
        page,
        limit: 50,
        conversationId: conversationId || undefined,
        senderId: senderId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setMessages(result.messages || []);
      setPagination(result.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Không tải được danh sách tin nhắn');
    } finally {
      setLoading(false);
    }
  }, [accessToken, conversationId, senderId, startDate, endDate]);

  useEffect(() => {
    loadMessages(1);
  }, [loadMessages]);

  const handleDelete = async (message) => {
    if (!accessToken) return;
    if (!window.confirm('Xóa tin nhắn này? Hành động không thể hoàn tác.')) return;
    setActionError(null);
    setBusyId(message._id);
    try {
      await deleteMessageApi(accessToken, message._id);
      await loadMessages(pagination.page);
    } catch (err) {
      setActionError(err.message || 'Xóa tin nhắn thất bại');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Tin nhắn</h1>
        <p className="text-sm text-slate-500 mt-1">Tổng {pagination.total} tin nhắn</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Conversation ID</label>
          <input
            type="text"
            value={conversationId}
            onChange={(e) => setConversationId(e.target.value)}
            placeholder="ID hội thoại"
            className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Sender ID</label>
          <input
            type="text"
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
            placeholder="ID người gửi"
            className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Từ ngày</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Đến ngày</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={() => loadMessages(1)}
          className="px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Tìm kiếm
        </button>
      </div>

      {actionError && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {actionError}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Nội dung</th>
              <th className="px-4 py-3 font-medium">Người gửi</th>
              <th className="px-4 py-3 font-medium">Hội thoại</th>
              <th className="px-4 py-3 font-medium">Thời gian</th>
              <th className="px-4 py-3 font-medium text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Đang tải...</td>
              </tr>
            )}
            {!loading && messages.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Không có tin nhắn nào.</td>
              </tr>
            )}
            {!loading && messages.map((m) => (
              <tr key={m._id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-slate-800 truncate">
                    {m.text || (m.type === 'image' ? '[Hình ảnh]' : m.type === 'file' ? '[Tệp đính kèm]' : '')}
                  </p>
                  {m.isDeleted && (
                    <span className="text-xs text-red-500">Đã bị xóa</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{m.senderId}</td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{m.conversationId}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(m.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  {!m.isDeleted && (
                    <button
                      type="button"
                      disabled={busyId === m._id}
                      onClick={() => handleDelete(m)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => loadMessages(pagination.page - 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50"
          >
            Trước
          </button>
          <span className="text-sm text-slate-500">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => loadMessages(pagination.page + 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
