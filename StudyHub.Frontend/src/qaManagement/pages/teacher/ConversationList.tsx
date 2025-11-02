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
import { axiosInstance } from "@/lib/axios";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  MessageCircleQuestion,
  Users2,
} from "lucide-react";
import { formatLastOnline } from "@/qaManagement/utils/dateUtils";

type ConversationDto = {
  id: string;
  title: string;
  isRead?: boolean;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentAvatar?: string | null;
  teacherId?: string | null;
  topicName?: string;
  subjectName?: string;
  createdAt: string;
};

const TeacherConversationList: React.FC = () => {
  const [items, setItems] = useState<ConversationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "recent">(
    "all"
  );

  useEffect(() => {
    let mounted = true;
    const fetchConversations = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await axiosInstance.get("/QAConversation");
        const json = resp.data;
        if (resp.status !== 200) {
          if (resp.status === 401) {
            setError("Bạn chưa đăng nhập hoặc phiên đã hết hạn.");
            return;
          }
          if (resp.status === 403) {
            setError("Bạn không có quyền truy cập.");
            return;
          }
          setError(json?.message ?? resp.statusText ?? "Không thể tải dữ liệu");
          return;
        }
        if (json && json.success) {
          const data = Array.isArray(json.data) ? json.data : [];
          if (mounted) setItems(data.map((d: any) => mapServerToDto(d)));
        } else {
          setError(json?.message ?? "Không thể tải dữ liệu");
        }
      } catch (err: any) {
        setError(err?.message ?? String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchConversations();
    return () => {
      mounted = false;
    };
  }, []);

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

  // derive unique students from conversations
  const students = (() => {
    const map = new Map<
      string,
      { id: string; name: string; avatar?: string | null; lastAt: string }
    >();
    for (const c of items) {
      const id = c.studentId || c.studentId === "" ? c.studentId : c.studentId;
      if (!id) continue;
      const existing = map.get(id);
      const lastAt = c.createdAt || new Date().toISOString();
      if (!existing) {
        map.set(id, {
          id,
          name: c.studentName || "Người học",
          avatar: c.studentAvatar ?? null,
          lastAt,
        });
      } else {
        if (new Date(lastAt).getTime() > new Date(existing.lastAt).getTime())
          existing.lastAt = lastAt;
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => +new Date(b.lastAt) - +new Date(a.lastAt)
    );
  })();

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <div className="inline-flex  rounded-md border bg-muted p-0.5">
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
                Trực tuyến
              </Button>
              <Button
                variant={filter === "read" ? undefined : "ghost"}
                onClick={() => setFilter("read")}
              >
                Ngoại tuyến
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="rounded-lg border">
          <div className="space-y-3 pr-2 max-h-[calc(100vh-220px)]">
            {students.map((s) => (
              <Card
                key={s.id}
                className="p-3 flex flex-row justify-center items-center gap-3"
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={s.avatar ?? ""} alt={s.name} />
                    <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span
                    aria-hidden
                    className={`absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-3 h-3 rounded-full ring-1 ring-white ${
                      s.avatar ? "bg-emerald-500" : "bg-gray-400"
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
                      s.avatar
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {s.avatar ? "Online" : "Offline"}
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
