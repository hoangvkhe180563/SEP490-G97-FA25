import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/common/components/ui/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/common/components/ui/avatar";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { Input } from "@/common/components/ui/input";
import { ScrollArea } from "@/common/components/ui/scroll-area";
import { useConversationStore } from "@/qaManagement/stores/useConversationStore";
import { useQAUserStore } from "@/qaManagement/stores/useUserStore";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  MessageCircleQuestion,
  Users2,
} from "lucide-react";
import { formatLastOnline } from "@/qaManagement/utils/dateUtils";
import { useUserOnlineStore } from "@/common/stores/useUserOnlineStore";
import type { ConversationDto } from "@/qaManagement/interfaces/dtos";
import { createFallBack } from "@/qaManagement/utils/avatarUtils";

const TeacherConversationList: React.FC = () => {
  const [items, setItems] = useState<ConversationDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const conversations = useConversationStore((s) => s.conversations);
  const loading = useConversationStore((s) => s.isLoading);
  const getMine = useConversationStore((s) => s.getMine);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "recent">(
    "all"
  );

  // sidebar student search & filter (separate from main conversation filters)
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState<
    "all" | "online" | "offline"
  >("all");

  // load current user's conversations via store
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setError(null);
      try {
        await getMine();
      } catch (err: any) {
        if (mounted) setError(err?.message ?? String(err));
      }
    };
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // map store conversations to local DTOs for display
  useEffect(() => {
    if (!conversations || conversations.length === 0) {
      setItems([]);
      return;
    }
    setItems(conversations.map((d: any) => mapServerToDto(d)));
  }, [conversations]);

  function mapServerToDto(d: any): ConversationDto {
    return {
      id: d.id ?? d.Id ?? "",
      title: d.title ?? d.Title ?? "(Không có tiêu đề)",
      isRead: d.isRead ?? d.IsRead ?? false,
      studentId: d.studentId ?? d.StudentId ?? "",
      studentName: d.studentName ?? d.StudentName ?? "",
      studentEmail: d.studentEmail ?? d.StudentEmail ?? undefined,
      studentAvatar: d.studentAvatar ?? d.StudentAvatar ?? null,
      teacherId: d.teacherId ?? d.TeacherId ?? null,
      topicName: d.topicName ?? d.TopicName ?? "",
      subjectName: d.subjectName ?? d.SubjectName ?? "",
      createdAt: d.createdAt ?? d.CreatedAt ?? new Date().toISOString(),
    };
  }

  // students list: use connectedStudents from QA user store (students with conversations)
  const connectedStudents = useQAUserStore((s) => s.connectedStudents);
  const getConnectedStudents = useQAUserStore((s) => s.getConnectedStudents);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        await getConnectedStudents();
      } catch (err) {
        // ignore
      }
    };
    if (mounted) load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onlineUsers = useUserOnlineStore((s) => s.onlineUsers);

  const findOnlineUser = (userId: any) => {
    const tid = String(userId ?? "")
      .toLowerCase()
      .trim();
    if (!tid) return null;
    return (onlineUsers || []).find(
      (u: any) =>
        String(u?.userId ?? "")
          .toLowerCase()
          .trim() === tid
    );
  };

  const students = (connectedStudents || [])
    .map((t: any) => {
      const name =
        t.fullname ?? t.fullName ?? t.name ?? t.username ?? "Người học";
      const avatar = t.avatar ?? t.profilePicture ?? null;
      const matched = findOnlineUser(t.id);
      const isOnline = matched?.isOnline === true || t.isOnline === true;
      const lastAt =
        matched?.lastSeen ??
        t.lastOnline ??
        t.lastActivity ??
        t.createdAt ??
        new Date().toISOString();
      return { id: t.id ?? t.Id ?? "", name, avatar, lastAt, isOnline };
    })
    .sort((a: any, b: any) => +new Date(b.lastAt) - +new Date(a.lastAt));

  // apply sidebar search + online/offline filter to students list
  const filteredStudents = (students || []).filter((s: any) => {
    if (studentFilter === "online" && !s.isOnline) return false;
    if (studentFilter === "offline" && s.isOnline) return false;
    if (!studentSearch) return true;
    const q = String(studentSearch).toLowerCase().trim();
    return (s.name || "").toLowerCase().includes(q);
  });

  const filteredItems = items
    .filter((it) => {
      if (filter === "unread") return !it.isRead;
      if (filter === "read") return !!it.isRead;
      return true;
    })
    .filter((it) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        (it.title || "").toLowerCase().includes(s) ||
        (it.topicName || "").toLowerCase().includes(s) ||
        (it.subjectName || "").toLowerCase().includes(s) ||
        (it.studentName || "").toLowerCase().includes(s)
      );
    });

  // use connected teachers from QA user store

  const displayedItems =
    filter === "recent"
      ? [...filteredItems].sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
        )
      : filteredItems;

  return (
    <div className="flex gap-6 p-6 min-h-[calc(100vh-100px)]">
      <aside className="w-72 shrink-0">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm flex items-center gap-2 font-semibold">
            <Users2 />
            <span>Học sinh đã kết nối</span>
          </h3>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center flex-wrap gap-3 w-full">
            <Input
              placeholder="Tìm học sinh..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="max-w-md"
            />
            <div className="inline-flex  rounded-md border bg-muted p-0.5">
              <Button
                variant={studentFilter === "all" ? undefined : "ghost"}
                onClick={() => setStudentFilter("all")}
              >
                Tất cả
              </Button>
              <Button
                variant={studentFilter === "online" ? undefined : "ghost"}
                onClick={() => setStudentFilter("online")}
              >
                Trực tuyến
              </Button>
              <Button
                variant={studentFilter === "offline" ? undefined : "ghost"}
                onClick={() => setStudentFilter("offline")}
              >
                Ngoại tuyến
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="rounded-lg border">
          <div className="space-y-3 pr-2 max-h-[calc(100vh-220px)]">
            {filteredStudents.map((s) => (
              <Card
                key={s.id}
                className="p-3 flex flex-row justify-center items-center gap-3"
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={s.avatar ?? ""} alt={s.name} />
                    <AvatarFallback>{createFallBack(s.name)}</AvatarFallback>
                  </Avatar>
                  <span
                    aria-hidden
                    className={`absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-3 h-3 rounded-full ring-1 ring-white ${
                      s.isOnline ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {s.name}
                  </div>
                </div>
                <div className="text-right ml-2 flex flex-col items-end">
                  <Badge
                    variant={s.avatar ? undefined : "outline"}
                    className={`${
                      s.isOnline
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {s.isOnline ? "Online" : "Offline"}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatLastOnline(s.lastAt)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 w-full">
            <Input
              placeholder="Tìm cuộc hội thoại, chủ đề, người học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant={filter === "all" ? undefined : "ghost"}
                onClick={() => setFilter("all")}
              >
                Tất cả
              </Button>
              <Button
                variant={filter === "unread" ? undefined : "ghost"}
                onClick={() => setFilter("unread")}
              >
                Chưa đọc
              </Button>
              <Button
                variant={filter === "read" ? undefined : "ghost"}
                onClick={() => setFilter("read")}
              >
                Đã đọc
              </Button>
              <Button
                variant={filter === "recent" ? undefined : "ghost"}
                onClick={() => setFilter("recent")}
              >
                Gần đây
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="rounded-lg border">
          <div className="p-4 space-y-3 min-h-0 max-h-[calc(100vh-120px)]">
            {loading && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-4 animate-pulse space-y-2">
                    <div className="h-4 w-1/3 bg-muted rounded" />
                    <div className="h-3 w-2/3 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                  </Card>
                ))}
              </div>
            )}

            {error && (
              <Card className="p-6 text-center bg-red-50 text-red-700 border border-red-200">
                <AlertTriangle className="w-5 h-5 mx-auto mb-2" />
                {error}
              </Card>
            )}

            {displayedItems.length === 0 && !loading && !error && (
              <Card className="p-10 text-center text-muted-foreground">
                <MessageCircleQuestion className="w-10 h-10 mx-auto mb-3 text-muted-foreground/70" />
                <p>Chưa có cuộc hội thoại nào.</p>
              </Card>
            )}

            {displayedItems.map((c) => (
              <Link
                to={`/qa/teacher/conversations/${c.id}`}
                key={c.id}
                className="block"
              >
                <Card className="w-full p-4 hover:shadow-lg transition-shadow rounded-xl">
                  <div className="flex items-start gap-4">
                    <Avatar className="ring-1 ring-border">
                      {c.studentAvatar ? (
                        <AvatarImage
                          src={c.studentAvatar}
                          alt={c.studentName || ""}
                        />
                      ) : (
                        <AvatarFallback>
                          {(c.studentName || "").charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/qa/teacher/conversations/${c.id}`}
                          className="text-lg font-medium hover:underline"
                        >
                          {c.title}
                        </Link>
                        <Badge
                          variant="outline"
                          className={
                            c.isRead
                              ? "bg-gray-100 text-gray-700 border-gray-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }
                        >
                          {c.isRead ? "Đã đọc" : "Mới"}
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground leading-snug">
                        {c.topicName} • {c.subjectName}
                      </div>

                      <div className="flex items-center justify-between pt-2 text-sm">
                        <div className="flex items-center gap-1.5 border-r pr-2">
                          <span>Người học: </span>
                          <span className="font-medium">{c.studentName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {new Date(c.createdAt).toLocaleString()}
                        </div>
                        <Link to={`/qa/teacher/conversations/${c.id}`}>
                          <Button
                            variant="ghost"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            Mở <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default TeacherConversationList;
