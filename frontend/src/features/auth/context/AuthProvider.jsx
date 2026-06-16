import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, logoutApi, logoutAllApi, getMeApi, refreshApi } from '../services/authApi';
import { applyTheme } from '../../../utils/themeUtils';

export const AuthContext = createContext(null);

// refreshToken → localStorage (tồn tại qua reload/đóng tab)
// accessToken  → memory only (bảo mật, không lưu bất kỳ đâu)
// user         → localStorage (để hiển thị nhanh khi bootstrap)
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export function AuthProvider({ children }) {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        // Khởi tạo user từ localStorage để tránh flash trắng
        try {
            const raw = localStorage.getItem(USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [bootstrapping, setBootstrapping] = useState(true);
    const [error, setError] = useState(null);

    const clearSession = useCallback(() => {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setAccessToken(null);
        setIsAuthenticated(false);
    }, []);

    const restoreSession = useCallback(async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
            clearSession();
            return null;
        }

        try {
            const refreshed = await refreshApi(refreshToken);
            if (!refreshed?.accessToken) {
                throw new Error('Không thể khôi phục phiên đăng nhập');
            }
            setAccessToken(refreshed.accessToken);
            return refreshed.accessToken;
        } catch {
            clearSession();
            return null;
        }
    }, [clearSession]);

    // Bootstrap: chạy 1 lần khi app khởi động
    useEffect(() => {
        let active = true;

        const bootstrap = async () => {
            setBootstrapping(true);
            setError(null);

            try {
                const token = await restoreSession();
                if (!active || !token) return;

                const profile = await getMeApi(token);
                if (!active) return;

                if (profile) {
                    setUser(profile);
                    localStorage.setItem(USER_KEY, JSON.stringify(profile));
                    // Áp dụng theme sau khi lấy được profile từ server
                    applyTheme(profile?.settings?.theme || 'light');
                }
                setIsAuthenticated(true);
            } catch {
                if (!active) return;
                clearSession();
            } finally {
                if (active) setBootstrapping(false);
            }
        };

        bootstrap();
        return () => { active = false; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const login = useCallback(async (phone, password) => {
        setLoading(true);
        setError(null);

        try {
            const data = await loginApi(phone, password);
            if (!data?.accessToken) throw new Error('Đăng nhập thất bại');

            setAccessToken(data.accessToken);

            if (data.refreshToken) {
                localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
            }
            if (data.user) {
                localStorage.setItem(USER_KEY, JSON.stringify(data.user));
                setUser(data.user);
                // Áp dụng theme ngay sau đăng nhập
                applyTheme(data.user?.settings?.theme || 'light');
            }

            setIsAuthenticated(true);
            navigate('/');
            return data;
        } catch (err) {
            setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
            return null;
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    const logout = useCallback(() => {
        (async () => {
            try { await logoutApi(accessToken); } catch { /* ignore */ }
            clearSession();
            navigate('/login');
        })();
    }, [accessToken, clearSession, navigate]);

    const logoutAll = useCallback(async () => {
        try { await logoutAllApi(accessToken); } catch { /* ignore */ }
        clearSession();
        navigate('/login');
    }, [accessToken, clearSession, navigate]);

    const forceLogout = useCallback(() => {
        clearSession();
        navigate('/login');
    }, [clearSession, navigate]);

    const syncCurrentUser = useCallback((profile) => {
        if (!profile) return;
        setUser(profile);
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
    }, []);

    const fetchCurrentUser = useCallback(async () => {
        let token = accessToken;
        if (!token) token = await restoreSession();
        if (!token) return null;

        const profile = await getMeApi(token);
        if (profile) {
            setUser(profile);
            localStorage.setItem(USER_KEY, JSON.stringify(profile));
        }
        return profile;
    }, [accessToken, restoreSession]);

    const contextValue = useMemo(() => ({
        user,
        isAuthenticated,
        accessToken,
        loading: loading || bootstrapping,
        error,
        login,
        logout,
        logoutAll,
        forceLogout,
        syncCurrentUser,
        fetchCurrentUser,
        restoreSession,
    }), [user, isAuthenticated, accessToken, loading, bootstrapping, error,
        login, logout, logoutAll, forceLogout, syncCurrentUser, fetchCurrentUser, restoreSession]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
