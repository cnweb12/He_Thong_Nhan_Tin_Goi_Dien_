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
        <div className="w-full h-full flex flex-col bg-white/85 backdrop-blur shadow-[8px_0_30px_rgba(15,23,42,0.04)]">
            <div className="px-4 pt-4 pb-3 border-b border-slate-200 bg-white/75">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-slate-900 text-white flex items-center justify-center text-lg font-semibold shadow-sm">
                        {(user?.displayName || user?.name || 'K').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900 text-sm">{user?.displayName || user?.name || 'Khách'}</div>
                        <div className="text-xs text-slate-500">{user?.phone || ''}</div>
                    </div>
                </div>
            </div>

            <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Tìm người dùng để nhắn tin"
            />

            {query.trim().length >= 2 && (
                <div className="px-4 pb-3">
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-3 py-2 text-xs font-medium text-slate-500 border-b border-slate-100">
                            {searchLoading ? 'Đang tìm kiếm...' : 'Kết quả tìm kiếm'}
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
                                    className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-sky-50 transition cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-700">
                                        {(item.displayName || item.username || '?').slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-slate-900 text-sm truncate">{item.displayName || item.username}</div>
                                        <div className="text-xs text-slate-500 truncate">{item.phone || (isPhoneLike(item.username) ? item.username : '')}</div>
                                    </div>
                                    <div className="text-xs text-sky-600 font-medium">Nhắn tin</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="px-4">
                <div className="flex gap-2 mt-2 text-sm">
                    <button className="px-3 py-1.5 bg-slate-900 text-white rounded-full text-sm font-semibold">Ưu tiên</button>
                    <button className="px-3 py-1.5 text-slate-500 text-sm">Khác</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto mt-2 pb-3">
                <div className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Hộp thư</div>
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
