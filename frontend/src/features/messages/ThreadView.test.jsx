import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import ThreadView from './ThreadView';
import { useAppSocket } from '../realtime/hooks/useAppSocket';
import { get } from '../../services/apiClient';

// Mock dependencies
vi.mock('../realtime/hooks/useAppSocket', () => ({
  useAppSocket: vi.fn(() => ({
    socket: {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    },
    isConnected: true,
  })),
}));

// Mock apiClient to avoid environment variable issues
vi.mock('../../services/apiClient', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
  buildApiUrl: vi.fn((path) => `http://localhost:5000${path}`),
}));

describe('ThreadView Component', () => {
  const mockChat = {
    _id: 'conversation-123',
    displayName: 'Test Chat',
    avatarUrl: 'https://example.com/avatar.jpg',
    members: 2,
    participants: [
      { userId: 'user-1', displayName: 'User 1' },
      { userId: 'user-2', displayName: 'User 2' },
    ],
  };

  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue({ ok: true, data: { messages: [] } });
  });

  describe('TC2.1: Join/Leave Room', () => {
    it('Should render chat header with correct information', async () => {
      render(<ThreadView chat={mockChat} />);

      expect(screen.getByText('Test Chat')).toBeInTheDocument();
      expect(screen.getByText('2 thành viên')).toBeInTheDocument();
      await waitFor(() => expect(get).toHaveBeenCalled());
    });

    it('Should emit join_room when socket is connected', async () => {
      const mockSocket = {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };
      useAppSocket.mockReturnValue({
        socket: mockSocket,
        isConnected: true,
      });

      render(<ThreadView chat={mockChat} />);

      await waitFor(() => expect(get).toHaveBeenCalled());
      expect(mockSocket.emit).toHaveBeenCalledWith('join_room', {
        conversationId: 'conversation-123',
      });
    });
  });

  describe('TC2.2: Receive new message', () => {
    it('Should display empty state when no messages', async () => {
      get.mockResolvedValue({ ok: true, data: { messages: [] } });

      render(<ThreadView chat={mockChat} />);

      await waitFor(() => {
        expect(
          screen.getByText('Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!')
        ).toBeInTheDocument();
      });
    });

    it('Should display messages when fetched', async () => {
      const mockMessages = [
        { _id: 'msg-1', content: 'Hello', senderId: 'user-1' },
        { _id: 'msg-2', content: 'Hi there', senderId: 'current-user' },
      ];
      get.mockResolvedValue({ ok: true, data: { messages: mockMessages } });

      render(<ThreadView chat={mockChat} />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Hi there')).toBeInTheDocument();
      });
    });

    it('Should replace optimistic message with real message (prevent duplicates)', async () => {
      let newMessageCallback = null;
      const mockSocket = {
        emit: vi.fn(),
        on: vi.fn((event, callback) => {
          if (event === 'new_message') {
            newMessageCallback = callback;
          }
        }),
        off: vi.fn(),
      };
      useAppSocket.mockReturnValue({
        socket: mockSocket,
        isConnected: true,
      });

      // Start with an optimistic message (temp ID)
      const optimisticMessage = {
        _id: 'temp-1234567890',
        content: 'Test message',
        senderId: 'current-user',
        conversationId: 'conversation-123',
        isPending: true,
      };
      get.mockResolvedValue({ ok: true, data: { messages: [optimisticMessage] } });

      render(<ThreadView chat={mockChat} />);

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      // Simulate receiving the real message via WebSocket
      const realMessage = {
        _id: 'msg-real-123',
        content: 'Test message',
        senderId: 'current-user',
        conversationId: 'conversation-123',
      };

      act(() => {
        if (newMessageCallback) {
          newMessageCallback(realMessage);
        }
      });

      // Should still only show one message (replaced, not duplicated)
      const messages = screen.getAllByText('Test message');
      expect(messages.length).toBe(1);
    });

    it('Should not add duplicate message when same content and senderId', async () => {
      let newMessageCallback = null;
      const mockSocket = {
        emit: vi.fn(),
        on: vi.fn((event, callback) => {
          if (event === 'new_message') {
            newMessageCallback = callback;
          }
        }),
        off: vi.fn(),
      };
      useAppSocket.mockReturnValue({
        socket: mockSocket,
        isConnected: true,
      });

      const existingMessages = [
        { _id: 'msg-1', content: 'Hello', senderId: 'user-1' },
        { _id: 'msg-2', content: 'Duplicate test', senderId: 'user-2' },
      ];
      get.mockResolvedValue({ ok: true, data: { messages: existingMessages } });

      render(<ThreadView chat={mockChat} />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Duplicate test')).toBeInTheDocument();
      });

      // Try to add a message with same content and senderId
      const duplicateMessage = {
        _id: 'msg-3',
        content: 'Duplicate test',
        senderId: 'user-2',
        conversationId: 'conversation-123',
      };

      act(() => {
        if (newMessageCallback) {
          newMessageCallback(duplicateMessage);
        }
      });

      // Should still only show one instance of "Duplicate test"
      const messages = screen.getAllByText('Duplicate test');
      expect(messages.length).toBe(1);
    });
  });

  describe('TC2.3: Prevent message cross-contamination', () => {
    it('Should not update messages for different conversationId', async () => {
      let newMessageCallback = null;
      const mockSocket = {
        emit: vi.fn(),
        on: vi.fn((event, callback) => {
          if (event === 'new_message') {
            newMessageCallback = callback;
          }
        }),
        off: vi.fn(),
      };
      useAppSocket.mockReturnValue({
        socket: mockSocket,
        isConnected: true,
      });

      get.mockResolvedValue({ ok: true, data: { messages: [] } });

      render(<ThreadView chat={mockChat} />);

      await waitFor(() => expect(get).toHaveBeenCalled());

      act(() => {
        if (newMessageCallback) {
          newMessageCallback({
            _id: 'msg-3',
            content: 'Wrong conversation message',
            conversationId: 'other-conversation-456',
          });
        }
      });

      expect(
        screen.queryByText('Wrong conversation message')
      ).not.toBeInTheDocument();
    });
  });

  describe('TC2.4: Typing indicators display', () => {
    it('Should display typing indicator when user is typing', async () => {
      let typingCallback = null;
      const mockSocket = {
        emit: vi.fn(),
        on: vi.fn((event, callback) => {
          if (event === 'typing_start') {
            typingCallback = callback;
          }
        }),
        off: vi.fn(),
      };
      useAppSocket.mockReturnValue({
        socket: mockSocket,
        isConnected: true,
      });

      get.mockResolvedValue({ ok: true, data: { messages: [] } });

      render(<ThreadView chat={mockChat} />);

      await waitFor(() => expect(get).toHaveBeenCalled());

      act(() => {
        if (typingCallback) {
          typingCallback({ conversationId: 'conversation-123', userId: 'user-1' });
        }
      });

      expect(screen.getByText('User 1 đang gõ...')).toBeInTheDocument();
    });

    it('Should hide typing indicator when typing stops', async () => {
      let typingCallback = null;
      const mockSocket = {
        emit: vi.fn(),
        on: vi.fn((event, callback) => {
          if (event === 'typing_start') {
            typingCallback = callback;
          }
        }),
        off: vi.fn(),
      };
      useAppSocket.mockReturnValue({
        socket: mockSocket,
        isConnected: true,
      });

      get.mockResolvedValue({ ok: true, data: { messages: [] } });

      render(<ThreadView chat={mockChat} />);
      await waitFor(() => expect(get).toHaveBeenCalled());

      // Trigger typing start
      act(() => {
        if (typingCallback) {
          typingCallback({ conversationId: 'conversation-123', userId: 'user-1' });
        }
      });
      expect(screen.getByText('User 1 đang gõ...')).toBeInTheDocument();

      // Trigger typing stop
      const stopCallback = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'typing_stop'
      );
      act(() => {
        if (stopCallback) {
          stopCallback[1]({ conversationId: 'conversation-123' });
        }
      });
      expect(screen.queryByText('User 1 đang gõ...')).not.toBeInTheDocument();
    });
  });

  describe('TC2.5: Typing emit debounce', () => {
    it('Should emit typing_start on input change', async () => {
      const mockSocket = {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      };
      useAppSocket.mockReturnValue({
        socket: mockSocket,
        isConnected: true,
      });

      get.mockResolvedValue({ ok: true, data: { messages: [] } });

      render(<ThreadView chat={mockChat} />);

      const input = screen.getByPlaceholderText('Nhập tin nhắn...');
      fireEvent.change(input, { target: { value: 'Hello' } });

      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('typing_start', {
          conversationId: 'conversation-123',
        });
      });
    });
  });

  describe('Message sending', () => {
    it('Should disable send button when input is empty', async () => {
      get.mockResolvedValue({ ok: true, data: { messages: [] } });

      render(<ThreadView chat={mockChat} />);

      const sendButton = screen.getByText('Gửi');
      expect(sendButton).toBeDisabled();
      await waitFor(() => expect(get).toHaveBeenCalled());
    });

    it('Should enable send button when input has text', async () => {
      get.mockResolvedValue({ ok: true, data: { messages: [] } });

      render(<ThreadView chat={mockChat} />);

      const input = screen.getByPlaceholderText('Nhập tin nhắn...');
      fireEvent.change(input, { target: { value: 'Hello' } });

      await waitFor(() => {
        const sendButton = screen.getByText('Gửi');
        expect(sendButton).not.toBeDisabled();
      });
    });
  });

  describe('Edge cases', () => {
    it('Should handle missing chat prop gracefully', async () => {
      render(<ThreadView chat={null} />);

      expect(screen.getByText('Cuộc trò chuyện')).toBeInTheDocument();
    });

    it('Should handle missing avatar', async () => {
      const chatWithoutAvatar = {
        ...mockChat,
        avatarUrl: null,
      };

      render(<ThreadView chat={chatWithoutAvatar} />);

      const avatarPlaceholder = document.querySelector('.bg-gray-200');
      expect(avatarPlaceholder).toBeInTheDocument();
      await waitFor(() => expect(get).toHaveBeenCalled());
    });
  });
});
