import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import Welcome from './components/Welcome'

function App() {
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Sidebar 
        selectedUserId={selectedUserId}
        onSelectUser={setSelectedUserId}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
      <div className="main-content">
        {selectedUserId ? (
          <ChatWindow userId={selectedUserId} />
        ) : (
          <Welcome isDarkMode={isDarkMode} />
        )}
      </div>
    </div>
  )
}

export default App
