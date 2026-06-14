import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  getBannedKeywordsApi,
  addBannedKeywordApi,
  removeBannedKeywordApi,
} from '../services/adminApi';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN');
};

export default function KeywordsPage() {
  const { accessToken } = useAuth();

  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [busyKeyword, setBusyKeyword] = useState(null);

  const loadKeywords = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getBannedKeywordsApi(accessToken);
      setKeywords(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message || 'Không tải được danh sách từ khóa cấm');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const keyword = newKeyword.trim();
    if (!keyword || !accessToken) return;

    setAdding(true);
    setError(null);
    try {
      await addBannedKeywordApi(accessToken, keyword);
      setNewKeyword('');
      await loadKeywords();
    } catch (err) {
      setError(err.message || 'Thêm từ khóa thất bại');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (keyword) => {
    if (!accessToken) return;
    if (!window.confirm(`Xóa từ khóa cấm "${keyword}"?`)) return;

    setBusyKeyword(keyword);
    setError(null);
    try {
      await removeBannedKeywordApi(accessToken, keyword);
      await loadKeywords();
    } catch (err) {
      setError(err.message || 'Xóa từ khóa thất bại');
    } finally {
      setBusyKeyword(null);
    }
  };

  const activeKeywords = keywords.filter((k) => k.isActive !== false);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Từ khóa cấm</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tin nhắn chứa các từ khóa này sẽ bị kiểm soát hoặc chặn
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          placeholder="Nhập từ khóa mới..."
          className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <button
          type="submit"
          disabled={adding || !newKeyword.trim()}
          className="px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
        >
          {adding ? 'Đang thêm...' : 'Thêm từ khóa'}
        </button>
      </form>

      {error && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="px-4 py-8 text-center text-slate-500">Đang tải...</div>
        ) : activeKeywords.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-500">Chưa có từ khóa cấm nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Từ khóa</th>
                <th className="px-4 py-3 font-medium">Ngày thêm</th>
                <th className="px-4 py-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {activeKeywords.map((k) => (
                <tr key={k._id || k.keyword} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-mono text-slate-800">{k.keyword}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(k.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={busyKeyword === k.keyword}
                      onClick={() => handleRemove(k.keyword)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
