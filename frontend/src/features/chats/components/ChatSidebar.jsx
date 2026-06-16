import React, { useEffect, useMemo, useState } from 'react';
import SearchBar from './SearchBar';
import ChatItem from './ChatItem';
import { searchUsersApi } from '../../users/services/userApi';

/** Lấy id hội thoại từ nhiều shape khác nhau */
const resolveConversationId = (c) => c?.conversationId || c?.id || c?._id || null;

/** Kiểm tra có phải số điện thoại không */
const isPhoneLike = (v) => typeof v === 'string' && /^[+]?\d[\d\s()-]{5,}$/.test(v.trim());

/**
 * ChatSidebar — cột danh sách hội thoại + tìm kiếm user.
 *
 * Props:
 *  - user               : object — thông tin user hiện tại
 *  - accessToken        : string
 *  - conversations      : array — danh sách hội thoại từ ConversationProvider
 *  - selectedId         : string — id hội thoại đang chọn
 *  - onSelect           : (conversationId: string) => void
 *  - onStartConversation: (userObj) => void — bắt đầu chat với user mới
 */
export default function ChatSidebar({
    user,
    accessToken,
    conversations,
    selectedId,
    onSelect,
    onStartConversation,
    typingUsers = {},
}) {
    const [query,         setQuery]         = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError,   setSearchError]   = useState(null);

    /* ── Tìm kiếm user với debounce 250ms ── */
    useEffect(() => {
        let active = true;

        const run = async () => {
            if (!accessToken || query.trim().length < 2) {
                setSearchResults([]);
                setSearchError(null);
                setSearchLoading(false);
                return;
            }

            setSearchLoading(true);
            setSearchError(null);

            try {
                const results = await searchUsersApi(accessToken, query.trim(), { limit: 8 });
                if (!active) return;
                setSearchResults(Array.isArray(results) ? results : []);
            } catch (err) {
                if (!active) return;
                setSearchError(err?.message || 'Không tìm thấy người dùng');
                setSearchResults([]);
            } finally {
                if (active) setSearchLoading(false);
            }
        };

        const timer = window.setTimeout(run, 250);
        return () => { active = false; window.clearTimeout(timer); };
    }, [accessToken, query]);

    const filteredConversations = useMemo(() => conversations || [], [conversations]);

    const avatarUrl = user?.avatarUrl
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'K')}&background=0D8ABC&color=fff&rounded=true&font-size=0.45`;

    const isSearching = query.trim().length >= 2;

    return (
        <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#232e3c]">

            {/* ── Header: thông tin user đang đăng nhập ── */}
            <header className="p-4 border-b border-slate-200 dark:border-[#1e2d3d]">
                <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 object-cover"
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#232e3c] rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
                            {user?.displayName || user?.name || 'Khách'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user?.phone || 'Online'}
                        </p>
                    </div>
                </div>
            </header>

            {/* ── Ô tìm kiếm ── */}
            <div className="border-b border-slate-200 dark:border-[#1e2d3d]">
                <SearchBar
                    value={query}
                    onChange={setQuery}
                    onClear={() => setQuery('')}
                    loading={searchLoading}
                    placeholder="Tìm kiếm hoặc bắt đầu cuộc trò chuyện"
                />
            </div>

            {/* ── Kết quả tìm kiếm user (dropdown) ── */}
            {isSearching && (
                <div className="px-3 pb-3">
                    <div className="rounded-xl border border-slate-200 dark:border-[#1e2d3d] bg-white dark:bg-[#17212b] shadow-sm overflow-hidden">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                            {searchLoading ? 'Đang tìm kiếm...' : 'Gợi ý liên hệ'}
                        </div>

                        <div className="max-h-56 overflow-y-auto">
                            {searchError && (
                                <p className="px-3 py-3 text-sm text-red-500">{searchError}</p>
                            )}

                            {!searchLoading && !searchError && searchResults.length === 0 && (
                                <p className="px-3 py-3 text-sm text-slate-400">
                                    Không có kết quả phù hợp.
                                </p>
                            )}

                            {searchResults.map((item) => {
                                const uid         = item.userId || item._id || item.id;
                                const name        = item.displayName || item.username || '?';
                                const phone       = item.phone || (isPhoneLike(item.username) ? item.username : '');
                                const itemAvatar  = item.avatarUrl
                                    || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&rounded=true&font-size=0.45`;

                                return (
                                    <button
                                        key={uid}
                                        type="button"
                                        onClick={() => onStartConversation?.(item)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left
                                                   hover:bg-sky-50 dark:hover:bg-[#1c2b38] transition cursor-pointer"
                                    >
                                        <img
                                            src={itemAvatar}
                                            alt={name}
                                            className="w-8 h-8 rounded-full bg-slate-200 object-cover shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{name}</p>
                                            {phone && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{phone}</p>
                                            )}
                                        </div>
                                        <span className="text-xs text-sky-600 dark:text-sky-400 font-medium shrink-0">
                                            Nhắn tin
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Danh sách hội thoại ── */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 && !isSearching && (
                    <p className="px-4 py-6 text-sm text-slate-400 dark:text-slate-500 text-center">
                        Chưa có cuộc trò chuyện nào.
                    </p>
                )}

                {filteredConversations.map((c) => (
                    <ChatItem
                        key={resolveConversationId(c)}
                        chat={c}
                        active={resolveConversationId(c) === selectedId}
                        onClick={onSelect}
                        typingUsers={typingUsers[resolveConversationId(c)] || []}
                    />
                ))}
            </div>

        </div>
    );
}