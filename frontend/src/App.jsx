import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/hooks/useAuth';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import { SocketProvider } from './features/realtime/context/SocketProvider';
import Home from './pages/Home';

function App() {
  const { isAuthenticated, loading } = useAuth();
  // const isAuthenticated = true;
  // const loading = false;

  // Hiển thị loading khi đang kiểm tra trạng thái đăng nhập
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <SocketProvider>
      <Routes>
        {/* ====================== LOGIN ====================== */}
        <Route
          path="/login"
          element={
            !isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/register"
          element={
            !isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />
          }
        />

        {/* ====================== HOME (Chỉ cho phép khi đã login) ====================== */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Home /> : <Navigate to="/login" replace />
          }
        />

        {/* ====================== Các route khác (tương lai) ====================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  );
}

export default App;