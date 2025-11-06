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
import { useUserOnlineStore } from "@/common/stores/useUserOnlineStore";
import { useQAUserStore } from "@/qaManagement/stores/useUserStore";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { createFallBack } from "@/qaManagement/utils/avatarUtils";

const ConversationDetails: React.FC = () => {
  const { id: conversationId } = useParams();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Partial<Message>[]>([]);
  const [conversation, setConversation] =
    useState<Partial<Conversation> | null>(null);

  // presence for the other party (student) — prefer presence store
  const onlineUsers = useUserOnlineStore((s) => s.onlineUsers);
  const [studentPresence, setStudentPresence] = useState<{
    isOnline?: boolean;
    lastSeen?: string | null;
  } | null>(null);

  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  // subscribe to store messages & typing
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
      senderId: String(d.senderId),
      content: d.content ?? d.Content ?? "",
      createdAt: new Date(d.createdAt ?? d.CreatedAt).toISOString(),
    }));
    setMessages(mapped);
  }, [storeMessages]);

  useEffect(() => {
    if (!conversationId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await useConversationStore
          .getState()
          .getConversationById(conversationId);
        const found = useConversationStore.getState().conversation;
        if (found && mounted) {
          // for teacher view, show the student (other party) in the header
          setConversation({
            id: found.id,
            title: found.title,
            studentId: found.studentId ?? null,
            studentName: found.studentName ?? null,
            studentAvatar: found.studentAvatar ?? null,
            createdAt: found.createdAt
              ? new Date(found.createdAt).toISOString()
              : undefined,
          });
          // initial presence snapshot for student (other party)
          let presence: any = null;
          try {
            presence = await useQAUserStore
              .getState()
              .getUserStatus(found.studentId ?? "");
          } catch (err) {
            // ignore
          }
          if (presence) {
            setStudentPresence({
              isOnline: presence.isOnline,
              lastSeen: presence.lastSeen,
            });
          } else {
            setStudentPresence({ isOnline: false, lastSeen: null });
          }
        }

        await useMessageStore
          .getState()
          .getMessagesByConversationId(conversationId);
        const msgs = useMessageStore.getState().messages || [];
        if (mounted) {
          const mapped = msgs.map((d: any) => ({
            id: d.id,
            senderId: String(d.senderId),
            content: d.content ?? "",
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
        await useMessageStore.getState().joinConversation?.(conversationId);
        // start read hub and mark this conversation as read for current user
        try {
          await useConversationStore.getState().startRead?.();
          await useConversationStore
            .getState()
            .upsertRead?.(conversationId || "");
        } catch (err) {
          console.warn("read hub start/upsert failed", err);
        }
      } catch (err) {
        console.warn("chat join failed", err);
      }
    })();
    return () => {
      mounted = false;
      // leave conversation and stop connection when unmounting
      (async () => {
        try {
          await useMessageStore.getState().leaveConversation?.(conversationId);
          // optionally stop the chat connection entirely if you want to free resources
          // await useMessageStore.getState().stopChat?.();
          // stop read hub when leaving
          try {
            await useConversationStore.getState().stopRead?.();
          } catch (err) {
            console.warn("stop read hub failed", err);
          }
        } catch (err) {
          console.warn("leave conversation failed", err);
        }
      })();
    };
  }, [conversationId]);

  // reactively update studentPresence from presence snapshot
  useEffect(() => {
    if (!conversation?.studentId) return;
    const sid = String(conversation.studentId ?? "")
      .toLowerCase()
      .trim();
    if (!sid) return;
    const found = (onlineUsers || []).find(
      (u: any) =>
        String(u?.userId ?? "")
          .toLowerCase()
          .trim() === sid
    );
    const next = found
      ? { isOnline: found.isOnline === true, lastSeen: found.lastSeen ?? null }
      : { isOnline: false, lastSeen: null };
    setStudentPresence((prev) => {
      if (
        prev?.isOnline === true &&
        (prev?.lastSeen ?? null) === null &&
        next.isOnline === false &&
        (next.lastSeen ?? null) === null
      )
        return prev;
      if (
        prev?.isOnline === next.isOnline &&
        (prev?.lastSeen ?? null) === (next.lastSeen ?? null)
      )
        return prev;
      return next;
    });
  }, [onlineUsers, conversation?.studentId]);

  const onSend = () => {
    if (!text.trim()) return;
    if (isSending) return;
    setIsSending(true);
    const m: Partial<Message> = {
      id: `tmp-${Date.now()}`,
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
        await useMessageStore
          .getState()
          .getMessagesByConversationId(conversationId || "");
        const msgs = useMessageStore.getState().messages || [];
        const mapped = msgs.map((d: any) => ({
          id: d.id,
          senderId: String(d.senderId),
          content: d.content ?? d.Content ?? "",
          createdAt: new Date(d.createdAt ?? d.CreatedAt).toISOString(),
        }));
        setMessages(mapped);
      } catch (err: any) {
        setError(err?.message ?? String(err));
      } finally {
        setTimeout(() => setIsSending(false), 60);
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
    }, 3000);
  };

  return (
    <div className="flex flex-col h-full ">
      <header className="flex items-center gap-4 p-4 border-b">
        <div className="relative">
          <Avatar className="h-10 w-10 border border-gray-300">
            {conversation?.studentAvatar ? (
              <AvatarImage
                src={conversation.studentAvatar}
                alt={conversation.studentName ?? "Người học"}
              />
            ) : (
              <AvatarFallback>
                {conversation?.studentName
                  ? createFallBack(conversation?.studentName)
                  : "H"}
              </AvatarFallback>
            )}
          </Avatar>
          <span
            aria-hidden
            className={`absolute right-0.5 top-0.5 translate-x-1/4 -translate-y-1/4 w-3 h-3 rounded-full ring-1 ring-white ${(() => {
              if (studentPresence) {
                return studentPresence.isOnline === true
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
              {conversation?.studentName ?? "Người học"}
            </div>
            <Badge
              variant="outline"
              className={`border-emerald-200 ${(() => {
                if (studentPresence) {
                  return studentPresence.isOnline === true
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
                if (studentPresence)
                  return studentPresence.isOnline === true
                    ? "Đang hoạt động"
                    : "Ngoại tuyến";
                const last = messages.length
                  ? messages[messages.length - 1].createdAt
                  : conversation?.createdAt;
                if (!last) return "Ngoại tuyến";
                const diff = Math.floor(
                  (Date.now() - new Date(last).getTime()) / 1000
                );
                return diff <= 300 ? "Online" : "Offline";
              })()}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {(() => {
              // show presence/last seen in header; typing UI moved to chat bubble
              if (studentPresence?.isOnline === true) return "Đang hoạt động";
              const last =
                studentPresence?.lastSeen ??
                (messages.length
                  ? messages[messages.length - 1].createdAt
                  : conversation?.createdAt);
              return last ? formatLastOnline(last) : "Không hoạt động";
            })()}
          </div>
        </div>
      </header>

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
          <Button onClick={onSend} disabled={isSending} className="flex items-center gap-2">
            <Send className="w-4 h-4" /> Gửi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConversationDetails;
