import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../services/authApi';

export default function useAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (phone, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginApi(phone, password);
      if (!data) throw new Error('Login failed');

      if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/');
      return data;
    } catch (err) {
      setError(err.message || String(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return { login, logout, loading, error };
}

export { useAuth };