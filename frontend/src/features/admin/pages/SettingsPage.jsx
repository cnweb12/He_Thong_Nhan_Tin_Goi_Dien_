import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { getSystemSettingsApi, updateSystemSettingsApi } from '../services/adminApi';

export default function SettingsPage() {
  const { accessToken } = useAuth();

  const [settings, setSettings] = useState({});
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadSettings = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getSystemSettingsApi(accessToken);
      setSettings(result || {});
      const initialDraft = {};
      Object.entries(result || {}).forEach(([key, item]) => {
        initialDraft[key] = item?.value;
      });
      setDraft(initialDraft);
    } catch (err) {
      setError(err.message || 'Không tải được cài đặt hệ thống');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (key, value, type) => {
    let parsed = value;
    if (type === 'number') parsed = value === '' ? '' : Number(value);
    if (type === 'boolean') parsed = value;
    setDraft((prev) => ({ ...prev, [key]: parsed }));
  };

  const handleSave = async () => {
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateSystemSettingsApi(accessToken, draft);
      setSuccess('Đã lưu cài đặt thành công.');
      await loadSettings();
    } catch (err) {
      setError(err.message || 'Lưu cài đặt thất bại');
    } finally {
      setSaving(false);
    }
  };

  const entries = Object.entries(settings);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Cài đặt hệ thống</h1>
        <p className="text-sm text-slate-500 mt-1">Cấu hình toàn hệ thống áp dụng cho mọi người dùng</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
          {success}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-8 text-center text-slate-500">
          Đang tải...
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-8 text-center text-slate-500">
          Chưa có cài đặt nào được khởi tạo.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {entries.map(([key, item]) => {
            const type = item?.type || 'string';
            const value = draft[key];
            return (
              <div key={key} className="px-4 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 font-mono text-sm">{key}</p>
                  {item?.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {type === 'boolean' ? (
                    <button
                      type="button"
                      onClick={() => handleChange(key, !value, 'boolean')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        value ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  ) : type === 'number' ? (
                    <input
                      type="number"
                      value={value ?? ''}
                      onChange={(e) => handleChange(key, e.target.value, 'number')}
                      className="w-32 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value ?? ''}
                      onChange={(e) => handleChange(key, e.target.value, 'string')}
                      className="w-56 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {entries.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2.5 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      )}
    </div>
  );
}
