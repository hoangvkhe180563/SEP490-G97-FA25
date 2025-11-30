import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import type { ClassWork } from "@/classManagement/interfaces/class";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { mapToCoarseRole } from "@/classManagement/utils/roleutil";
import type {
  ClassInfo,
  ClassMemberDto,
  ClassNotification,
  DocumentDto,
} from "@/classManagement/interfaces/class";
import { ChevronRight } from "lucide-react";
import { axiosInstance } from "@/lib/axios";

import { Button } from "@/common/components/ui/button";
import { Card } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/common/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
  BreadcrumbList,
} from "@/common/components/ui/breadcrumb";

// NOTE: import path fixed to match the notifications component filename/exports
import NotificationsTab from "@/classManagement/components/tabs/notificationTab";
import ExerciseTab from "@/classManagement/components/tabs/exerciseTab";
import EveryoneTab from "@/classManagement/components/tabs/everyoneTab";
import ClassExams from "@/classManagement/components/ClassExams";
import MemberRowSimple from "@/classManagement/components/ui/memberrowsimple";

import { isPastDeadline } from "@/classManagement/utils/dateutil";
import { useNotificationStore } from "@/classManagement/stores/useNotificationStore";

const DetailedClassTeacher: React.FC = () => {
  const params = useParams<{ id?: string; role?: string }>();
  const id = params.id ?? "";

  const { user } = useAuthStore();
  const coarseRole = mapToCoarseRole(user?.roles);
  const role =
    coarseRole === "student"
      ? "student"
      : coarseRole === "teacher"
      ? "teacher"
      : localStorage.getItem("currentUserRole") === "teacher"
      ? "teacher"
      : "student";

  const {
    getClassInfo,
    getClassMembers,
    getClassWorks,
    currentClass,
    getMemberCount,
    getDocumentsByClassId,
    isLoading,
    createNotification,
    getClassworkSubmissions,
    getSubmissionCount,
    getUnreadCount,
  } = useClassStore();

  const {
    connect,
    joinClass,
    leaveClass,
    addNewNotificationListener,
    removeNewNotificationListener,
  } = useNotificationStore();

  const [selectedMember, setSelectedMember] = useState<ClassMemberDto | null>(
    null
  );
  const [openAddMember, setOpenAddMember] = useState(false);

  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const [notifications, setNotifications] = useState<ClassNotification[]>([]);

  const [classMemberCount, setClassMemberCount] = useState<number | null>(null);

  const [submissionCounts, setSubmissionCounts] = useState<
    Record<number, number | null>
  >({});
  const [memberCounts, setMemberCounts] = useState<
    Record<number, number | null>
  >({});

  const [unreadNotificationsCount, setUnreadNotificationsCount] =
    useState<number>(0);
  const [unreadClassworkCount, setUnreadClassworkCount] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<string>("notifications");
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();
  const DocumentPreviewCard: React.FC<{ doc: DocumentDto; role: string }> = ({
    doc,
    role,
  }) => {
    const navigate = useNavigate();
    const isImage = !!(
      doc.fileType && /jpg|jpeg|png|gif|bmp|webp/i.test(String(doc.fileType))
    );
    const isPdf = !!(doc.fileType && /pdf/i.test(String(doc.fileType)));

    const detailPath = `/document/student/details/${doc.id}`;

    return (
      <a
        href={detailPath}
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
            return;
          }
          e.preventDefault();
          navigate(detailPath);
        }}
        className="block"
        title={doc.name}
      >
        <Card className="p-3 hover:shadow-md transition">
          <div className="w-full h-36 flex flex-col items-center justify-start gap-3">
            <div className="w-full h-24 bg-gray-100 flex items-center justify-center overflow-hidden rounded-lg">
              {isImage ? (
                <img
                  src={doc.documentUrl}
                  alt={doc.name}
                  className="w-full h-full object-cover rounded"
                />
              ) : isPdf ? (
                <div className="text-sm text-slate-600 text-center px-2">
                  <svg
                    className="mx-auto mb-1"
                    width="44"
                    height="44"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M13 2v6h6"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="text-sm font-medium">PDF</div>
                </div>
              ) : (
                <div className="text-sm text-slate-600 text-center px-2">
                  <div className="mb-1 text-2xl">📄</div>
                  <div className="text-sm">Tài liệu</div>
                </div>
              )}
            </div>
            <div className="text-sm text-slate-700 text-center line-clamp-2 px-1 font-medium">
              {doc.name}
            </div>
            <div className="text-xs text-slate-400">{doc.uploaderName ?? ""}</div>
          </div>
        </Card>
      </a>
    );
  };

  // initialize activeTab from query param if present, otherwise default notifications
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setActiveTab(t);
    else setActiveTab("notifications");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // fetch class info
  useEffect(() => {
    if (id) {
      getClassInfo(Number(id));
    }
  }, [id, getClassInfo]);

  // fetch member count
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const cnt = await getMemberCount(Number(id));
        if (mounted) setClassMemberCount(cnt);
      } catch {
        if (mounted) setClassMemberCount(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, getMemberCount]);

  // fetch documents
  useEffect(() => {
    if (!id) return;
    const fetchFn = getDocumentsByClassId;
    if (!fetchFn) return;
    let mounted = true;
    (async () => {
      try {
        setDocsLoading(true);
        const docs = await fetchFn(Number(id));
        if (mounted) setDocuments(docs ?? []);
      } catch {
        if (mounted) setDocuments([]);
      } finally {
        if (mounted) setDocsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, getDocumentsByClassId]);

  // populate notifications initially from currentClass
  useEffect(() => {
    if (currentClass?.data?.notifications) {
      setNotifications(currentClass.data.notifications);
    }
  }, [currentClass?.data?.notifications]);

  // SignalR connect & join class group
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        await connect();
        await joinClass(id);
      } catch (err) {
        console.warn("Notification hub connect/join failed", err);
      }
    })();

    return () => {
      try {
        leaveClass(id);
      } catch {
        /* empty */
      }
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const handler = (payload: any) => {
      try {
        const cid = String(payload?.classId ?? payload?.ClassId ?? "");
        if (String(cid) === String(id) || Number(cid) === Number(id)) {
          setNotifications((prev) => {
            const exists = prev.some(
              (p) => String(p.id) === String(payload?.id ?? payload?.Id ?? "")
            );
            if (exists) return prev;
            return [payload as ClassNotification, ...(prev ?? [])];
          });
        }
      } catch (err) {
        console.error("new notification handler error", err);
      }
    };

    addNewNotificationListener(handler);
    return () => {
      removeNewNotificationListener(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // fetch unread counts per-type when id or activeTab changes; keep badges up-to-date
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        console.log("loading unread counts for class tabs", id, user?.id);
        const [notifCount, cwCount] = await Promise.all([
          getUnreadCount(Number(id), "notification", user?.id).catch(() => 0),
          getUnreadCount(Number(id), "classwork", user?.id).catch(() => 0),
        ]);
        if (!mounted) return;
        setUnreadNotificationsCount(Number(notifCount ?? 0));
        setUnreadClassworkCount(Number(cwCount ?? 0));
      } catch (err) {
        console.warn("failed to load unread counts for class tabs", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, getUnreadCount, activeTab]);

  // fetch members when user opens "everyone" tab and not already loaded
  useEffect(() => {
    if (!id) return;
    if (activeTab !== "everyone") return;
    // if currentClass already has members, skip; otherwise call getClassMembers
    const hasTeacher = !!currentClass?.data?.teacher;
    const hasStudents = (currentClass?.data?.students ?? []).length > 0;
    const hasParents = (currentClass?.data?.parents ?? []).length > 0;

    if (!hasTeacher && !hasStudents && !hasParents) {
      getClassMembers(Number(id));
    }
  }, [
    activeTab,
    id,
    currentClass?.data?.teacher,
    currentClass?.data?.students,
    currentClass?.data?.parents,
    getClassMembers,
  ]);

  // fetch works when user opens "exercise" tab
  useEffect(() => {
    if (!id) return;
    if (activeTab !== "exercise") return;
    const hasWorks = (currentClass?.data?.works ?? []).length > 0;
    if (!hasWorks) {
      getClassWorks(Number(id));
    }
  }, [activeTab, id, currentClass?.data?.works, getClassWorks]);

  // handlers
  const handlePost = async (
    content: string,
    files?: File[],
    links?: any[],
    titleFromComposer?: string
  ) => {
    if (!id) return;
    const fallbackTitle =
      content && content.length > 40
        ? `${content.slice(0, 40)}...`
        : "Thông báo mới";
    const titleToSend =
      titleFromComposer && titleFromComposer.trim().length > 0
        ? titleFromComposer.trim()
        : fallbackTitle;
    const createdBy = user?.id ?? "";
    try {
      const payload = {
        classId: Number(id),
        title: titleToSend,
        description: content,
        files,
        links,
        createdBy,
      };
      const created = await createNotification(payload);
      if (created) {
        // optimistic append; server will broadcast NewNotificationFull as well
        setNotifications((prev) => [created, ...(prev ?? [])]);
        // refresh class info to keep server state in sync
        await getClassInfo(Number(id));
      }
    } catch (err) {
      console.error("handlePost/createNotification error:", err);
    }
  };

  const handleMail = (person: ClassMemberDto) => {
    window.location.href = `mailto:${person.fullname
      .replace(/\s+/g, ".")
      .toLowerCase()}@example.com`;
  };

  const handleSelect = (p: ClassMemberDto) => setSelectedMember(p);
  const handleCloseModal = () => setSelectedMember(null);

  const handleOpenAdd = () => setOpenAddMember(true);
  const handleCloseAdd = () => setOpenAddMember(false);
  const handleInvited = (res?: any) => {
    if (id) {
      getClassMembers(Number(id));
      // refresh member count and documents as before
      axiosInstance
        .get(`/Class/membercount/${id}`)
        .then((res) => {
          const raw = res?.data ?? null;
          let count: number | null = null;
          if (raw !== null) {
            if (typeof raw === "number") count = raw;
            else if (typeof raw?.data === "number") count = raw.data;
            else if (typeof raw?.count === "number") count = raw.count;
          }
          setClassMemberCount(count);
        })
        .catch((e) => {
          console.error("failed to refresh member count:", e);
        });

      if (getDocumentsByClassId) {
        getDocumentsByClassId(Number(id))
          .then((docs) => setDocuments(docs ?? []))
          .catch((e) => {
            console.error("failed to refresh documents:", e);
          });
      }
    }
    handleCloseAdd();
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Đang tải thông tin lớp học...
      </div>
    );
  }

  if (!currentClass?.success) {
    return (
      <div className="p-8 text-center text-red-500">
        Không thể tải thông tin lớp học.
      </div>
    );
  }

  const classInfo: ClassInfo | null = currentClass?.data?.classInfo ?? null;
  const teacher: ClassMemberDto | null = currentClass?.data?.teacher ?? null;
  const students: ClassMemberDto[] = currentClass?.data?.students ?? [];
  const parents: ClassMemberDto[] = currentClass?.data?.parents ?? [];
  const worksFromStore: ClassWork[] = currentClass?.data?.works ?? [];

  return (
    <div className="p-8 relative w-full h-full overflow-y-auto">
      <Breadcrumb>
        <BreadcrumbList className="flex items-center gap-2 whitespace-nowrap">
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/class/${role}`}
              className="inline-flex items-center text-sm text-slate-600 hover:underline"
            >
              Lớp học
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator className="text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </BreadcrumbSeparator>

          <BreadcrumbItem>
            <BreadcrumbPage
              className="inline-block text-sm font-medium text-slate-900 truncate max-w-[48ch]"
              aria-current="page"
            >
              {classInfo?.name ?? "Chi tiết lớp học"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6 mb-6 flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">
            {classInfo?.name ?? "Chi tiết lớp học"}
          </h1>
          <div className="text-base text-slate-500 mt-1">
            {classInfo?.description ?? ""}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(String(v))}
            className="w-full mt-4"
          >
            <div className="mb-4">
              <TabsList>
                <TabsTrigger
                  value="notifications"
                  className="px-4 py-2 text-lg"
                >
                  Thông báo
                  {unreadNotificationsCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-white bg-red-600 rounded">
                      {unreadNotificationsCount > 99
                        ? "99+"
                        : unreadNotificationsCount}
                    </span>
                  )}
                </TabsTrigger>

                <TabsTrigger value="exercise" className="px-4 py-2 text-lg">
                  Bài tập
                  {unreadClassworkCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-white bg-red-600 rounded">
                      {unreadClassworkCount > 99 ? "99+" : unreadClassworkCount}
                    </span>
                  )}
                </TabsTrigger>

                <TabsTrigger value="everyone" className="px-4 py-2 text-lg">
                  Mọi người
                </TabsTrigger>
                <TabsTrigger value="exam" className="px-4 py-2 text-lg">
                  Bài kiểm tra
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="notifications">
              <NotificationsTab
                classId={id}
                notifications={notifications}
                onPost={handlePost}
                isTeacher={role === "teacher"}
              />
            </TabsContent>

            <TabsContent value="exercise">
              <ExerciseTab
                works={worksFromStore}
                role={role as "teacher" | "student"}
                onOpenWork={(workId) => {
                  if (role === "student")
                    navigate(`/class/${role}/${id}/classwork/${workId}/detail`);
                  else
                    navigate(`/class/${role}/${id}/classwork/${workId}/submissions`);
                }}
                onAddWork={() => navigate(`/class/${role}/${id}/classwork/add`)}
                fetchCountsForWork={async (wid) => {
                  try {
                    // example: refresh submission/member counts for a work
                    if (typeof getSubmissionCount === "function") {
                      const sc = await getSubmissionCount(wid);
                      setSubmissionCounts((prev) => ({ ...prev, [wid]: sc }));
                    } else {
                      const subs = await getClassworkSubmissions(wid);
                      const unique = new Set<string>();
                      subs?.forEach((s) =>
                        unique.add(
                          String(
                            (s as any).appUserId ?? (s as any).userId ?? ""
                          )
                        )
                      );
                      setSubmissionCounts((prev) => ({
                        ...prev,
                        [wid]: unique.size,
                      }));
                    }
                    // memberCounts fallback: try memberCounts from currentClass students length
                    setMemberCounts((prev) => ({
                      ...prev,
                      [wid]:
                        currentClass?.data?.students?.length ??
                        prev[wid] ??
                        null,
                    }));
                  } catch (e) {
                    console.error("fetchCountsForWork failed", e);
                  }
                }}
                submissionCounts={submissionCounts}
                memberCounts={memberCounts}
                navigateToEdit={(wid) =>
                  navigate(`/class/${role}/${id}/classwork/${wid}/edit`)
                }
              />
            </TabsContent>

            <TabsContent value="everyone">
              <EveryoneTab
                teacher={teacher}
                students={students}
                parents={parents}
                onMail={handleMail}
                onSelect={handleSelect}
                onAddMember={handleOpenAdd}
                classId={currentClass.data.classInfo.id}
              />
            </TabsContent>

            <TabsContent value="exam">
              <ClassExams classId={id} isTeacher={role === "teacher"} />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="col-span-12 lg:col-span-4">
          <div className="sticky top-6 space-y-4">
            <Card className="mb-4">
              <div className="p-6 flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-3">
                    THÔNG TIN LỚP HỌC
                  </div>
                  <div className="text-slate-800">
                    <div className="font-extrabold text-2xl mb-1">
                      {classInfo?.name ?? "Tên lớp"}
                    </div>
                    <div className="text-md text-slate-500 mb-4">
                      {classInfo?.description ?? ""}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 flex items-center justify-between">
                <div className="text-xs text-slate-400">Số thành viên</div>
                <Badge className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold text-lg">
                  {classMemberCount}
                </Badge>
              </div>
            </Card>

            <Card className="mt-4">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-lg">Tài liệu lớp</div>
                  <div className="text-sm text-slate-500">
                    {docsLoading
                      ? "Đang tải..."
                      : `${documents.length} tài liệu`}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {documents && documents.length > 0 ? (
                    documents.map((d) => (
                      <DocumentPreviewCard key={d.id} doc={d} role={role} />
                    ))
                  ) : (
                    <div className="col-span-2 text-sm text-slate-500">
                      Chưa có tài liệu.
                    </div>
                  )}
                </div>

                <div className="mt-3 flex justify-end">
                  <Button asChild variant="link" size="sm">
                    <a href={`/class/${id}/documents`}>Xem toàn bộ</a>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DetailedClassTeacher;