import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, logoutApi, getMeApi } from '../services/authApi';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessToken, setAccessToken] = useState(null); // kept in memory for safety
    const [loading, setLoading] = useState(false);
    const [bootstrapping, setBootstrapping] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');

        // Frontend hiện không phụ thuộc refresh token để bootstrap.
        // Điều này tránh gọi /api/auth/refresh với token cũ hoặc backend chưa hỗ trợ refresh ổn định.
        localStorage.removeItem('refreshToken');

        if (storedUser) {
            // fallback: if only user is stored, set user but not authenticated
            setUser(JSON.parse(storedUser));
        }

        setBootstrapping(false);
    }, []);

    const login = async (phone, password) => {
        setLoading(true);
        setError(null);

        try {
            const data = await loginApi(phone, password);

            if (!data?.accessToken) throw new Error('Đăng nhập thất bại');
            // keep access token in memory; persist only refresh token
            setAccessToken(data.accessToken);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
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
    };

    const logout = () => {
        (async () => {
            try {
                await logoutApi();
            } catch (e) {
                // ignore logout API errors
            }
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
            setAccessToken(null);
            setIsAuthenticated(false);
            navigate('/login');
        })();
    };

    const fetchCurrentUser = useCallback(async () => {
        if (!accessToken) {
            return null;
        }

        const profile = await getMeApi(accessToken);
        if (profile) {
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
        }
        return profile;
    }, [accessToken]);

    const contextValue = useMemo(() => ({
        user,
        isAuthenticated,
        accessToken,
        loading: loading || bootstrapping,
        error,
        login,
        logout,
        fetchCurrentUser,
    }), [user, isAuthenticated, accessToken, loading, bootstrapping, error, fetchCurrentUser]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
