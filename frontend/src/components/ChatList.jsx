import { Search } from "lucide-react";
import { mockUsers } from "../mockData";

export default function ChatList({ selectedUserId, onSelectUser }) {
    return (
        <div className="w-[320px] bg-white border-r flex flex-col">

            {/* search */}
            <div className="p-3">
                <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
                    <Search size={16} />
                    <input
                        placeholder="Tìm kiếm"
                        className="ml-2 bg-transparent outline-none w-full"
                    />
                </div>
            </div>

            {/* tabs */}
            <div className="flex px-4 text-sm font-medium text-gray-500 gap-4">
                <span className="text-black border-b-2 border-black pb-1">
                    Ưu tiên
                </span>
                <span>Khác</span>
            </div>

            {/* list */}
            <div className="mt-2 overflow-y-auto flex-1">
                {mockUsers.map((user) => (
                    <div
                        key={user.id}
                        onClick={() => onSelectUser(user.id)}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all ${
                            selectedUserId === user.id 
                                ? "bg-yellow-100 border-l-4 border-primary" 
                                : "hover:bg-gray-100"
                        }`}
                    >
                        <div className="flex gap-3 items-center flex-1">
                            {/* Avatar with online indicator */}
                            <div className="relative flex-shrink-0">
                                <img 
                                    src={user.avatar} 
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                {user.online && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{user.name}</div>
                                <div className="text-xs text-gray-500 truncate">
                                    {user.lastMessage}
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {user.timestamp}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}