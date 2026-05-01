import Sidebar from "./components/Sidebar";
import ChatList from "./components/ChatList";
import MainContent from "./components/MainContent";

export default function App() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <ChatList />
      <MainContent />
    </div>
  );
}