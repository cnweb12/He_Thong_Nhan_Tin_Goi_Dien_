import { MessageCircle, Users, Settings } from "lucide-react";

export default function SideBar() {
    return (
        <div className="w-16 bg-sidebar flex flex-col items-center py-4">
            {/* avatar */}
            <div className="w-10 h-10 bg-white rounded-full mb-6" />

            <MessageCircle className="text-white mb-6 cursor-pointer" />
            <Users className="text-white mb-6 cursor-pointer" />

            <div className="mt-auto">
                <Settings className="text-white cursor-pointer" />
            </div>
        </div>
    );
}