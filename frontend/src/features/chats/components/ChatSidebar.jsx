import React, { useEffect, useMemo, useState } from 'react';
import SearchBar from './SearchBar';
import ChatItem from './ChatItem';
import { searchUsersApi } from '../../users/services/userApi';
import { Avatar, ChatItemSkeleton, EmptyState } from '../../../components/ui';

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
                    <Avatar
                        src={user?.avatarUrl}
                        name={user?.displayName || user?.name || 'K'}
                        alt="Avatar"
                        size="md"
                        status="online"
                    />

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
                            {searchLoading && <ChatItemSkeleton count={3} />}
                            {!searchLoading && !searchError && searchResults.length === 0 && (
                                <EmptyState
                                    compact
                                    title="Không có kết quả"
                                    description="Thử tìm bằng tên hoặc số điện thoại khác."
                                />
                            )}
                            {!searchLoading && searchResults.map((item) => (
                                <button
                                    key={item.userId || item._id || item.id}
                                    type="button"
                                    onClick={() => onStartConversation?.(item)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-sky-50 transition cursor-pointer"
                                >
                                    <Avatar src={item.avatarUrl} name={item.displayName || item.username || '?'} alt="Avatar" size="sm" />
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
                {filteredConversations.length === 0 && (
                    <EmptyState
                        title="Chưa có cuộc trò chuyện"
                        description="Tìm người dùng phía trên để bắt đầu nhắn tin."
                    />
                )}
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
