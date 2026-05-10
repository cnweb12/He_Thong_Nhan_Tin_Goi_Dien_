import { Moon } from "lucide-react";

export default function MainContent() {
    return (
        <div className="flex-1 flex items-center justify-center relative bg-gray-50">

            {/* dark mode button */}
            <div className="absolute top-6 right-6 bg-white p-2 rounded-full shadow cursor-pointer">
                <Moon />
            </div>

            <div className="text-center">
                <h1 className="text-2xl font-semibold mb-2">
                    Chào mừng đến với App !
                </h1>

                <p className="text-gray-500 mb-6">
                    Khám phá những tiện ích hỗ trợ làm việc và trò chuyện
                </p>

                {/* preview box */}
                <div className="w-[420px] h-[240px] bg-gray-200 rounded-xl mb-4 shadow-inner" />

                <div className="text-blue-500 font-medium mb-2">
                    Giao diện Dark Mode
                </div>

                <button className="bg-blue-500 text-white px-6 py-2 rounded-lg">
                    Thử ngay
                </button>

                {/* dots */}
                <div className="flex justify-center gap-2 mt-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                </div>
            </div>
        </div>
    );
}