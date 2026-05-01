import { Search } from "lucide-react";

export default function ChatList() {
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

            {/* cảnh báo sync */}
            <div className="mx-3 mt-3 p-3 bg-yellow-100 rounded-lg text-sm">
                Đồng bộ tin nhắn bị gián đoạn
            </div>

            {/* list */}
            <div className="mt-2 overflow-y-auto">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-100 cursor-pointer"
                    >
                        <div className="flex gap-3 items-center">
                            <div className="w-10 h-10 bg-gray-300 rounded-full" />
                            <div>
                                <div className="font-medium">User {i}</div>
                                <div className="text-sm text-gray-500">
                                    Tin nhắn gần nhất...
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-gray-400">11 giờ</div>
                    </div>
                ))}
            </div>
        </div>
    );
}