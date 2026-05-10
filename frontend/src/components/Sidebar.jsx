import { useState } from 'react'
import { mockUsers } from '../mockData'
import './Sidebar.css'

function Sidebar({ selectedUserId, onSelectUser, isDarkMode, onToggleDarkMode }) {
  const [searchText, setSearchText] = useState('')

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <div className="sidebar">
      {/* Left Navbar - Vertical */}
      <div className="sidebar-navbar">
        {/* Avatar */}
        <div className="navbar-avatar">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" alt="Avatar" />
        </div>

        {/* Icons */}
        <div className="navbar-icons">
          <div className="nav-icon active" title="Messages">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="nav-icon" title="Contacts">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>

        {/* Settings */}
        <div className="nav-icon settings-icon" title="Settings">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24M15.46 15.46l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24M15.46 8.54l4.24-4.24"></path>
          </svg>
        </div>
      </div>

      {/* Right Chat List */}
      <div className="chat-list">
        {/* Theme Toggle */}
        <button className="theme-toggle" onClick={onToggleDarkMode} title="Toggle Dark Mode">
          {isDarkMode ? '☀️' : '🌙'}
        </button>

        {/* Search Bar */}
        <div className="search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="chat-tabs">
          <button className="tab active">Ưu tiên</button>
          <button className="tab">Khác</button>
        </div>

        {/* User List */}
        <div className="user-list">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              className={`user-item ${selectedUserId === user.id ? 'active' : ''}`}
              onClick={() => onSelectUser(user.id)}
            >
              <div className="user-avatar-wrapper">
                <img src={user.avatar} alt={user.name} className="user-avatar" />
                {user.online && <div className="online-indicator"></div>}
              </div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-message">{user.lastMessage}</div>
              </div>
              <div className="user-time">{user.timestamp}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
