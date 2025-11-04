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
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  MessageCircleQuestion,
  Users2,
} from "lucide-react";
import { formatLastOnline } from "@/qaManagement/utils/dateUtils";
import CreateConversationModal from "../../components/CreateConversationModal";
import type { ConversationDto } from "@/qaManagement/interfaces/dtos";
import { useQAUserStore } from "@/qaManagement/stores/useUserStore";
import { createFallBack } from "@/qaManagement/utils/avatarUtils";

const ConversationList: React.FC = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const conversations = useConversationStore((s) => s.conversations);
  const loading = useConversationStore((s) => s.isLoading);
  const storeMessage = useConversationStore((s) => s.message);
  const storeSuccess = useConversationStore((s) => s.success);
  const getMine = useConversationStore((s) => s.getMine);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "recent">(
    "all"
  );

  useEffect(() => {
    let mounted = true;
    setError(null);
    const load = async () => {
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

  function mapServerToDto(d: any): ConversationDto {
    return {
      id: d.id ?? d.Id ?? "",
      title: d.title ?? d.Title ?? "(Không có tiêu đề)",
      isRead: d.isRead ?? d.IsRead ?? false,
      studentId: d.studentId ?? d.StudentId ?? "",
      studentName: d.studentName ?? d.StudentName ?? "",
      studentEmail: d.studentEmail ?? d.StudentEmail ?? "",
      studentUsername: d.studentUsername ?? d.StudentUsername ?? "",
      studentAvatar: d.studentAvatar ?? d.StudentAvatar ?? null,
      teacherId: d.teacherId ?? d.TeacherId ?? null,
      teacherName: d.teacherName ?? d.TeacherName ?? null,
      teacherAvatar: d.teacherAvatar ?? d.TeacherAvatar ?? null,
      teacherUsername: d.teacherUsername ?? d.TeacherUsername ?? null,
      type: d.type ?? d.Type ?? "",
      isPaid: d.isPaid ?? d.IsPaid ?? false,
      topicId: d.topicId ?? d.TopicId ?? 0,
      topicName: d.topicName ?? d.TopicName ?? "",
      subjectName: d.subjectName ?? d.SubjectName ?? "",
      createdAt: d.createdAt ?? d.CreatedAt ?? new Date().toISOString(),
    };
  }

  // use connected teachers from QA user store (fetched from backend)
  const connectedTeachers = useQAUserStore((s) => s.connectedTeachers);
  const getConnectedTeachers = useQAUserStore((s) => s.getConnectedTeachers);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        await getConnectedTeachers();
      } catch (err) {
        // ignore: store will set message on error
      }
    };
    if (mounted) load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mappedItems = (conversations || []).map((d: any) => mapServerToDto(d));

  // show store-level message as error when not successful
  useEffect(() => {
    if (!storeSuccess && storeMessage) setError(storeMessage || null);
  }, [storeMessage, storeSuccess]);

  const filteredItems = mappedItems
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
            <span>Giáo viên trực tuyến</span>
          </h3>
          <CreateConversationModal
            setCreateOpen={setCreateOpen}
            createOpen={createOpen}
          />
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center flex-wrap gap-3 w-full">
            <Input
              placeholder="Tìm kiếm giáo viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <div className="inline-flex rounded-md border bg-muted p-0.5">
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
            {connectedTeachers.map((t: any) => {
              const name =
                t.fullname ?? t.fullName ?? t.name ?? t.username ?? "Giáo viên";
              const avatar = t.avatar ?? t.profilePicture ?? null;
              const subject = t.subjectName ?? t.subject ?? undefined;
              const lastOnline =
                t.lastOnline ?? t.lastActivity ?? t.createdAt ?? undefined;
              const isOnline = t.isOnline === true;
              return (
                <Card
                  key={t.id}
                  className="p-3 flex flex-row justify-center items-center gap-3"
                >
                  <div className="relative">
                    <Avatar>
                      {avatar ? (
                        <AvatarImage src={avatar} alt={name} />
                      ) : (
                        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                      )}
                    </Avatar>
                    <span
                      aria-hidden
                      className={`absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-3 h-3 rounded-full ring-1 ring-white ${
                        isOnline ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {subject}
                    </div>
                  </div>

                  <div className="text-right ml-2 flex flex-col items-end">
                    <Badge
                      variant={isOnline ? undefined : "outline"}
                      className={`${
                        isOnline
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {isOnline ? "Online" : "Offline"}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatLastOnline(lastOnline)}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 w-full">
            <Input
              placeholder="Tìm kiếm cuộc hội thoại, chủ đề, người học..."
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
                <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                  Tạo cuộc hội thoại mới
                </Button>
              </Card>
            )}

            {displayedItems.map((c) => (
              <Link
                to={`/qa/student/conversations/${c.id}`}
                key={c.id}
                className="block"
              >
                <Card className="w-full p-4 hover:shadow-lg transition-shadow rounded-xl">
                  <div className="flex items-start gap-4">
                    <Avatar className="ring-1 ring-border">
                      {c.teacherAvatar ? (
                        <AvatarImage
                          src={c.teacherAvatar}
                          alt={c.teacherName || c.teacherUsername || ""}
                        />
                      ) : (
                        <AvatarFallback>
                          {c?.teacherName
                            ? createFallBack(c?.teacherName)
                            : "AI"}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/qa/student/conversations/${c.id}`}
                          className="text-lg font-medium hover:underline"
                        >
                          {c.title}
                        </Link>
                        {!c.isPaid ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Miễn phí
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200"
                          >
                            Trả phí
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground leading-snug">
                        {c.topicName} • {c.subjectName}
                      </div>

                      <div className="flex items-center justify-between pt-2 text-sm">
                        <div className="flex items-center gap-1.5 border-r pr-2">
                          <span>Giáo viên: </span>
                          <span className="font-medium">{c.teacherName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {new Date(c.createdAt).toLocaleString()}
                        </div>
                        <Link to={`/qa/student/conversations/${c.id}`}>
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

export default ConversationList;
