import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000';

export const useSocket = (token) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      setIsConnected(false);
      setIsConnecting(false);
      setError(null);
      return;
    }

    setIsConnecting(true);
    setError(null);

    const socketImpl = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    const handleConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (err) => {
      setIsConnected(false);
      setIsConnecting(false);
      setError(err?.message || 'Cannot connect to realtime server');
    };

    socketImpl.on('connect', handleConnect);
    socketImpl.on('disconnect', handleDisconnect);
    socketImpl.on('connect_error', handleConnectError);

    setSocket(socketImpl);

    return () => {
      socketImpl.off('connect', handleConnect);
      socketImpl.off('disconnect', handleDisconnect);
      socketImpl.off('connect_error', handleConnectError);
      socketImpl.disconnect();
      setSocket(null);
      setIsConnected(false);
      setIsConnecting(false);
    };
  }, [token]);

  return { socket, isConnected, isConnecting, error };
};

export default useSocket;