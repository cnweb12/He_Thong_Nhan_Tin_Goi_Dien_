export default function ThreadView({ chat }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header chat */}
      <div className="border-b p-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <img src={chat.avatar} className="w-11 h-11 rounded-full" alt="" />
          <div>
            <div className="font-semibold">{chat.name}</div>
            <div className="text-sm text-gray-500">
              {chat.members} thành viên
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#f0f2f5] space-y-4">
        <div className="flex gap-3">
          <div className="bg-white rounded-2xl px-4 py-3 max-w-md">
            @Nguyễn Hà Anh home có máy sấy koo
          </div>
        </div>

        <div className="flex justify-end">
          <div className="bg-[#dcf8c6] rounded-2xl px-4 py-3 max-w-md">
            @Minh Anh làm gì có bro
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center gap-3 bg-gray-100 rounded-3xl px-5 py-3">
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-transparent focus:outline-none"
          />

          <button className="bg-blue-600 text-white px-6 py-2 rounded-3xl">
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}