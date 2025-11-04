import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/common/components/ui/avatar";
import { Button } from "@/common/components/ui/button";
import { Textarea } from "@/common/components/ui/textarea";
import { ScrollArea } from "@/common/components/ui/scroll-area";
import { Badge } from "@/common/components/ui/badge";
import { Paperclip, Send } from "lucide-react";
import { useConversationStore } from "@/qaManagement/stores/useConversationStore";
import { useMessageStore } from "@/qaManagement/stores/useMessageStore";
import type { Message } from "@/qaManagement/interfaces/message";
import type { Conversation } from "@/qaManagement/interfaces/conversation";
import { formatLastOnline, formatTime } from "@/qaManagement/utils/dateUtils";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { createFallBack } from "@/qaManagement/utils/avatarUtils";
import { useUserOnlineStore } from "@/common/stores/useUserOnlineStore";
import { useQAUserStore } from "@/qaManagement/stores/useUserStore";

const ConversationDetails = () => {
  const { id: conversationId } = useParams();
  // demo current user id
  const { user } = useAuthStore();
  // messages (loaded from API)
  const [messages, setMessages] = useState<Partial<Message>[]>([]);
  const [conversation, setConversation] =
    useState<Partial<Conversation> | null>(null);

  // reactive presence list so UI updates when presence changes
  const onlineUsers = useUserOnlineStore((s) => s.onlineUsers);
  const [teacherPresence, setTeacherPresence] = useState<{
    isOnline?: boolean;
    lastSeen?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!conversation?.teacherId) return;
    const tid = String(conversation.teacherId ?? "")
      .toLowerCase()
      .trim();
    if (!tid) return;
    const found = (onlineUsers || []).find(
      (u: any) =>
        String(u?.userId ?? u?.UserId ?? u?.id ?? u?.Id ?? "")
          .toLowerCase()
          .trim() === tid
    );
    const next = found
      ? {
          isOnline: found.isOnline === true,
          lastSeen: (found as any).lastSeen ?? (found as any).LastSeen ?? null,
        }
      : { isOnline: false, lastSeen: null };

    // If we previously knew the teacher was online (and had null lastSeen meaning "currently online"),
    // avoid flipping them back to offline when the presence snapshot is briefly missing or ambiguous.
    setTeacherPresence((prev) => {
      if (
        prev?.isOnline === true &&
        (prev?.lastSeen ?? null) === null &&
        next.isOnline === false &&
        (next.lastSeen ?? null) === null
      ) {
        // keep previous online state until we observe a definite offline timestamp
        return prev;
      }

      if (
        prev?.isOnline === next.isOnline &&
        (prev?.lastSeen ?? null) === (next.lastSeen ?? null)
      ) {
        return prev;
      }
      return next;
    });
  }, [onlineUsers, conversation?.teacherId]);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const typingTimeoutRef = useRef<any>(null);
  const storeMessages = useMessageStore((s) => s.messages);
  const storeTypingUsers = useMessageStore((s) => s.typingUsers || []);
  const isTyping = Boolean(
    storeTypingUsers.find(
      (t: any) =>
        String(t?.conversationId) === String(conversationId) &&
        t?.isTyping === true
    )
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // react to store messages changes
  useEffect(() => {
    if (!storeMessages) return;
    const mapped = (storeMessages || []).map((d: any) => ({
      id: d.id,
      senderId: d.senderId,
      content: d.content ?? d.Content ?? "",
      createdAt: new Date(d.createdAt ?? d.CreatedAt).toISOString(),
    }));
    setMessages(mapped);
  }, [storeMessages]);

  useEffect(() => {
    // load messages for conversation if id provided
    if (!conversationId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // load conversation details via store (store will populate `conversation`)
        await useConversationStore
          .getState()
          .getConversationById(conversationId);
        const found = useConversationStore.getState().conversation;
        if (found && mounted) {
          // try to resolve presence for the teacher (local store first, then server)
          let presence: any = null;
          try {
            presence = await useQAUserStore
              .getState()
              .getUserStatus(found.teacherId ?? "");
          } catch (err) {
            // ignore presence resolution error
          }

          setConversation({
            id: found.id,
            title: found.title,
            teacherId: found.teacherId ?? null,
            teacherName: found.teacherName ?? null,
            teacherAvatar: found.teacherAvatar ?? null,
            createdAt: found.createdAt
              ? new Date(found.createdAt).toISOString()
              : undefined,
          });
          // set initial presence snapshot separately (avoid redundant updates)
          if (presence) {
            setTeacherPresence((prev) => {
              const next = {
                isOnline: presence.isOnline,
                lastSeen: presence.lastSeen,
              };
              if (
                prev?.isOnline === next.isOnline &&
                (prev?.lastSeen ?? null) === (next.lastSeen ?? null)
              ) {
                return prev;
              }
              return next;
            });
          } else {
            setTeacherPresence((prev) => {
              if (prev?.isOnline === false && (prev?.lastSeen ?? null) === null)
                return prev;
              return { isOnline: false, lastSeen: null };
            });
          }
        }
        await useMessageStore
          .getState()
          .getMessagesByConversationId(conversationId);
        const msgs = useMessageStore.getState().messages || [];
        if (mounted) {
          const mapped = msgs.map((d: any) => ({
            id: d.id,
            senderId: d.senderId,
            content: d.content ?? d.Content ?? "",
            createdAt: new Date(d.createdAt ?? d.CreatedAt).toISOString(),
          }));
          setMessages(mapped);
        }
      } catch (err: any) {
        setError(err?.message ?? String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    // start chat connection and join this conversation
    (async () => {
      try {
        await useMessageStore.getState().startChat?.();
        await useMessageStore
          .getState()
          .joinConversation?.(conversationId || "");
      } catch (err) {
        console.warn("chat join failed", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [conversationId]);

  // leave conversation on unmount
  useEffect(() => {
    return () => {
      (async () => {
        try {
          await useMessageStore
            .getState()
            .leaveConversation?.(conversationId || "");
        } catch (err) {
          console.warn("leave conversation failed", err);
        }
      })();
    };
  }, [conversationId]);

  const onSend = () => {
    if (!text.trim()) return;
    // optimistic UI update
    const m: Partial<Message> = {
      id: String(Date.now()),
      senderId: user?.id || "unknown",
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((s) => [...s, m]);
    const payload = {
      conversationId: conversationId ?? "00000000-0000-0000-0000-000000000000",
      content: text.trim(),
      isFromAi: false,
      isPaid: false,
    };
    setText("");
    (async () => {
      try {
        await useMessageStore.getState().sendMessage(payload);
        // refresh messages from store after sending
        await useMessageStore
          .getState()
          .getMessagesByConversationId(conversationId || "");
        const msgs = useMessageStore.getState().messages || [];
        const mapped = msgs.map((d: any) => ({
          id: d.id,
          senderId: d.senderId,
          content: d.content ?? d.Content ?? "",
          createdAt: new Date(d.createdAt ?? d.CreatedAt).toISOString(),
        }));
        setMessages(mapped);
      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
    })();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const onTextChange = (val: string) => {
    setText(val);
    if (!conversationId) return;
    try {
      useMessageStore.getState().sendTyping?.(conversationId, true);
    } catch (err) {
      console.warn("sendTyping start failed", err);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      try {
        useMessageStore.getState().sendTyping?.(conversationId, false);
      } catch (err) {
        console.warn("sendTyping stop failed", err);
      }
    }, 10000);
  };

  return (
    <div className="flex flex-col h-full ">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b">
        <div className="relative">
          <Avatar className="h-10 w-10 border border-gray-300">
            {conversation?.teacherAvatar ? (
              <AvatarImage
                src={conversation.teacherAvatar}
                alt={conversation.teacherName ?? "Teacher"}
              />
            ) : (
              <AvatarFallback>
                {conversation?.teacherName
                  ? createFallBack(conversation?.teacherName)
                  : "AI"}
              </AvatarFallback>
            )}
          </Avatar>
          {/* status dot: prefer presence.isOnline explicitly; if presence indicates offline, show offline even if lastSeen is recent */}
          <span
            aria-hidden
            className={`absolute right-0.5 top-0.5 translate-x-1/4 -translate-y-1/4 w-3 h-3 rounded-full ring-1 ring-white ${(() => {
              if (teacherPresence) {
                return teacherPresence.isOnline === true
                  ? "bg-emerald-500"
                  : "bg-gray-400";
              }
              const last = messages.length
                ? messages[messages.length - 1].createdAt
                : conversation?.createdAt;
              if (!last) return "bg-gray-400";
              const diff = Math.floor(
                (Date.now() - new Date(last).getTime()) / 1000
              );
              return diff <= 300 ? "bg-emerald-500" : "bg-gray-400";
            })()}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold">
              {conversation?.teacherName ?? "Người hỗ trợ"}
            </div>
            <Badge
              variant="outline"
              className={`border-emerald-200 ${(() => {
                // If presence snapshot exists, use isOnline strictly.
                if (teacherPresence) {
                  return teacherPresence.isOnline === true
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-gray-600 bg-gray-100";
                }
                const last = messages.length
                  ? messages[messages.length - 1].createdAt
                  : conversation?.createdAt;
                if (!last) return "text-gray-600 bg-gray-100";
                const diff = Math.floor(
                  (Date.now() - new Date(last).getTime()) / 1000
                );
                return diff <= 300
                  ? "text-emerald-700 bg-emerald-50"
                  : "text-gray-600 bg-gray-100";
              })()}`}
            >
              {(() => {
                if (teacherPresence) {
                  return teacherPresence.isOnline === true
                    ? "Trực tuyến"
                    : "Ngoại tuyến";
                }
                const last = messages.length
                  ? messages[messages.length - 1].createdAt
                  : conversation?.createdAt;
                if (!last) return "Ngoại tuyến";
                const diff = Math.floor(
                  (Date.now() - new Date(last).getTime()) / 1000
                );
                return diff <= 300 ? "Trực tuyến" : "Ngoại tuyến";
              })()}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {(() => {
              // If presence snapshot says online, show "Đang hoạt động" explicitly.
              if (teacherPresence?.isOnline === true) return "Đang hoạt động";
              const last =
                teacherPresence?.lastSeen ??
                (messages.length
                  ? messages[messages.length - 1].createdAt
                  : conversation?.createdAt);
              return last ? formatLastOnline(last) : "Không hoạt động";
            })()}
          </div>
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-auto overflow-hidden">
        <ScrollArea className="h-full" style={{ padding: 16 }}>
          <div className="space-y-4">
            {loading && (
              <div className="text-sm text-muted-foreground">
                Đang tải tin nhắn...
              </div>
            )}
            {error && <div className="text-sm text-red-600">{error}</div>}
            {messages.map((m) => {
              const isMe = m.senderId === user?.id;
              return (
                <div
                  key={m.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      isMe
                        ? "bg-blue-600 text-white rounded-l-xl rounded-tr-xl"
                        : "bg-gray-100 text-gray-900 rounded-r-xl rounded-tl-xl"
                    } px-4 py-2`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    <div
                      className={`text-[10px] mt-1 ${
                        isMe ? "text-blue-100" : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(m.createdAt ?? "")}
                    </div>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[70%] bg-gray-200 text-gray-700 rounded-r-xl rounded-tl-xl px-4 py-2 text-sm flex items-center">
                  <div className="flex items-center space-x-1">
                    <span
                      className="typing-dot"
                      style={{ animationDelay: "0s" }}
                    />
                    <span
                      className="typing-dot"
                      style={{ animationDelay: "0.12s" }}
                    />
                    <span
                      className="typing-dot"
                      style={{ animationDelay: "0.24s" }}
                    />
                  </div>
                  <style>{`
                    @keyframes typingBounce {
                      0% { transform: translateY(0); opacity: 0.6 }
                      25% { transform: translateY(-6px); opacity: 1 }
                      50% { transform: translateY(0); opacity: 0.6 }
                      100% { transform: translateY(0); opacity: 0.6 }
                    }
                    .typing-dot {
                      display: inline-block;
                      width: 8px;
                      height: 8px;
                      background: #374151; /* gray-700 */
                      border-radius: 9999px;
                      animation: typingBounce 0.9s ease-in-out infinite;
                    }
                  `}</style>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </main>

      {/* Composer */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <button className="p-2  rounded-md hover:bg-gray-100">
            <Paperclip className="w-5 h-5" />
          </button>
          <Textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Viết tin nhắn..."
            className="flex-1 max-h-36"
          />
          <Button onClick={onSend} className="flex items-center gap-2">
            <Send className="w-4 h-4" /> Gửi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConversationDetails;
