import { useState, useRef, useEffect } from 'react'
import { mockUsers, mockMessages } from '../mockData'
import './ChatWindow.css'

function ChatWindow({ userId }) {
  const [messages, setMessages] = useState(mockMessages[userId] || [])
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)

  const user = mockUsers.find(u => u.id === userId)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: inputText,
        sender: 'self',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
      setMessages([...messages, newMessage])
      setInputText('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!user) return null

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <img src={user.avatar} alt={user.name} className="chat-header-avatar" />
          <div className="chat-header-info">
            <h2 className="chat-header-name">{user.name}</h2>
            <p className="chat-header-status">{user.online ? 'Đang hoạt động' : 'Không hoạt động'}</p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="action-btn" title="Call">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </button>
          <button className="action-btn" title="Video Call">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </button>
          <button className="action-btn" title="More">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>Hãy bắt đầu cuộc trò chuyện</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`message ${msg.sender}`}>
              {msg.sender === 'other' && (
                <img src={user.avatar} alt={user.name} className="message-avatar" />
              )}
              <div className={`message-bubble`}>
                <p>{msg.text}</p>
                <span className="message-time">{msg.timestamp}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="message-input-area">
        <div className="input-actions">
          <button className="input-action-btn" title="Attachment">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 0 19.8 4.3M22 11.5a10 10 0 0 0-19.8-4.2"></path>
            </svg>
          </button>
          <button className="input-action-btn" title="Sticker">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="8" cy="9" r="1"></circle>
              <circle cx="16" cy="9" r="1"></circle>
              <path d="M8 14s1 2 4 2 4-2 4-2"></path>
            </svg>
          </button>
        </div>
        <textarea
          className="message-input"
          placeholder="Nhập tin nhắn..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          rows="1"
        />
        <button 
          className="send-btn"
          onClick={handleSendMessage}
          title="Send"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16151496 C3.34915502,0.9 2.40734225,0.9 1.77946707,1.4429026 C0.994623095,2.0844561 0.837654326,3.1772231 1.15159189,3.96277246 L3.03521743,10.4037657 C3.03521743,10.5605983 3.19218622,10.7176957 3.50612381,10.7176957 L16.6915026,11.5031827 C16.6915026,11.5031827 17.1624089,11.5031827 17.1624089,12.0460863 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z"></path>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default ChatWindow
