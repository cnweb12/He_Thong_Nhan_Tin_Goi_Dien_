import React, { useEffect, useRef } from "react";
import MessageBubble, { resolveSenderInConversation } from "./MessageBubble";
import Avatar from "../../../components/Avatar";

const formatDateDivider = (date) => {
  const now = new Date();
  const messageDate = new Date(date);

  const isToday =
    messageDate.getDate() === now.getDate() &&
    messageDate.getMonth() === now.getMonth() &&
    messageDate.getFullYear() === now.getFullYear();
  if (isToday) return "Hôm nay";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    messageDate.getDate() === yesterday.getDate() &&
    messageDate.getMonth() === yesterday.getMonth() &&
    messageDate.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return "Hôm qua";

  const isCurrentYear = messageDate.getFullYear() === now.getFullYear();
  return messageDate.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(isCurrentYear ? {} : { year: "numeric" }),
  });
};

export default function MessageList({
  messages,
  currentUserId,
  loading,
  error,
  chat,
  typingUsers = [],
  onRecallMessage,
}) {
  // Đảm bảo messages luôn là một mảng để tránh lỗi "Cannot read properties of undefined"
  const validMessages = Array.isArray(messages) ? messages : [];

  const bottomRef = useRef(null);
  const isFirstLoad = useRef(true);

  // Reset về "lần đầu load" mỗi khi chuyển sang conversation khác
  useEffect(() => {
    isFirstLoad.current = true;
  }, [chat]);

  useEffect(() => {
    if (!bottomRef.current) return;
    // Lần đầu load: scroll tức thì (không animation) để tránh header bị đẩy lên trên
    // Các lần sau (tin nhắn mới): scroll mượt
    bottomRef.current.scrollIntoView({
      behavior: isFirstLoad.current ? "auto" : "smooth",
    });
    isFirstLoad.current = false;
  }, [validMessages, typingUsers]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-slate-100 dark:bg-slate-900">
      <div className="max-w-3xl mx-auto space-y-2 pb-4">
        {loading && (
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">
            Đang tải tin nhắn...
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 shadow-sm">
            {error}
          </div>
        )}
        {!loading && !error && validMessages.length === 0 && (
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">
            Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên.
          </div>
        )}
        {(() => {
          const elements = [];
          let lastDate = null;

          validMessages.forEach((m, idx) => {
            const messageDate = new Date(m.createdAt).toDateString();
            if (messageDate !== lastDate) {
              elements.push(
                <div
                  key={`divider-${m.id || idx}`}
                  className="relative text-center my-4"
                >
                  <hr className="absolute top-1/2 left-0 w-full border-t border-slate-200 dark:border-slate-700" />
                  <span className="relative inline-block bg-slate-100 dark:bg-slate-900 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {formatDateDivider(m.createdAt)}
                  </span>
                </div>,
              );
              lastDate = messageDate;
            }

            const isMine = m.from === currentUserId;
            let isReadWatermark = false;
            if (!isMine || m.status === "read") {
              const hasNewerWatermark = validMessages
                .slice(idx + 1)
                .some(
                  (newerMsg) =>
                    newerMsg.from !== currentUserId ||
                    newerMsg.status === "read",
                );
              isReadWatermark = !hasNewerWatermark;
            }

            elements.push(
              <MessageBubble
                key={m.id || idx}
                m={m}
                isMine={isMine}
                chat={chat}
                isReadWatermark={isReadWatermark}
                onRecall={() => onRecallMessage?.(m.id)}
              />,
            );
          });
          return elements;
        })()}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-end justify-start gap-2 pt-2">
            {typingUsers.map((u, i) => {
              if (i > 0) return null; // Chỉ hiện 1 avatar
              const resolvedUser =
                resolveSenderInConversation(u.userId, chat) || {};
              const name =
                u.displayName ||
                u.username ||
                resolvedUser.displayName ||
                resolvedUser.username ||
                resolvedUser.name ||
                "?";
              const avatarUrl =
                u.avatarUrl ||
                resolvedUser.avatarUrl ||
                resolvedUser.displayAvatarUrl;

              return (
                <Avatar
                  key={u.userId}
                  src={avatarUrl}
                  name={name}
                  size="w-7 h-7"
                  textClass="text-[10px] font-semibold"
                />
              );
            })}
            <div className="flex flex-col items-start gap-1">
              <div className="bg-slate-200 dark:bg-[#182533] px-3.5 py-3 rounded-2xl rounded-bl-lg flex items-center gap-1.5 h-[36px]">
                <span
                  className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
              <span className="text-[10px] text-slate-500 ml-1">
                {typingUsers
                  .map((u) => {
                    const resolved =
                      resolveSenderInConversation(u.userId, chat) || {};
                    return (
                      u.displayName ||
                      u.username ||
                      resolved.displayName ||
                      resolved.username ||
                      resolved.name ||
                      "Ai đó"
                    );
                  })
                  .join(", ")}{" "}
                đang gõ...
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
