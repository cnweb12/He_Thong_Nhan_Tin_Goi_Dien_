import { useContext } from 'react';
import { ConversationContext } from '../context/ConversationProvider';

export const useConversations = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversations must be used within a ConversationProvider');
  }
  return context;
};

export default useConversations;
