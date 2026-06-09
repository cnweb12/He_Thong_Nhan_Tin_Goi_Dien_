import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getDeviceId, getPlatform } from '../../../utils/device';

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000').trim();

export const useSocket = (token) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !SOCKET_URL) {
      setSocket(null);
      setIsConnected(false);
      setIsConnecting(false);
      setError(null);
      return;
    }

    setIsConnecting(true);
    setError(null);
    console.log("🔴 [DEBUG CLIENT] Bắt đầu kết nối Socket.IO tới:", SOCKET_URL);

    const deviceId = getDeviceId();
    const platform = getPlatform();
    const socketImpl = io(SOCKET_URL, {
      auth: { token, deviceId, platform },
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    const handleConnect = () => {
      console.log("🔴 [DEBUG CLIENT] Đã kết nối Socket.IO thành công! ID:", socketImpl.id);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    };

    const handleDisconnect = (reason) => {
      console.warn("🔴 [DEBUG CLIENT] Socket.IO bị ngắt kết nối:", reason);
      setIsConnected(false);
    };

    const handleConnectError = (err) => {
      console.error("🔴 [DEBUG CLIENT] Lỗi kết nối Socket.IO:", err.message);
      setIsConnected(false);
      setIsConnecting(false);
      setError(err.message);
    };

    socketImpl.on('connect', handleConnect);
    socketImpl.on('disconnect', handleDisconnect);
    socketImpl.on('connect_error', handleConnectError);

    setSocket(socketImpl);

    return () => {
      console.log("🔴 [DEBUG CLIENT] Ngắt kết nối và dọn dẹp Socket.IO");
      socketImpl.off('connect', handleConnect);
      socketImpl.off('disconnect', handleDisconnect);
      socketImpl.off('connect_error', handleConnectError);
      socketImpl.disconnect();
      setSocket(null);
    };
  }, [token]);

  return { socket, isConnected, isConnecting, error };
};

export default useSocket;

