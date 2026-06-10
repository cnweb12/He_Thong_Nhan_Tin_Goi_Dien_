import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { EmptyState, MessageBubbleSkeleton } from '../../../components/ui';

const getMessageDate = (message) => {
    const value = message?.createdAt || message?.sentAt || message?.timestamp;
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateDivider = (date) => {
    if (!date) return '';

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hôm nay';
    if (date.toDateString() === yesterday.toDateString()) return 'Hôm qua';

    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const isSameDay = (first, second) => {
    if (!first || !second) return false;
    return first.toDateString() === second.toDateString();
};

const minutesBetween = (first, second) => {
    if (!first || !second) return Number.POSITIVE_INFINITY;
    return Math.abs(second.getTime() - first.getTime()) / 60000;
};

export default function MessageList({ messages, currentUserId, loading, error }) {
    const scrollRef = useRef(null);
    const bottomRef = useRef(null);
    const shouldAutoScrollRef = useRef(true);
    const [showJumpToLatest, setShowJumpToLatest] = useState(false);

    const rows = useMemo(() => {
        const result = [];

        messages.forEach((message, index) => {
            const currentDate = getMessageDate(message);
            const previousMessage = messages[index - 1];
            const nextMessage = messages[index + 1];
            const previousDate = getMessageDate(previousMessage);
            const nextDate = getMessageDate(nextMessage);
            const isMine = message.from === currentUserId;
            const previousSameSender = previousMessage?.from === message.from
                && isSameDay(previousDate, currentDate)
                && minutesBetween(previousDate, currentDate) <= 5;
            const nextSameSender = nextMessage?.from === message.from
                && isSameDay(currentDate, nextDate)
                && minutesBetween(currentDate, nextDate) <= 5;

            if (index === 0 || !isSameDay(previousDate, currentDate)) {
                result.push({
                    type: 'date',
                    id: `date-${currentDate?.toDateString() || index}`,
                    label: formatDateDivider(currentDate),
                });
            }

            result.push({
                type: 'message',
                id: message.id || message.clientMessageId || index,
                message,
                isMine,
                isGroupedWithPrevious: previousSameSender,
                isGroupedWithNext: nextSameSender,
            });
        });

        return result;
    }, [currentUserId, messages]);

    useEffect(() => {
        if (!loading && shouldAutoScrollRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [loading, rows.length]);

    const handleScroll = () => {
        const element = scrollRef.current;
        if (!element) return;

        const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
        const isNearBottom = distanceFromBottom < 120;
        shouldAutoScrollRef.current = isNearBottom;
        setShowJumpToLatest(!isNearBottom);
    };

    const jumpToLatest = () => {
        shouldAutoScrollRef.current = true;
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        setShowJumpToLatest(false);
    };

    return (
        <div ref={scrollRef} onScroll={handleScroll} className="relative flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-slate-100">
            <div className="max-w-3xl mx-auto space-y-1 pb-4">
                {loading && <MessageBubbleSkeleton count={5} />}
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 shadow-sm">
                        {error}
                    </div>
                )}
                {!loading && !error && messages.length === 0 && (
                    <EmptyState
                        icon={MessageCircle}
                        title="Chưa có tin nhắn"
                        description="Hãy gửi lời chào đầu tiên để bắt đầu cuộc trò chuyện."
                    />
                )}
                {!loading && rows.map((row) => {
                    if (row.type === 'date') {
                        return (
                            <div key={row.id} className="flex justify-center py-3">
                                <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
                                    {row.label}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <MessageBubble
                            key={row.id}
                            m={row.message}
                            isMine={row.isMine}
                            isGroupedWithPrevious={row.isGroupedWithPrevious}
                            isGroupedWithNext={row.isGroupedWithNext}
                        />
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {showJumpToLatest && (
                <button
                    type="button"
                    onClick={jumpToLatest}
                    className="sticky bottom-3 left-1/2 z-10 mx-auto block -translate-x-1/2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-blue-700"
                >
                    Tin nhắn mới nhất
                </button>
            )}
        </div>
    );
}
