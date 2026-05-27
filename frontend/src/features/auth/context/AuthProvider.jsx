import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, logoutApi, getMeApi, refreshApi } from '../services/authApi';

export const AuthContext = createContext(null);

const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const DEVICE_ID = 'device-uuid-1234';

export function AuthProvider({ children }) {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessToken, setAccessToken] = useState(null); // kept in memory for safety
    const [loading, setLoading] = useState(false);
    const [bootstrapping, setBootstrapping] = useState(true);
    const [error, setError] = useState(null);

    const clearSession = useCallback(() => {
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        setUser(null);
        setAccessToken(null);
        setIsAuthenticated(false);
    }, []);

    const restoreSession = useCallback(async () => {
        const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
            clearSession();
            return null;
        }

        const refreshed = await refreshApi(refreshToken, DEVICE_ID);
        if (!refreshed?.accessToken) {
            throw new Error('Không thể khôi phục phiên đăng nhập');
        }

        setAccessToken(refreshed.accessToken);
        return refreshed.accessToken;
    }, [clearSession]);

    useEffect(() => {
        let active = true;

        const bootstrap = async () => {
            setBootstrapping(true);
            setError(null);

            try {
                const accessTokenValue = await restoreSession();
                if (!active || !accessTokenValue) {
                    return;
                }

                const profile = await getMeApi(accessTokenValue);
                if (!active) {
                    return;
                }

                if (profile) {
                    setUser(profile);
                    sessionStorage.setItem(USER_KEY, JSON.stringify(profile));
                }

                setIsAuthenticated(true);
            } catch (err) {
                if (!active) {
                    return;
                }

                clearSession();
                setError(null);
            } finally {
                if (active) {
                    setBootstrapping(false);
                }
            }
        };

        bootstrap();

        return () => {
            active = false;
        };
    }, [clearSession, restoreSession]);

    const login = async (phone, password) => {
        setLoading(true);
        setError(null);

        try {
            const data = await loginApi(phone, password);

            if (!data?.accessToken) throw new Error('Đăng nhập thất bại');

            setAccessToken(data.accessToken);
            if (data.refreshToken) {
                sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
            }
            if (data.user) {
                sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
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
                await logoutApi(accessToken);
            } catch (e) {
                // ignore logout API errors
            }
            clearSession();
            navigate('/login');
        })();
    };

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
            sessionStorage.setItem(USER_KEY, JSON.stringify(profile));
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
        fetchCurrentUser,
        restoreSession,
    }), [user, isAuthenticated, accessToken, loading, bootstrapping, error, fetchCurrentUser, restoreSession]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
