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
import AdminLayout from './features/admin/components/AdminLayout';
import UsersPage from './features/admin/pages/UsersPage';
import MessagesPage from './features/admin/pages/MessagesPage';
import SettingsPage from './features/admin/pages/SettingsPage';
import KeywordsPage from './features/admin/pages/KeywordsPage';

function App() {
  const { isAuthenticated, loading } = useAuth();

  // SocketProvider luôn render — không được đặt bên trong điều kiện loading
  // vì nếu đặt trong if(loading) return ..., mỗi lần loading đổi thì socket bị
  // unmount → disconnect → "WebSocket closed before connection established"
  return (
    <SocketProvider>
      <TwilioProvider>
        <CallOverlay />
        <ConversationProvider>
          {loading ? (
            <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#eaf2ff,_#cfe0ff_35%,_#f8fbff_100%)]">
              <div className="rounded-3xl bg-white/85 backdrop-blur px-6 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.12)] border border-white/70 text-slate-700 font-medium">
                Đang tải...
              </div>
            </div>
          ) : (
            <Routes>
              <Route
                path="/login"
                element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
              />
              <Route
                path="/register"
                element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />}
              />
              <Route
                path="/"
                element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/profile"
                element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />}
              />

              {/* Admin routes — AdminLayout tự kiểm tra role */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/users" replace />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="keywords" element={<KeywordsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </ConversationProvider>
      </TwilioProvider>
    </SocketProvider>
  );
}

export default App;
