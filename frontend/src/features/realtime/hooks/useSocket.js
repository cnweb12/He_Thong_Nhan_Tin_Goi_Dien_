import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getDeviceId, getPlatform } from '../../../utils/device';

const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000'
).trim();

export const useSocket = (token) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !SOCKET_URL) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      setIsConnecting(false);
      setError(null);
      return;
    }

    if (socketRef.current?.connected) return;

    setIsConnecting(true);
    setError(null);

    const deviceId = getDeviceId();
    const platform = getPlatform();

    const socketImpl = io(SOCKET_URL, {
      auth: { token, deviceId, platform },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socketImpl;

    const handleConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      setSocket(socketImpl);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (err) => {
      setIsConnected(false);
      setIsConnecting(false);
      setError(err.message);
    };

    socketImpl.on('connect', handleConnect);
    socketImpl.on('disconnect', handleDisconnect);
    socketImpl.on('connect_error', handleConnectError);

    if (socketImpl.connected) {
      setIsConnected(true);
      setIsConnecting(false);
      setSocket(socketImpl);
    }

    return () => {
      socketImpl.off('connect', handleConnect);
      socketImpl.off('disconnect', handleDisconnect);
      socketImpl.off('connect_error', handleConnectError);
      socketImpl.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [token]);

  return { socket, isConnected, isConnecting, error };
};

export default useSocket;
