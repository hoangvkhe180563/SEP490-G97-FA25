import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { useLessonCommentStore } from "@/courseManagement/stores/useLessonCommentStore";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { useEnrollmentStore } from "@/courseManagement/stores/useEnrollmentStore";
import { Clock, Trash2 } from "lucide-react";
import type { CommentDto } from "../types/api";

type Props = {
  lessonId: number;
  courseId?: number;
};

const formatDate = (iso?: string) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

const LectureDiscussion: React.FC<Props> = ({ lessonId, courseId }) => {
  // ===== STORE =====
  const commentsMap = useLessonCommentStore((s: any) => s.commentsByLesson);
  const comments = React.useMemo(
    () => commentsMap?.[lessonId] ?? [],
    [commentsMap, lessonId]
  );

  const fetchComments = useLessonCommentStore((s) => s.fetchComments);
  const createComment = useLessonCommentStore((s) => s.createComment);
  const updateComment = useLessonCommentStore((s) => s.updateComment);
  const deleteComment = useLessonCommentStore((s) => s.deleteComment);
  const loading = useLessonCommentStore((s) => s.loading);

  const currentUser = useAppUserStore((s) => s.appUser);
  const authUser = useAuthStore((s) => s.user);
  const effectiveUserId = currentUser?.id ?? authUser?.id ?? null;

  const getEnrollmentForCourse = useEnrollmentStore(
    (s) => s.getEnrollmentForCourse
  );
  const fetchEnrollmentsByUser = useEnrollmentStore((s) => s.fetchByUser);
  const enrollmentsLoaded = useEnrollmentStore(
    (s) => Array.isArray(s.enrollments) && s.enrollments.length > 0
  );

  const enrollment = React.useMemo(() => {
    try {
      return courseId ? getEnrollmentForCourse(courseId) : null;
    } catch {
      return null;
    }
  }, [getEnrollmentForCourse, courseId]);

  const isEnrolled = Boolean(courseId && enrollment);

  // ===== STATE =====
  const [text, setText] = React.useState("");
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editingText, setEditingText] = React.useState("");

  // ===== FETCH COMMENTS =====
  React.useEffect(() => {
    if (!lessonId) return;
    (async () => {
      try {
        await fetchComments(lessonId);
      } catch (err) {
        console.error("Fetch comments failed:", err);
      }
    })();
  }, [lessonId, fetchComments]);

  // ===== LOAD ENROLLMENT =====
  React.useEffect(() => {
    if (!courseId || !effectiveUserId || enrollmentsLoaded) return;
    (async () => {
      try {
        await fetchEnrollmentsByUser(String(effectiveUserId));
      } catch (err) {
        console.error(err);
      }
    })();
  }, [courseId, effectiveUserId, enrollmentsLoaded, fetchEnrollmentsByUser]);

  // ===== HANDLERS =====
  const onSubmit = async () => {
    if (!text.trim() || !lessonId) return;
    if (!isEnrolled) return;
    try {
      await createComment({ lessonId, content: text.trim() });
      setText("");
    } catch (err) {
      console.error(err);
    }
  };

  const onStartEdit = (c: any) => {
    setEditingId(c.id);
    setEditingText(c.content || "");
  };

  const onDelete = async (id: number) => {
    try {
      await deleteComment(id);
    } catch (err) {
      console.error(err);
    }
  };

  // ===== RENDER =====
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
          💬 Cuộc thảo luận
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-5">
          {loading && (
            <div className="text-sm text-gray-500">Đang tải bình luận...</div>
          )}

          {(comments || []).map((c: CommentDto) => (
            <div
              key={c.id}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                  {c.userAvatar ? (
                    <img
                      src={c.userAvatar}
                      alt={c.userFullname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {c.userFullname
                        ? c.userFullname.charAt(0).toUpperCase()
                        : "U"}
                    </span>
                  )}
                </div>

                {/* Nội dung */}
                <div className="flex-1 min-w-0">
                  {/* Header: tên + thời gian */}
                  <div className="flex items-start justify-between flex-wrap gap-1">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm leading-tight">
                        {c.userFullname || "Người dùng"}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        <span>{formatDate(c.createdAt)}</span>
                      </div>
                    </div>

                    {/* Xóa */}
                    {effectiveUserId &&
                      String(effectiveUserId) === String(c.appUserId) &&
                      (isEnrolled || !courseId) && (
                        <button
                          onClick={() => onDelete(c.id)}
                          className="p-1.5 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                          aria-label="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                  </div>

                  {/* Nội dung / chỉnh sửa inline */}
                  {editingId === c.id ? (
                    <textarea
                      className="mt-3 w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={editingText}
                      autoFocus
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={async () => {
                        if (editingText.trim() !== c.content.trim()) {
                          try {
                            await updateComment(c.id, {
                              content: editingText.trim(),
                            });
                          } catch (err) {
                            console.error(err);
                          }
                        }
                        setEditingId(null);
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (editingText.trim() !== c.content.trim()) {
                            try {
                              await updateComment(c.id, {
                                content: editingText.trim(),
                              });
                            } catch (err) {
                              console.error(err);
                            }
                          }
                          setEditingId(null);
                        } else if (e.key === "Escape") {
                          setEditingId(null);
                          setEditingText("");
                        }
                      }}
                    />
                  ) : (
                    <p
                      className="mt-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap cursor-text hover:bg-gray-50 rounded-md p-1 transition"
                      onClick={() => {
                        if (
                          effectiveUserId &&
                          String(effectiveUserId) === String(c.appUserId) &&
                          (isEnrolled || !courseId)
                        ) {
                          onStartEdit(c);
                        }
                      }}
                    >
                      {c.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Ô nhập bình luận */}
          <div className="pt-3 border-t border-gray-100">
            {!isEnrolled ? (
              <div className="text-sm text-gray-500">
                Bạn cần ghi danh khóa học để gửi bình luận. Nếu bạn đã ghi danh
                nhưng vẫn không thể gửi, hãy tải lại trang.
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="w-full border border-gray-200 rounded-lg p-3 resize-none min-h-[80px] text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-1">
                  <span className="text-xs text-gray-400 order-2 sm:order-1">
                    Nhắc: giữ nội dung ngắn gọn, lịch sự.
                  </span>
                  <button
                    onClick={onSubmit}
                    className="px-4 py-1.5 bg-sky-600 text-white rounded-md text-sm hover:bg-sky-700 transition order-1 sm:order-2 self-end sm:self-auto"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LectureDiscussion;
