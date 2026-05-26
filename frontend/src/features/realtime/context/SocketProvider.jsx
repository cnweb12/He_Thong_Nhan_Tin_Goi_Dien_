import React, { createContext, useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated, accessToken } = useAuth();
  const socketState = useSocket(isAuthenticated ? accessToken : null);

  const value = useMemo(() => ({
    socket: socketState.socket,
    isConnected: socketState.isConnected,
    isConnecting: socketState.isConnecting,
    error: socketState.error,
  }), [socketState.socket, socketState.isConnected, socketState.isConnecting, socketState.error]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketProvider;