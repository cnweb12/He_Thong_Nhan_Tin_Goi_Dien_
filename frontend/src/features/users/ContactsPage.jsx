import React, { useEffect, useState } from 'react';
import { 
  Users, UserPlus, Inbox, Search, MessageSquare, 
  UserX, Loader2, CheckCircle2, UserRound 
} from 'lucide-react';
import { 
  listFriendsApi, 
  listPendingRequestsApi, 
  sendFriendRequestApi, 
  acceptFriendRequestApi, 
  removeFriendApi,
  searchUsersApi
} from './services/userApi';

export default function ContactsPage({ accessToken, onStartConversation }) {
  const [activeTab, setActiveTab] = useState('friends'); // friends | requests | search
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Load friends and pending requests
  const loadContactsData = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [friendsData, requestsData] = await Promise.all([
        listFriendsApi(accessToken),
        listPendingRequestsApi(accessToken)
      ]);
      setFriends(friendsData || []);
      setRequests(requestsData || []);
    } catch (err) {
      setError(err?.message || 'Không tải được danh sách liên hệ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContactsData();
  }, [accessToken, activeTab]);

  // Handle global search for users
  useEffect(() => {
    let active = true;
    const search = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const results = await searchUsersApi(accessToken, searchQuery.trim());
        if (active) {
          setSearchResults(results || []);
        }
      } catch (err) {
        console.error('Lỗi tìm kiếm liên hệ:', err);
      } finally {
        if (active) setSearchLoading(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, accessToken]);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSendRequest = async (userId, name) => {
    setActionLoadingId(userId);
    try {
      await sendFriendRequestApi(accessToken, userId);
      showNotification(`Đã gửi lời mời kết bạn tới ${name}`);
      
      // Thêm vào danh sách đã gửi trong phiên làm việc này
      setSentRequests((prev) => {
        const newSet = new Set(prev);
        newSet.add(userId);
        return newSet;
      });

      // Refresh
      loadContactsData();
    } catch (err) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('already sent') || msg.toLowerCase().includes('friend request already')) {
        setSentRequests((prev) => {
          const newSet = new Set(prev);
          newSet.add(userId);
          return newSet;
        });
        showNotification(`Bạn đã gửi lời mời kết bạn tới ${name} trước đó rồi.`);
        setError(null);
      } else {
        setError(msg || 'Không gửi được lời mời kết bạn');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAcceptRequest = async (userId, name) => {
    setActionLoadingId(userId);
    try {
      await acceptFriendRequestApi(accessToken, userId);
      showNotification(`Đã chấp nhận kết bạn với ${name}`);
      loadContactsData();
    } catch (err) {
      setError(err?.message || 'Không chấp nhận được lời mời kết bạn');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveFriend = async (userId, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${name}?`)) return;
    setActionLoadingId(userId);
    try {
      await removeFriendApi(accessToken, userId);
      showNotification(`Đã hủy kết bạn với ${name}`);
      loadContactsData();
    } catch (err) {
      setError(err?.message || 'Hủy kết bạn thất bại');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineRequest = async (userId, name) => {
    setActionLoadingId(userId);
    try {
      await removeFriendApi(accessToken, userId); // Decline request in the backend is delete relationship
      showNotification(`Đã từ chối lời mời kết bạn của ${name}`);
      loadContactsData();
    } catch (err) {
      setError(err?.message || 'Không từ chối được lời mời');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-slate-50 dark:bg-[#0e1621]">
      {/* Cột phụ bên trái: Danh mục */}
      <div className="w-full md:w-[280px] h-auto md:h-full bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col flex-shrink-0 dark:bg-[#232e3c] dark:border-[#1e2d3d]">
        <div className="p-4 border-b border-slate-200 dark:border-[#1e2d3d] hidden md:block">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Danh bạ</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Quản lý bạn bè và kết nối</p>
        </div>
        
        <nav className="p-2 flex flex-row md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-y-auto shrink-0 hide-scrollbar">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-sm font-semibold transition shrink-0 whitespace-nowrap ${
              activeTab === 'friends' 
                ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50 dark:bg-[#2b5278]/20 dark:text-blue-300' 
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-[#1c2b38]'
            }`}
          >
            <Users size={18} />
            Danh sách bạn bè
            {friends.length > 0 && (
              <span className="ml-auto bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full dark:bg-[#1c2b38] dark:text-slate-300">
                {friends.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-sm font-semibold transition shrink-0 whitespace-nowrap ${
              activeTab === 'requests' 
                ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50 dark:bg-[#2b5278]/20 dark:text-blue-300' 
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-[#1c2b38]'
            }`}
          >
            <Inbox size={18} />
            Lời mời kết bạn
            {requests.length > 0 && (
              <span className="ml-auto bg-red-150 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                {requests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-sm font-semibold transition shrink-0 whitespace-nowrap ${
              activeTab === 'search' 
                ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50 dark:bg-[#2b5278]/20 dark:text-blue-300' 
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-[#1c2b38]'
            }`}
          >
            <UserPlus size={18} />
            Tìm bạn mới
          </button>
        </nav>
      </div>

      {/* Cột chính bên phải: Danh sách chi tiết */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-slate-100 dark:bg-[#0e1621]">
        {/* Header chi tiết */}
        <header className="h-[68px] border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-6 shrink-0 dark:border-[#1e2d3d] dark:bg-[#17212b]">
          <div>
            <h1 className="font-bold text-slate-800 dark:text-slate-100">
              {activeTab === 'friends' && 'Danh sách bạn bè'}
              {activeTab === 'requests' && 'Lời mời kết bạn đã nhận'}
              {activeTab === 'search' && 'Tìm kiếm bạn mới'}
            </h1>
            <p className="text-xs text-slate-400">
              {activeTab === 'friends' && 'Xem và trò chuyện với bạn bè của bạn.'}
              {activeTab === 'requests' && 'Đồng ý kết bạn để cùng trò chuyện.'}
              {activeTab === 'search' && 'Tìm kiếm theo Tên hiển thị, Username hoặc Số điện thoại.'}
            </p>
          </div>
        </header>

        {/* Thông báo thành công / lỗi */}
        {successMsg && (
          <div className="m-4 mx-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-xl flex items-center gap-2 shadow-sm shrink-0">
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}

        {error && (
          <div className="m-4 mx-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl flex items-center gap-2 shadow-sm shrink-0">
            <UserX size={16} />
            {error}
          </div>
        )}

        {/* Nội dung danh sách */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm flex items-center gap-2 dark:bg-[#1c2b38] dark:border-[#1e2d3d]">
                <Loader2 className="animate-spin text-blue-500" size={20} />
                <span className="text-slate-600 font-medium text-sm dark:text-slate-300">Đang tải danh sách...</span>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              
              {/* TAB: BẠN BÈ */}
              {activeTab === 'friends' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-[#1c2b38] dark:border-[#1e2d3d]">
                  {friends.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <Users size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-sm">Chưa có bạn bè nào</p>
                      <p className="text-xs mt-1">Hãy chuyển sang tab "Tìm bạn mới" để kết nối.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-[#1e2d3d]/50">
                      {friends.map((friend) => (
                        <div key={friend.userId} className="p-4 flex items-center justify-between hover:bg-slate-50 transition dark:hover:bg-[#223044]">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(friend.displayName || 'U')}&background=random&color=fff&rounded=true&font-size=0.45&length=1`}
                              alt={friend.displayName}
                              className="w-10 h-10 rounded-full bg-slate-100 object-cover"
                            />
                            <div>
                              <p className="font-semibold text-slate-800 text-sm dark:text-slate-100">{friend.displayName}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">{friend.phone || 'Không công khai SĐT'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onStartConversation({ userId: friend.userId, displayName: friend.displayName })}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer"
                            >
                              <MessageSquare size={14} />
                              Nhắn tin
                            </button>
                            <button
                              onClick={() => handleRemoveFriend(friend.userId, friend.displayName)}
                              disabled={actionLoadingId === friend.userId}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-slate-500 transition text-xs font-semibold cursor-pointer disabled:opacity-50 dark:border-[#1e2d3d] dark:text-slate-400 dark:hover:bg-[#1c2b38]"
                            >
                              Hủy kết bạn
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: LỜI MỜI */}
              {activeTab === 'requests' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-[#1c2b38] dark:border-[#1e2d3d]">
                  {requests.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <Inbox size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-sm">Không có lời mời kết bạn nào</p>
                      <p className="text-xs mt-1">Khi ai đó gửi yêu cầu, nó sẽ hiển thị ở đây.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-[#1e2d3d]/50">
                      {requests.map((req) => (
                        <div key={req.userId} className="p-4 flex items-center justify-between hover:bg-slate-50 transition dark:hover:bg-[#223044]">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(req.displayName || 'U')}&background=random&color=fff&rounded=true&font-size=0.45&length=1`}
                              alt={req.displayName}
                              className="w-10 h-10 rounded-full bg-slate-100 object-cover"
                            />
                            <div>
                              <p className="font-semibold text-slate-800 text-sm dark:text-slate-100">{req.displayName}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">{req.phone || 'SĐT: Ẩn'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAcceptRequest(req.userId, req.displayName)}
                              disabled={actionLoadingId === req.userId}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                            >
                              Đồng ý
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(req.userId, req.displayName)}
                              disabled={actionLoadingId === req.userId}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition text-xs font-semibold cursor-pointer disabled:opacity-50 dark:border-[#1e2d3d] dark:text-slate-400 dark:hover:bg-[#1c2b38]"
                            >
                              Từ chối
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: TÌM BẠN MỚI */}
              {activeTab === 'search' && (
                <div className="space-y-4">
                  {/* Ô tìm kiếm liên hệ */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm theo Tên hiển thị, Username hoặc Số điện thoại..."
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none shadow-sm transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm dark:bg-[#1c2b38] dark:border-[#1e2d3d] dark:text-slate-100 dark:placeholder-slate-500"
                    />
                  </div>

                  {/* Kết quả tìm kiếm */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-[#1c2b38] dark:border-[#1e2d3d]">
                    <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 text-xs font-semibold text-slate-500 flex items-center justify-between dark:bg-[#17212b] dark:border-[#1e2d3d]/50 dark:text-slate-400">
                      <span>KẾT QUẢ TÌM KIẾM</span>
                      {searchLoading && <Loader2 className="animate-spin text-blue-500" size={14} />}
                    </div>

                    {searchQuery.trim().length < 2 ? (
                      <div className="p-8 text-center text-slate-400">
                        <Search size={32} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-xs">Nhập ít nhất 2 ký tự để tìm kiếm.</p>
                      </div>
                    ) : searchResults.length === 0 && !searchLoading ? (
                      <div className="p-8 text-center text-slate-500">
                        <p className="font-semibold text-sm">Không tìm thấy người dùng phù hợp</p>
                        <p className="text-xs mt-1">Vui lòng kiểm tra lại thông tin tìm kiếm.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-[#1e2d3d]/50">
                        {searchResults.map((item) => {
                          const isFriend = friends.some((f) => f.userId === item.userId);
                          const isPending = requests.some((r) => r.userId === item.userId);

                          return (
                            <div key={item.userId} className="p-4 flex items-center justify-between hover:bg-slate-50 transition dark:hover:bg-[#223044]">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.displayName || 'U')}&background=random&color=fff&rounded=true&font-size=0.45&length=1`}
                                  alt={item.displayName}
                                  className="w-10 h-10 rounded-full bg-slate-100 object-cover"
                                />
                                <div>
                                  <p className="font-semibold text-slate-800 text-sm dark:text-slate-100">{item.displayName}</p>
                                  <p className="text-xs text-slate-400 dark:text-slate-500">@{item.username || 'user'}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isFriend ? (
                                  <>
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                                      Bạn bè
                                    </span>
                                    <button
                                      onClick={() => onStartConversation({ userId: item.userId, displayName: item.displayName })}
                                      className="p-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                                      title="Nhắn tin"
                                    >
                                      <MessageSquare size={16} />
                                    </button>
                                  </>
                                ) : sentRequests.has(item.userId) ? (
                                  <button
                                    disabled
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 transition text-xs font-semibold cursor-not-allowed dark:bg-[#1c2b38] dark:border-[#1e2d3d] dark:text-slate-400"
                                  >
                                    Đã gửi lời mời kết bạn
                                  </button>
                                ) : isPending ? (
                                  <button
                                    onClick={() => handleAcceptRequest(item.userId, item.displayName)}
                                    disabled={actionLoadingId === item.userId}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition text-xs font-semibold cursor-pointer"
                                  >
                                    Đồng ý kết bạn
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleSendRequest(item.userId, item.displayName)}
                                    disabled={actionLoadingId === item.userId}
                                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-xs font-semibold shadow-sm cursor-pointer"
                                  >
                                    {actionLoadingId === item.userId ? (
                                      <Loader2 className="animate-spin" size={14} />
                                    ) : (
                                      'Kết bạn'
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
