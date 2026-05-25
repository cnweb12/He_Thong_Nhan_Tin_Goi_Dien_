import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, refreshApi, logoutApi } from '../services/authApi';

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
        const storedRefresh = localStorage.getItem('refreshToken');

        // If we have a refresh token, try to refresh access token (backend should set httpOnly cookie in production)
        if (storedRefresh) {
            (async () => {
                try {
                    const data = await refreshApi(storedRefresh);
                    if (data?.accessToken) {
                        setAccessToken(data.accessToken);
                        if (storedUser) setUser(JSON.parse(storedUser));
                        setIsAuthenticated(true);
                    }
                } catch (e) {
                    // ignore - user stays logged out
                } finally {
                    setBootstrapping(false);
                }
            })();
        } else if (storedUser) {
            // fallback: if only user is stored, set user but not authenticated
            setUser(JSON.parse(storedUser));
            setBootstrapping(false);
        } else {
            setBootstrapping(false);
        }
    }, []);

    const login = async (phone, password) => {
        setLoading(true);
        setError(null);

        try {
            const data = await loginApi(phone, password);

            if (!data?.accessToken) throw new Error('Đăng nhập thất bại');
            // keep access token in memory; persist only refresh token
            setAccessToken(data.accessToken);
            if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
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

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, accessToken, loading: loading || bootstrapping, error, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
