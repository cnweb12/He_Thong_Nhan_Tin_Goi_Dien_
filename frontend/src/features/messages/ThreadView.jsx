import { useEffect, useState, useRef } from 'react';
import { useAppSocket } from '../realtime/hooks/useAppSocket';
import { get } from '../../services/apiClient';

export default function ThreadView({ chat }) {
  const title = chat?.displayName || chat?.name || 'Cuộc trò chuyện';
  const avatarUrl = chat?.avatarUrl || chat?.displayAvatarUrl || chat?.avatar || '';
  const conversationId = chat?._id || chat?.id;
  
  const { socket, isConnected } = useAppSocket();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(null);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch initial messages
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      const response = await get(`/api/messages/conversations/${conversationId}`);
      if (response.ok && response.data) {
        setMessages(response.data.messages || response.data || []);
      }
    };

    fetchMessages();
  }, [conversationId]);

  // Join/Leave room
  useEffect(() => {
    if (!socket || !conversationId || !isConnected) return;

    socket.emit('join_room', { conversationId });

    return () => {
      socket.emit('leave_room', { conversationId });
    };
  }, [socket, conversationId, isConnected]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (newMessage.conversationId === conversationId) {
        setMessages((prev) => {
          // Check if message already exists (by _id or by content + timestamp)
          const exists = prev.some(
            (msg) => msg._id === newMessage._id || 
            (msg.content === newMessage.content && msg.senderId === newMessage.senderId)
          );
          if (exists) {
            // If it exists and has a temp ID, replace it with the real message
            return prev.map((msg) =>
              msg._id === newMessage._id || (msg._id.startsWith('temp-') && msg.content === newMessage.content)
                ? newMessage
                : msg
            );
          }
          return [...prev, newMessage];
        });
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, conversationId]);

  // Listen for typing indicators
  useEffect(() => {
    if (!socket) return;

    const handleTypingStart = (data) => {
      if (data.conversationId === conversationId) {
        setIsTyping(data.userId);
      }
    };

    const handleTypingStop = (data) => {
      if (data.conversationId === conversationId) {
        setIsTyping(null);
      }
    };

    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);

    return () => {
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
    };
  }, [socket, conversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing with debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputText(value);

    if (!socket || !conversationId) return;

    // Emit typing_start
    socket.emit('typing_start', { conversationId });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing_stop after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { conversationId });
    }, 2000);
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputText.trim() || !conversationId) return;

    const messageContent = inputText.trim();
    setInputText('');

    // Optimistic UI - add message immediately
    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      content: messageContent,
      senderId: 'current-user',
      conversationId,
      createdAt: new Date().toISOString(),
      isPending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Send via API
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: messageContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === optimisticMessage._id ? data : msg
          )
        );
      } else {
        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((msg) => msg._id !== optimisticMessage._id)
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== optimisticMessage._id)
      );
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get typing user display name
  const getTypingUserName = () => {
    if (!isTyping || !chat?.participants) return 'Someone';
    const participant = chat.participants.find((p) => p.userId === isTyping);
    return participant?.displayName || participant?.name || 'Someone';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header chat */}
      <div className="border-b p-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} className="w-11 h-11 rounded-full object-cover" alt={title} />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gray-200" />
          )}
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-gray-500">
              {chat?.members || chat?.participants?.length || 0} thành viên
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#f0f2f5] space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${message.senderId === 'current-user' ? 'justify-end' : 'gap-3'}`}
            >
              {message.senderId !== 'current-user' && (
                <div className="bg-white rounded-2xl px-4 py-3 max-w-md">
                  {message.content}
                </div>
              )}
              {message.senderId === 'current-user' && (
                <div
                  className={`rounded-2xl px-4 py-3 max-w-md ${
                    message.isPending
                      ? 'bg-gray-300'
                      : 'bg-[#dcf8c6]'
                  }`}
                >
                  {message.content}
                  {message.isPending && (
                    <span className="text-xs text-gray-500 ml-2">Đang gửi...</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="text-sm text-gray-500 italic">
            {getTypingUserName()} đang gõ...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center gap-3 bg-gray-100 rounded-3xl px-5 py-3">
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-transparent focus:outline-none"
            value={inputText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />

          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-3xl disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}