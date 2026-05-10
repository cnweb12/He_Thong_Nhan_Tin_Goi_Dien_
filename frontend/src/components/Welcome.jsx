import './Welcome.css'

function Welcome({ isDarkMode }) {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1 className="welcome-title">Chào mừng đến với Zalo PC!</h1>
        <p className="welcome-subtitle">Khám phá những tiện ích hỗ trợ làm việc và trò chuyện</p>
        
        <div className="welcome-placeholder">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <path d="M60 35v50M35 60h50" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
          </svg>
        </div>

        <div className="welcome-features">
          <div className="feature">
            <div className="feature-icon">💬</div>
            <div className="feature-text">Nhắn tin tức thì</div>
          </div>
          <div className="feature">
            <div className="feature-icon">📞</div>
            <div className="feature-text">Gọi điện video</div>
          </div>
          <div className="feature">
            <div className="feature-icon">🎤</div>
            <div className="feature-text">Gọi thoại</div>
          </div>
        </div>

        <button className="theme-button">Giao diện Dark Mode</button>
        <p className="welcome-footer">Thử ngay</p>
      </div>
    </div>
  )
}

export default Welcome
