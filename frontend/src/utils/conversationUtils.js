/**
 * Shared utilities for conversation-related operations.
 * Single source of truth — replaces 4 duplicate copies scattered across components.
 */

/**
 * Kiểm tra xem chuỗi có phải số điện thoại không (dùng để ẩn/hiện số trong UI)
 * @param {string} s
 * @returns {boolean}
 */
export const isPhoneLike = (s) => /^\+?[0-9\s\-().]{7,}$/.test(s || '');

/**
 * Lấy conversationId từ các dạng object conversation khác nhau từ backend.
 * Backend trả về conversation object với field _id, id, hoặc conversationId tuỳ endpoint.
 * @param {object} conversation
 * @returns {string|null}
 */
export const resolveConversationId = (conversation) =>
  conversation?.conversationId || conversation?.id || conversation?._id || null;

/**
 * Format timestamp thành chuỗi giờ:phút
 * @param {string|Date} value
 * @returns {string}
 */
export const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Normalize message object từ backend về shape thống nhất dùng trong UI
 * @param {object} message - raw message từ API hoặc socket
 * @returns {object} normalized message
 */
export const normalizeMessage = (message) => ({
  id:
    message?._id ||
    message?.id ||
    message?.clientMessageId ||
    `${message?.seq || 'msg'}-${message?.createdAt || ''}`,
  from: message?.senderId || message?.from || '',
  sender: message?.sender || message?.user || message?.fromUser || null,
  text: message?.text || message?.content || '',
  time: formatTime(message?.createdAt),
  createdAt: message?.createdAt,
  type: message?.type || 'text',
  seq: message?.seq,
  clientMessageId: message?.clientMessageId,
  attachments: message?.attachments || [],
  deletedAt: message?.deletedAt,
  status: message?.status || 'sent',
});

/**
 * Normalize conversation object nhận từ socket về shape thống nhất
 * @param {object} conversation - raw conversation từ socket event
 * @param {string} currentUserId
 * @returns {object|null}
 */
export const normalizeConversationFromSocket = (conversation, currentUserId) => {
  if (!conversation) return null;
  const { members = [], type, _id, title, avatarUrl: groupAvatarUrl } = conversation;
  const base = { ...conversation, conversationId: _id, id: _id };

  if (type === 'direct') {
    const peer = members.find((m) => m.userId !== currentUserId);
    if (peer?.user) {
      base.displayName = peer.user.displayName;
      base.displayAvatarUrl = peer.user.avatarUrl;
      base.peer = peer.user;
    }
  } else {
    base.displayName = title;
    base.displayAvatarUrl = groupAvatarUrl;
  }
  return base;
};

/**
 * Lấy text preview cho tin nhắn cuối cùng hiển thị ở sidebar
 * @param {object} message
 * @returns {string}
 */
export const getMessagePreviewText = (message) => {
  if (!message) return 'Chưa có tin nhắn';
  if (message.deletedAt) return 'Tin nhắn đã thu hồi';
  if (message.text) return message.text;
  if (message.attachments?.length > 0) {
    const isImage =
      message.type === 'image' || message.attachments[0].mimeType?.startsWith('image/');
    return isImage ? '[Hình ảnh]' : '[Tệp đính kèm]';
  }
  return 'Chưa có tin nhắn';
};
