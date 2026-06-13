import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Eye, EyeOff, Loader2, LockKeyhole, Save, ShieldCheck, UserRound, Smartphone, Laptop, Globe, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SidebarLeft from '../../components/SidebarLeft';
import { useAuth } from '../auth/hooks/useAuth';
import { changePasswordApi } from '../auth/services/authApi';
import {
  getCurrentUserProfileApi,
  updateCurrentUserProfileApi,
  updateCurrentUserSettingsApi,
} from './services/userApi';
import { getMyDevicesApi } from '../devices/services/deviceApi';

const formatDateTime = (value) => {
  if (!value) return 'Chưa có dữ liệu';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có dữ liệu';

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getInitials = (name) => {
  const normalized = String(name || '').trim();
  if (!normalized) return 'U';

  return normalized
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const normalizeProfileForm = (profile) => ({
  displayName: profile?.displayName || '',
  username: profile?.username || '',
  avatarUrl: profile?.avatarUrl || '',
});

const normalizeSettingsForm = (settings = {}) => ({
  theme: settings.theme || 'light',
  language: settings.language || 'vi',
  allowStrangerMessage: settings.allowStrangerMessage !== false,
  readReceiptEnabled: settings.readReceiptEnabled !== false,
});

export default function ProfilePage() {
  const navigate = useNavigate();
  const { accessToken, user, forceLogout, syncCurrentUser, restoreSession } = useAuth();
  const [profile, setProfile] = useState(user || null);
  const [profileForm, setProfileForm] = useState(() => normalizeProfileForm(user));
  const [settingsForm, setSettingsForm] = useState(() => normalizeSettingsForm(user?.settings));
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const resolvedAccessToken = useMemo(() => accessToken, [accessToken]);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = resolvedAccessToken || await restoreSession();
        if (!token) {
          throw new Error('Phiên đăng nhập đã hết hạn');
        }

        // Tải thông tin hồ sơ và danh sách thiết bị song song
        const [loadedProfile, loadedDevices] = await Promise.all([
          getCurrentUserProfileApi(token),
          getMyDevicesApi(token).catch(err => {
            console.error('Không tải được danh sách thiết bị', err);
            return [];
          })
        ]);

        if (!active) return;

        setProfile(loadedProfile);
        setProfileForm(normalizeProfileForm(loadedProfile));
        setSettingsForm(normalizeSettingsForm(loadedProfile?.settings));
        setDevices(Array.isArray(loadedDevices) ? loadedDevices : []);
        syncCurrentUser(loadedProfile);
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'Không tải được hồ sơ');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [resolvedAccessToken, restoreSession, syncCurrentUser]);

  const getToken = async () => {
    const token = accessToken || await restoreSession();
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn');
    }
    return token;
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  };

  const handleSettingsChange = (event) => {
    const { name, value, checked, type } = event.target;
    setSettingsForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setError(null);
    setNotice(null);

    try {
      const token = await getToken();
      const payload = {
        displayName: profileForm.displayName.trim(),
      };

      if (profileForm.username.trim()) {
        payload.username = profileForm.username.trim();
      }

      if (profileForm.avatarUrl.trim()) {
        payload.avatarUrl = profileForm.avatarUrl.trim();
      }

      const updatedProfile = await updateCurrentUserProfileApi(token, payload);
      setProfile(updatedProfile);
      setProfileForm(normalizeProfileForm(updatedProfile));
      setSettingsForm(normalizeSettingsForm(updatedProfile?.settings));
      syncCurrentUser(updatedProfile);
      setNotice('Đã lưu hồ sơ.');
    } catch (err) {
      setError(err?.message || 'Không lưu được hồ sơ');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSavingSettings(true);
    setError(null);
    setNotice(null);

    try {
      const token = await getToken();
      const updatedProfile = await updateCurrentUserSettingsApi(token, settingsForm);
      setProfile(updatedProfile);
      setSettingsForm(normalizeSettingsForm(updatedProfile?.settings));
      syncCurrentUser(updatedProfile);
      setNotice('Đã lưu cài đặt.');
    } catch (err) {
      setError(err?.message || 'Không lưu được cài đặt');
    } finally {
      setSavingSettings(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setChangingPassword(true);
    setError(null);
    setNotice(null);

    try {
      if (passwordForm.newPassword.length < 6) {
        throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('Xác nhận mật khẩu không khớp');
      }

      const token = await getToken();
      await changePasswordApi(token, passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setNotice('Đã đổi mật khẩu. Bạn sẽ được chuyển về màn hình đăng nhập.');
      window.setTimeout(() => {
        forceLogout();
      }, 900);
    } catch (err) {
      setError(err?.message || 'Không đổi được mật khẩu');
    } finally {
      setChangingPassword(false);
    }
  };

  const avatarLabel = getInitials(profile?.displayName || profile?.phone);

  return (
    <div className="relative h-screen flex w-full overflow-hidden text-slate-900 bg-[linear-gradient(135deg,_#f8fafc_0%,_#eef2f7_45%,_#f6f9fc_100%)]">
      <div className="z-20 h-full flex-shrink-0 relative">
        <SidebarLeft active="account" onSelect={() => navigate('/')} />
      </div>

      <main className="flex-1 min-w-0 h-full overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-5 py-6 lg:px-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none"
            >
              <ArrowLeft size={17} />
              Quay lại chat
            </button>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Tài khoản</p>
              <h1 className="text-2xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {notice && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <Check size={17} />
              {notice}
            </div>
          )}

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-600 shadow-sm">
                <Loader2 className="animate-spin" size={20} />
                Đang tải hồ sơ...
              </div>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(280px,360px)_1fr]">
              <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-slate-900 text-3xl font-bold text-white">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.displayName || 'Avatar'} className="h-full w-full object-cover" />
                    ) : (
                      avatarLabel
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{profile?.displayName || 'Người dùng'}</h2>
                  <p className="mt-1 text-sm text-slate-500">{profile?.phone || 'Chưa có số điện thoại'}</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    <ShieldCheck size={15} />
                    {profile?.role || 'user'}
                  </div>
                </div>

                <dl className="mt-6 space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-400">User ID</dt>
                    <dd className="break-all font-medium text-slate-700">{profile?.userId || profile?._id || profile?.id || 'Chưa có dữ liệu'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Username</dt>
                    <dd className="font-medium text-slate-700">{profile?.username || 'Chưa thiết lập'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Ngày tạo</dt>
                    <dd className="font-medium text-slate-700">{formatDateTime(profile?.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Cập nhật</dt>
                    <dd className="font-medium text-slate-700">{formatDateTime(profile?.updatedAt)}</dd>
                  </div>
                </dl>
              </aside>

              <div className="space-y-5">
                <form onSubmit={saveProfile} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <UserRound size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Thông tin hiển thị</h2>
                      <p className="text-sm text-slate-500">Cập nhật tên, username và ảnh đại diện.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Tên hiển thị</span>
                      <input
                        name="displayName"
                        value={profileForm.displayName}
                        onChange={handleProfileChange}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        minLength={2}
                        maxLength={100}
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Username</span>
                      <input
                        name="username"
                        value={profileForm.username}
                        onChange={handleProfileChange}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder="username"
                      />
                    </label>
                  </div>

                  <label className="mt-4 block">
                    <span className="text-sm font-semibold text-slate-700">Avatar URL</span>
                    <input
                      name="avatarUrl"
                      value={profileForm.avatarUrl}
                      onChange={handleProfileChange}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      placeholder="https://..."
                    />
                  </label>

                  <div className="mt-5 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                      {savingProfile ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
                      Lưu hồ sơ
                    </button>
                  </div>
                </form>

                <form onSubmit={saveSettings} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Eye size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Cài đặt riêng tư</h2>
                      <p className="text-sm text-slate-500">Đồng bộ với settings của tài khoản hiện tại.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Giao diện</span>
                      <select
                        name="theme"
                        value={settingsForm.theme}
                        onChange={handleSettingsChange}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="light">Sáng</option>
                        <option value="dark">Tối</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Ngôn ngữ</span>
                      <input
                        name="language"
                        value={settingsForm.language}
                        onChange={handleSettingsChange}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        maxLength={10}
                      />
                    </label>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
                      <span className="text-sm font-semibold text-slate-700">Cho người lạ nhắn tin</span>
                      <input
                        type="checkbox"
                        name="allowStrangerMessage"
                        checked={settingsForm.allowStrangerMessage}
                        onChange={handleSettingsChange}
                        className="h-5 w-5 accent-blue-600"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
                      <span className="text-sm font-semibold text-slate-700">Bật xác nhận đã đọc</span>
                      <input
                        type="checkbox"
                        name="readReceiptEnabled"
                        checked={settingsForm.readReceiptEnabled}
                        onChange={handleSettingsChange}
                        className="h-5 w-5 accent-blue-600"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {savingSettings ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
                      Lưu cài đặt
                    </button>
                  </div>
                </form>

                <form onSubmit={changePassword} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <LockKeyhole size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Bảo mật</h2>
                      <p className="text-sm text-slate-500">Đổi mật khẩu sẽ đăng xuất khỏi các phiên hiện tại.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Mật khẩu hiện tại</span>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Mật khẩu mới</span>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        minLength={6}
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Xác nhận</span>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        minLength={6}
                        required
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
                    >
                      {changingPassword ? <Loader2 className="animate-spin" size={17} /> : <EyeOff size={17} />}
                      Đổi mật khẩu
                    </button>
                  </div>
                </form>

                {/* ── Thiết bị đang hoạt động ── */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Thiết bị hoạt động</h2>
                      <p className="text-sm text-slate-500">Các thiết bị đã từng đăng nhập và kết nối vào hệ thống này.</p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {devices.length === 0 ? (
                      <p className="text-sm text-slate-500 py-3">Chưa có thông tin thiết bị nào.</p>
                    ) : (
                      devices.map((dev) => {
                        const isCurrent = dev.deviceId === localStorage.getItem('deviceId') || (devices.length === 1);
                        const platform = String(dev.platform || '').toLowerCase();
                        
                        let Icon = Globe;
                        if (platform.includes('win') || platform.includes('mac') || platform.includes('linux')) {
                          Icon = Laptop;
                        } else if (platform.includes('ios') || platform.includes('android') || platform.includes('mobile')) {
                          Icon = Smartphone;
                        }

                        return (
                          <div key={dev._id || dev.deviceId} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`p-2.5 rounded-xl ${isCurrent ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'} flex-shrink-0`}>
                                <Icon size={20} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-slate-800 text-sm truncate">
                                    {dev.platform || 'Thiết bị không xác định'}
                                  </p>
                                  {isCurrent && (
                                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                                      Thiết bị này
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 font-mono truncate select-all">
                                  ID: {dev.deviceId || 'Chưa cung cấp'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right shrink-0">
                              {dev.isOnline ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Trực tuyến
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                                  Ngoại tuyến ({formatDateTime(dev.lastActiveAt)})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
