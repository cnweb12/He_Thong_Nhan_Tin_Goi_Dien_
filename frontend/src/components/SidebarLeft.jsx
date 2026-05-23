import React from 'react';

const sidebarItems = [
    { id: 'chat', icon: '💬', label: 'Tin nhắn' },
    { id: 'contacts', icon: '👥', label: 'Danh bạ' },
    { id: 'cloud', icon: '☁️', label: 'Cloud' },
    { id: 'task', icon: '🗂️', label: 'Công việc' },
];

export default function SidebarLeft({ active, onSelect }) {
    return (
        <div style={{ width: 64 }} className="flex-shrink-0">
            <div className="h-screen flex flex-col justify-between bg-[#0068ff] text-white py-4">
                <div className="flex flex-col items-center gap-4">
                    <button type="button" className="w-12 h-12 rounded-full bg-white/20" aria-label="Tài khoản" />
                </div>

                <div className="flex flex-col items-center gap-3">
                    {sidebarItems.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            onClick={() => onSelect(item.id)}
                            className={`w-10 h-10 rounded-md flex items-center justify-center transition ${active === item.id ? 'bg-white/30 shadow-lg' : 'bg-white/10 hover:bg-white/20'} focus:outline-none`}
                            aria-label={item.label}
                        >
                            {item.icon}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-center px-2">
                    <button type="button" className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center hover:bg-white/20 focus:outline-none" aria-label="Cài đặt">
                        ⚙️
                    </button>
                </div>
            </div>
        </div>
    );
}
