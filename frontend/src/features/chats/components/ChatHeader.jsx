import React from 'react';
import { ArrowLeft, Info, Phone, Video } from 'lucide-react';
import { useCall } from '../../calls/hooks/useCall';
import { Avatar, IconButton } from '../../../components/ui';

const isPhoneLike = (value) => typeof value === 'string' && /^[+]?\d[\d\s()-]{5,}$/.test(value.trim());
const resolvePeerId = (peer) => peer?._id || peer?.id || peer?.userId || null;

export default function ChatHeader({ chat, onToggleInfo, onBack, isInfoOpen = false }) {
    const { makeCall } = useCall();
    const conversationId = chat?._id || chat?.id || chat?.conversationId;

    const inferredPeer = chat?.peer || chat?.participant || ((chat && !chat.members && !chat.participants && (chat.displayName || chat.name || chat.phone || chat.username)) ? chat : null);
    const peer = inferredPeer || {};

    const title = chat?.displayName || peer.displayName || chat?.name || 'Chọn hội thoại';
    const subtitle = (chat?.phone || (isPhoneLike(chat?.username) ? chat.username : ''))
        || (peer?.phone || (isPhoneLike(peer?.username) ? peer.username : '')) || '';
    const avatarUrl = chat?.displayAvatarUrl || chat?.avatarUrl || peer.avatarUrl || peer.displayAvatarUrl || '';
    const peerId = resolvePeerId(peer);

    const handleCallClick = (type = 'audio') => {
        if (peerId && conversationId) {
            makeCall(peer, conversationId, type);
        } else {
            console.warn('[ChatHeader] Cannot initiate call: missing peer info or conversation ID', chat);
        }
    };

    return (
        <div className="h-[68px] flex-shrink-0 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3 min-w-0">
                <IconButton
                    icon={ArrowLeft}
                    label="Quay lại"
                    onClick={onBack}
                    size="md"
                    className="-ml-2 sm:hidden"
                />

                <Avatar src={avatarUrl} name={title} alt={title} size="md" status="online" />

                <div className="min-w-0">
                    <div className="font-semibold text-slate-800 text-sm truncate">{title}</div>
                    <div className="text-xs text-slate-500 truncate">
                        {subtitle || 'Đang hoạt động'}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1 text-slate-500">
                <IconButton icon={Phone} label="Gọi thoại" tone="success" onClick={() => handleCallClick('audio')} />
                <IconButton icon={Video} label="Gọi video" tone="primary" onClick={() => handleCallClick('video')} />
                <IconButton icon={Info} label="Thông tin hội thoại" active={isInfoOpen} onClick={onToggleInfo} />
            </div>
        </div>
    );
}
