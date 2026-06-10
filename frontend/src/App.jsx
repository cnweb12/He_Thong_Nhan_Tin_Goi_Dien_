import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/hooks/useAuth';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import { SocketProvider } from './features/realtime/context/SocketProvider';
import { TwilioProvider } from './features/calls/context/TwilioProvider';
import CallOverlay from './features/calls/components/CallOverlay';
import { ConversationProvider } from './features/conversations/context/ConversationProvider';
import Home from './pages/Home';
import ProfilePage from './features/users/ProfilePage';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#eaf2ff,_#cfe0ff_35%,_#f8fbff_100%)]">
        <div className="rounded-3xl bg-white/85 backdrop-blur px-6 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.12)] border border-white/70 text-slate-700 font-medium">
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <SocketProvider>
      <TwilioProvider>
        <CallOverlay />
        <ConversationProvider>
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

            <Route
              path="/profile"
              element={
                isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />
              }
            />

            {/* ====================== Các route khác (tương lai) ====================== */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ConversationProvider>
      </TwilioProvider>
    </SocketProvider>
  );
}

export default App;
