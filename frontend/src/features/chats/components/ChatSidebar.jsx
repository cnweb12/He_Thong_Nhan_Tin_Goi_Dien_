import React, { useEffect, useMemo, useState } from 'react';
import SearchBar from './SearchBar';
import ChatItem from './ChatItem';
import { searchUsersApi } from '../../users/services/userApi';

const resolveConversationId = (conversation) => conversation?.conversationId || conversation?.id || conversation?._id || null;
const isPhoneLike = (value) => typeof value === 'string' && /^[+]?\d[\d\s()-]{5,}$/.test(value.trim());

export default function ChatSidebar({ user, accessToken, conversations, selectedId, onSelect, onStartConversation }) {
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);

    useEffect(() => {
        let active = true;

        const runSearch = async () => {
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
            } catch (error) {
                if (!active) return;
                setSearchError(error?.message || 'Không tìm thấy người dùng');
                setSearchResults([]);
            } finally {
                if (active) {
                    setSearchLoading(false);
                }
            }
        };

        const timeoutId = window.setTimeout(runSearch, 250);

        return () => {
            active = false;
            window.clearTimeout(timeoutId);
        };
    }, [accessToken, query]);

    const filteredConversations = useMemo(() => conversations || [], [conversations]);

    return (
        <div className="w-full h-full flex flex-col bg-slate-50">
            <div className="p-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img 
                            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'K')}&background=0D8ABC&color=fff&rounded=true&font-size=0.45`}
                            alt="Avatar" 
                            className="w-5 h-5 rounded-full bg-slate-200"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 text-sm truncate">{user?.displayName || user?.name || 'Khách'}</div>
                        <div className="text-xs text-slate-500 truncate">{user?.phone || 'Online'}</div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-b border-slate-200">
                <SearchBar
                    value={query}
                    onChange={setQuery}
                    placeholder="Tìm kiếm hoặc bắt đầu cuộc trò chuyện"
                />
            </div>

            {query.trim().length >= 2 && (
                <div className="px-4 pb-3">
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100">
                            {searchLoading ? 'Đang tìm kiếm...' : 'Gợi ý liên hệ'}
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                            {searchError && (
                                <div className="px-3 py-3 text-sm text-red-600">{searchError}</div>
                            )}
                            {!searchLoading && !searchError && searchResults.length === 0 && (
                                <div className="px-3 py-3 text-sm text-slate-500">Không có kết quả phù hợp.</div>
                            )}
                            {searchResults.map((item) => (
                                <button
                                    key={item.userId || item._id || item.id}
                                    type="button"
                                    onClick={() => onStartConversation?.(item)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-sky-50 transition cursor-pointer"
                                >
                                     <img 
                                        src={item.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.displayName || '?')}&background=random&color=fff&rounded=true&font-size=0.45`}
                                        alt="Avatar"
                                        className="w-5 h-5 rounded-full bg-slate-200 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-slate-800 text-sm truncate">{item.displayName || item.username}</div>
                                        <div className="text-xs text-slate-500 truncate">{item.phone || (isPhoneLike(item.username) ? item.username : '')}</div>
                                    </div>
                                    <div className="text-xs text-sky-600 font-medium self-start">Nhắn tin</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conversation) => (
                    <ChatItem
                        key={resolveConversationId(conversation)}
                        chat={conversation}
                        active={resolveConversationId(conversation) === selectedId}
                        onClick={onSelect}
                    />
                ))}
            </div>
        </div>
    );
}
