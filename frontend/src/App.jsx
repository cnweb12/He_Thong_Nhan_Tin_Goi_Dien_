import { useState } from "react";
import SideBar from "./components/SideBar";
import ChatList from "./components/ChatList";
import MainContent from "./components/MainContent";

export default function App() {
  const [selectedUserId, setSelectedUserId] = useState(null);

  return (
    <div className="flex h-screen">
      <SideBar />
      <ChatList selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} />
      <MainContent selectedUserId={selectedUserId} />
    </div>
  );
}