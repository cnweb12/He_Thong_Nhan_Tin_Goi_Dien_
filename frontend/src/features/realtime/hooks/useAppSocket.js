import { useContext } from 'react';
import { SocketContext } from '../context/SocketProvider';

export const useAppSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useAppSocket must be used within a SocketProvider');
  }
  return context;
};

export default useAppSocket;