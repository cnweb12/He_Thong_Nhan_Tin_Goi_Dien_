import React from 'react';

export default function ConversationInfo({ chat }) {
    return (
        <div style={{ width: 320 }} className="flex-shrink-0 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            {chat ? (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-lg"></div>
                        <div>
                            <div className="font-semibold text-gray-900">{chat.name}</div>
                            <div className="text-sm text-gray-500">Mô tả nhóm hoặc thông tin</div>
                        </div>
                    </div>

                    <div className="mb-4 bg-gray-50 p-3 rounded">
                        <h4 className="font-medium mb-2 text-gray-800">Dung lượng lưu trữ</h4>
                        <div className="text-sm text-gray-600">Sử dụng 501 MB / 500 MB</div>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2 text-gray-800">Ảnh/Video</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="h-20 bg-gray-200 rounded" />
                            <div className="h-20 bg-gray-200 rounded" />
                            <div className="h-20 bg-gray-200 rounded" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-gray-500">Chưa chọn hội thoại</div>
            )}
        </div>
    );
}
