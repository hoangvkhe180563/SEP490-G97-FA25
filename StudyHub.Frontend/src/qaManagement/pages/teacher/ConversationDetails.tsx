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

const ConversationDetails: React.FC = () => {
  const { id: conversationId } = useParams();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Partial<Message>[]>([]);
  const [conversation, setConversation] =
    useState<Partial<Conversation> | null>(null);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
    return () => {
      mounted = false;
    };
  }, [conversationId]);

  const onSend = () => {
    if (!text.trim()) return;
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
      }
    })();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex flex-col h-full ">
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
          <span
            aria-hidden
            className={`absolute right-0.5 top-0.5 translate-x-1/4 -translate-y-1/4 w-3 h-3 rounded-full ring-1 ring-white ${(() => {
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
                const last = messages.length
                  ? messages[messages.length - 1].createdAt
                  : conversation?.createdAt;
                if (!last) return "Offline";
                const diff = Math.floor(
                  (Date.now() - new Date(last).getTime()) / 1000
                );
                return diff <= 300 ? "Online" : "Offline";
              })()}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {(() => {
              const last = messages.length
                ? messages[messages.length - 1].createdAt
                : conversation?.createdAt;
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
            onChange={(e) => setText(e.target.value)}
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
