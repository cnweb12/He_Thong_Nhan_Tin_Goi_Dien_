import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, logoutApi, logoutAllApi, getMeApi, refreshApi } from '../services/authApi';

export const AuthContext = createContext(null);

/**
 * Bảo mật token:
 * - accessToken và refreshToken CHỈ được giữ trong memory (React state / ref),
 *   KHÔNG lưu vào localStorage hay sessionStorage.
 * - Ưu điểm: nếu có lỗ hổng XSS, mã độc chạy trên trang không thể đọc token
 *   từ storage của browser (localStorage/sessionStorage đều có thể bị đọc
 *   bởi bất kỳ script nào chạy trên cùng origin).
 * - Đánh đổi: khi người dùng tải lại trang (F5) hoặc mở tab mới, toàn bộ
 *   token trong memory sẽ mất, nên phiên đăng nhập KHÔNG được khôi phục —
 *   người dùng cần đăng nhập lại. Đây là hành vi chủ đích để đảm bảo an toàn,
 *   không phải lỗi.
 * - Thông tin hồ sơ (user) chỉ là dữ liệu hiển thị, không nhạy cảm như token,
 *   nhưng cũng được giữ trong memory để đồng bộ với trạng thái đăng nhập.
 */
export function AuthProvider({ children }) {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessToken, setAccessToken] = useState(null); // kept in memory only
    const [loading, setLoading] = useState(false);
    const [bootstrapping, setBootstrapping] = useState(false);
    const [error, setError] = useState(null);

    // refreshToken chỉ tồn tại trong memory (ref để không gây re-render thừa
    // và không bị log ra console qua state debugging).
    const refreshTokenRef = useRef(null);

    const clearSession = useCallback(() => {
        refreshTokenRef.current = null;
        setUser(null);
        setAccessToken(null);
        setIsAuthenticated(false);
    }, []);

    /**
     * Khôi phục access token mới từ refresh token đang giữ trong memory.
     * Nếu không có refresh token trong memory (ví dụ sau khi tải lại trang),
     * trả về null — người dùng cần đăng nhập lại.
     */
    const restoreSession = useCallback(async () => {
        const refreshToken = refreshTokenRef.current;
        if (!refreshToken) {
            clearSession();
            return null;
        }

        const refreshed = await refreshApi(refreshToken);
        if (!refreshed?.accessToken) {
            throw new Error('Không thể khôi phục phiên đăng nhập');
        }

        setAccessToken(refreshed.accessToken);
        // Một số backend trả về refresh token mới khi xoay vòng (rotation).
        if (refreshed.refreshToken) {
            refreshTokenRef.current = refreshed.refreshToken;
        }
        return refreshed.accessToken;
    }, [clearSession]);

    // Không còn bootstrap từ storage: vì token chỉ ở memory, mỗi lần app
    // khởi tạo lại (load trang) đều bắt đầu ở trạng thái chưa đăng nhập.
    useEffect(() => {
        setBootstrapping(false);
    }, []);

    const login = useCallback(async (phone, password) => {
        setLoading(true);
        setError(null);

        try {
            const data = await loginApi(phone, password);

            if (!data?.accessToken) throw new Error('Đăng nhập thất bại');

            setAccessToken(data.accessToken);
            if (data.refreshToken) {
                refreshTokenRef.current = data.refreshToken;
            }
            if (data.user) {
                setUser(data.user);
            }

            setIsAuthenticated(true);
            navigate('/');
            return data;
        } catch (err) {
            const errorMsg = err.message || 'Đăng nhập thất bại. Vui lòng thử lại!';
            setError(errorMsg);
            return null;
         } finally {
        setLoading(false);
    }
    }, [navigate]);

    const logout = useCallback(() => {
    (async () => {
        try {
            await logoutApi(accessToken);
        } catch (e) {
            // ignore logout API errors
        }
        clearSession();
        navigate('/login');
    })();
    }, [accessToken, clearSession, navigate]);

    const logoutAll = useCallback(async () => {
        try {
            await logoutAllApi(accessToken);
        } catch (e) {
            // ignore logout API errors
        } finally {
            clearSession();
            navigate('/login');
        }
    }, [accessToken, clearSession, navigate]);

    const forceLogout = useCallback(() => {
        clearSession();
        navigate('/login');
    }, [clearSession, navigate]);

    const syncCurrentUser = useCallback((profile) => {
        if (!profile) {
            return;
        }

        setUser(profile);
    }, []);

    const fetchCurrentUser = useCallback(async () => {
        let tokenToUse = accessToken;

        if (!tokenToUse) {
            tokenToUse = await restoreSession();
        }

        if (!tokenToUse) {
            return null;
        }

        const profile = await getMeApi(tokenToUse);
        if (profile) {
            setUser(profile);
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
    }), [user, isAuthenticated, accessToken, loading, bootstrapping, error, login, logout, logoutAll, forceLogout, syncCurrentUser, fetchCurrentUser, restoreSession]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
