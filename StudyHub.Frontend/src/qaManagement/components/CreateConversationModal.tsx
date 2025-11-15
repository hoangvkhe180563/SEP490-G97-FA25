import React, { useEffect, useState, useRef } from "react";
import { Input } from "@/common/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/common/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/common/components/ui/alert-dialog";
import { Label } from "@/common/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/common/components/ui/select";
// checkbox removed: conversations are always paid
import { useNavigate } from "react-router-dom";
import { useConversationStore } from "@/qaManagement/stores/useConversationStore";
import { useTopicStore } from "@/qaManagement/stores/useTopicStore";
import { useQAUserStore } from "@/qaManagement/stores/useUserStore";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { useSubscriptionStore } from "@/paymentManagement/stores/useSubscriptionStore";

interface CreateConversationModalProps {
  setCreateOpen: React.Dispatch<React.SetStateAction<boolean>>;
  createOpen: boolean;
}

const CreateConversationModal: React.FC<CreateConversationModalProps> = ({
  setCreateOpen,
  createOpen,
}) => {
  const navigate = useNavigate();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [cTitle, setCTitle] = useState("");
  const [cTopicId, setCTopicId] = useState<string>("0");
  const [cSubjectId, setCSubjectId] = useState<string>("0");
  const [cTeacherId, setCTeacherId] = useState<string>("0");
  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError] = useState<string | null>(null);
  const [hasActiveSub, setHasActiveSub] = useState<boolean | null>(null);
  const getTopics = useTopicStore((s) => s.getTopics);
  const topics = useTopicStore((s) => s.topics || []);
  const topicsLoading = useTopicStore((s) => s.isLoading);
  const subjectTeachers = useQAUserStore((s) => s.subjectTeachers || []);
  const getTeachersBySubject = useQAUserStore((s) => s.getTeachersBySubject);
  const fetchActive = useSubscriptionStore((s) => s.fetchActive);
  const subjectTeachersLoading = useQAUserStore(
    (s) => s.subjectTeachersLoading ?? false
  );
  const subjectTeachersError = useQAUserStore(
    (s) => s.subjectTeachersError ?? null
  );
  const createConv = useConversationStore((s) => s.createConversation);
  const [teacherValidationError, setTeacherValidationError] = useState<
    string | null
  >(null);

  // load topics and teachers once on mount
  // we intentionally run this effect once; suppress exhaustive-deps warning
  useEffect(() => {
    // load topics for the create modal
    let mounted = true;
    const load = async () => {
      try {
        await getTopics();
        // get topics list; keep both selects at their placeholder defaults
        // (do not auto-select subject/topic or teachers on mount)
        if (!mounted) return;
        // intentionally do not auto-select subject/topic on mount; keep placeholders
      } catch (e) {
        // ignore
      }
    };
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const checkSub = async () => {
      if (!createOpen) return;
      try {
        const active = await fetchActive();
        console.log(active);
        setHasActiveSub(!!(active && active.isActive));
      } catch {
        setHasActiveSub(false);
      }
    };
    checkSub();
  }, [createOpen, fetchActive]);

  // ensure clicking outside the modal closes it and that the trigger is blurred
  useEffect(() => {
    if (!createOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        contentRef.current &&
        !contentRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setCreateOpen(false);
        try {
          triggerRef.current.blur();
        } catch (err) {
          // ignore
        }
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [createOpen, setCreateOpen]);

  // handle subject change: set subject, pick default topic for subject,
  // fetch teachers for that subject and auto-select the first teacher if available
  const handleSubjectChange = async (v: string) => {
    // If the user selected the placeholder ('0'), reset both selects to defaults
    if (!v || String(v) === "0") {
      setCSubjectId("0");
      setCTopicId("0");
      setCTeacherId("0");
      setTeacherValidationError(null);
      return;
    }

    // set subject and keep topic at placeholder (user may choose a topic)
    setCSubjectId(v);
    setCTopicId("0");

    // fetch teachers for this subject from server (store-managed loading)
    const sidNum = Number(v ?? 0);
    if (sidNum && typeof getTeachersBySubject === "function") {
      await getTeachersBySubject(sidNum);
    } else {
      setCTeacherId("0");
    }

    // clear any previous validation error
    setTeacherValidationError(null);
  };

  const createConversation = async () => {
    if (!cTitle.trim()) {
      setCError("Tiêu đề là bắt buộc");
      return;
    }
    // teacher is required
    if (!cTeacherId || cTeacherId === "0") {
      setTeacherValidationError("Vui lòng chọn giáo viên");
      return;
    }
    setCError(null);
    setCLoading(true);
    try {
      setTeacherValidationError(null);
      const payload = {
        title: cTitle.trim(),
        topicId: Number(cTopicId) || 0,
        teacherId: cTeacherId && cTeacherId !== "0" ? String(cTeacherId) : null,
        isPaid: true,
      };
      const resp: any = await (createConv as any)(payload);
      const json: any = resp;
      if (json && (json.success || json?.status === 201)) {
        const id = json?.data?.id ?? json?.data?.Id ?? json?.id ?? json?.Id;
        setCreateOpen(false);
        if (id) navigate(`/qa/student/conversations/${id}`);
        return;
      }
      setCError(json?.message ?? "Không thể tạo cuộc hội thoại");
    } catch (err: any) {
      setCError(err?.message ?? String(err));
    } finally {
      setCLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      try {
        triggerRef.current?.blur();
      } catch (err) {
        /* ignore */
      }
    }
  };

  return (
    <div>
      <AlertDialog open={createOpen} onOpenChange={handleOpenChange}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="rounded-full"
                  ref={triggerRef}
                >
                  <Plus className="w-20 h-20" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="!px-2 !py-1">
              Thêm hội thoại
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <AlertDialogContent ref={contentRef as any}>
          {hasActiveSub === null ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Đang kiểm tra gói</AlertDialogTitle>
                <AlertDialogDescription>
                  Đang kiểm tra gói hội thoại của bạn...
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <div>Đang kiểm tra gói của bạn...</div>
              </div>
            </>
          ) : hasActiveSub === false ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Chưa có gói hội thoại</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn chưa có gói hội thoại đang hoạt động. Vui lòng mua gói
                  tháng để tạo cuộc hội thoại mới.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="text-center text-gray-700">
                  Bạn chưa có gói hội thoại đang hoạt động. <br />
                  Vui lòng mua gói tháng để tạo cuộc hội thoại mới.
                </div>
                <Button
                  onClick={() => {
                    setCreateOpen(false);
                    navigate(`/payment/student/subscription`);
                  }}
                >
                  Mua gói tháng
                </Button>
              </div>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Tạo cuộc hội thoại mới</AlertDialogTitle>
                <AlertDialogDescription>
                  Nhập tiêu đề và chọn chủ đề (bắt buộc)
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-3 mt-2">
                <div>
                  <Label className="mb-2">Tiêu đề</Label>
                  <Input
                    value={cTitle}
                    onChange={(e) => setCTitle(e.target.value)}
                    placeholder="Nhập tiêu đề cuộc hội thoại"
                  />
                  {cError && (
                    <div className="text-sm mt-2 text-red-600">{cError}</div>
                  )}
                </div>

                <div>
                  <Label className="mb-2">Môn</Label>
                  <Select
                    value={String(cSubjectId ?? "0")}
                    onValueChange={(v) => void handleSubjectChange(String(v))}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center justify-between w-full">
                        <SelectValue placeholder="Chọn môn (bắt buộc)" />
                        {topicsLoading ? (
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        ) : null}
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Chọn môn (bắt buộc)</SelectItem>
                      {(() => {
                        const map = new Map<string, string>();
                        (topics || []).forEach((t: any) => {
                          const sid = String(
                            t?.subjectId ?? t?.SubjectId ?? "0"
                          );
                          const sname =
                            t?.subjectName ??
                            t?.SubjectName ??
                            t?.subject ??
                            "";
                          if (sid && sid !== "0") map.set(sid, sname || sid);
                        });
                        return Array.from(map.entries()).map(([id, name]) => (
                          <SelectItem key={id} value={String(id)}>
                            {name}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2">Chủ đề</Label>
                  <Select
                    value={String(cTopicId ?? "0")}
                    onValueChange={(v) => setCTopicId(v)}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center justify-between w-full">
                        <SelectValue placeholder="Chọn chủ đề (bắt buộc)" />
                        {topicsLoading ? (
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        ) : null}
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Chọn chủ đề (bắt buộc)</SelectItem>
                      {(topics || [])
                        .filter((d: any) =>
                          cSubjectId && cSubjectId !== "0"
                            ? String(d?.subjectId ?? d?.SubjectId ?? "0") ===
                              String(cSubjectId)
                            : true
                        )
                        .map((d: any) => {
                          const id = d?.id ?? d?.Id ?? 0;
                          const name =
                            d?.name ??
                            d?.Name ??
                            d?.title ??
                            d?.Title ??
                            String(id);
                          return (
                            <SelectItem key={id} value={String(id)}>
                              {name}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2">Chọn giáo viên (bắt buộc)</Label>
                  <Select
                    value={String(cTeacherId ?? "0")}
                    onValueChange={(v) => setCTeacherId(v)}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center justify-between w-full">
                        <SelectValue placeholder="Chọn giáo viên (bắt buộc)" />
                        {subjectTeachersLoading ? (
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        ) : null}
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {subjectTeachersLoading ? (
                        <SelectItem value="0">
                          Đang tải danh sách giáo viên...
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value="0">
                            Chọn giáo viên (bắt buộc)
                          </SelectItem>
                          {(subjectTeachers || []).map((t: any) => {
                            const id =
                              t?.id ?? t?.Id ?? t?.userId ?? t?.UserId ?? 0;
                            const name =
                              t?.fullname ??
                              t?.fullName ??
                              t?.name ??
                              t?.username ??
                              "Giáo viên";
                            return (
                              <SelectItem key={id} value={String(id)}>
                                {name}
                              </SelectItem>
                            );
                          })}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {(subjectTeachersError || teacherValidationError) && (
                    <div className="text-sm mt-2 text-red-600">
                      {subjectTeachersError ?? teacherValidationError}
                    </div>
                  )}
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCreateOpen(false)}>
                  Hủy
                </AlertDialogCancel>
                <div>
                  <Button onClick={createConversation} disabled={cLoading}>
                    {cLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin inline-block" />
                        Đang tạo...
                      </>
                    ) : (
                      "Tạo cuộc hội thoại"
                    )}
                  </Button>
                </div>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateConversationModal;
