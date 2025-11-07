import React, { useEffect, useState } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import type { ClassWork } from "@/classManagement/interfaces/class";
import PostComposer from "@/classManagement/components/ui/postcomposer";
import PostCard from "@/classManagement/components/ui/postcard";
import MemberDetailModal from "@/classManagement/components/ui/memberdetailmodal";
import AddMemberModal from "@/classManagement/components/ui/addmembermodal";
import type { UserRole } from "@/classManagement/components/ui/classcard";

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
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
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

/* local type for links coming from PostComposer */
type LinkPayload = { url: string; title?: string; thumbnail?: string };

const ClassInfoCard: React.FC<{
  info: ClassInfo | null;
  memberCount?: number;
}> = ({ info, memberCount = 0 }) => {
  if (!info) return null;
  return (
    <Card className="mb-4">
      <div className="p-6">
        <div className="text-sm font-semibold text-slate-600 mb-3">
          THÔNG TIN LỚP HỌC
        </div>
        <div className="text-slate-800">
          <div className="font-extrabold text-2xl mb-1">
            {info.name ?? "Tên lớp"}
          </div>
          <div className="text-md text-slate-500 mb-4">
            {info.description ?? ""}
          </div>
          <div className="mt-3 text-sm text-slate-700 flex items-center justify-between">
            <div className="text-xs text-slate-400">Số thành viên</div>
            <Badge className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold text-lg">
              {memberCount}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

const DocumentPreviewCard: React.FC<{ doc: DocumentDto }> = ({ doc }) => {
  const isImage = !!(
    doc.fileType && /jpg|jpeg|png|gif|bmp|webp/i.test(String(doc.fileType))
  );
  const isPdf = !!(doc.fileType && /pdf/i.test(String(doc.fileType)));

  return (
    <a
      href={doc.documentUrl}
      target="_blank"
      rel="noopener noreferrer"
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

const DocumentsBox: React.FC<{
  documents: DocumentDto[];
  loading: boolean;
  classId: string;
}> = ({ documents, loading, classId }) => {
  return (
    <Card className="mt-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-lg">Tài liệu lớp</div>
          <div className="text-sm text-slate-500">
            {loading ? "Đang tải..." : `${documents.length} tài liệu`}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {documents && documents.length > 0 ? (
            documents.map((d) => <DocumentPreviewCard key={d.id} doc={d} />)
          ) : (
            <div className="col-span-2 text-sm text-slate-500">
              Chưa có tài liệu.
            </div>
          )}
        </div>
        <div className="mt-3 flex justify-end">
          <Button asChild variant="link" size="sm">
            <a href={`/documents?classId=${classId}`}>Xem toàn bộ</a>
          </Button>
        </div>
      </div>
    </Card>
  );
};

const MemberRowSimple: React.FC<{
  m: ClassMemberDto;
  onMail?: (p: ClassMemberDto) => void;
  onSelect?: (p: ClassMemberDto) => void;
  roleLabel?: string;
}> = ({ m, onMail, onSelect, roleLabel }) => {
  const initials = m.fullname
    ? m.fullname.charAt(0).toUpperCase()
    : String(m.userId).charAt(0).toUpperCase();
  return (
    <div
      className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer"
      onClick={() => onSelect && onSelect(m)}
    >
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-slate-800">{m.fullname}</div>
          {m.email && <div className="text-sm text-slate-500">{m.email}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {roleLabel && (
          <div className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-600">
            {roleLabel}
          </div>
        )}
        <Button
          variant="link"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            onMail && onMail(m);
          }}
        >
          Mail
        </Button>
      </div>
    </div>
  );
};

const DetailedClassTeacher: React.FC = () => {
  const params = useParams<{ id?: string; role?: string }>();
  const id = params.id ?? "";

  const { user } = useAuthStore();
  const coarseRole = mapToCoarseRole(user?.roles);

  let role: UserRole;
  if (coarseRole === "student") role = "student";
  else if (coarseRole === "teacher") role = "teacher";
  else {
    const stored = localStorage.getItem("currentUserRole");
    role = stored === "teacher" ? "teacher" : "student";
  }

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
    getSubmissionCount, // <--- use the new store method
  } = useClassStore();

  const [selectedMember, setSelectedMember] = useState<ClassMemberDto | null>(
    null
  );
  const [openAddMember, setOpenAddMember] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const [submissionCounts, setSubmissionCounts] = useState<
    Record<number, number | null>
  >({});
  const [memberCounts, setMemberCounts] = useState<
    Record<number, number | null>
  >({});

  const [classMemberCount, setClassMemberCount] = useState<number | null>(null);

  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      getClassInfo(Number(id));
    }
  }, [id, getClassInfo]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const fetchMemberCount = async () => {
      try {
        if (!getMemberCount) return;
        const count = await getMemberCount(Number(id));
        if (mounted) setClassMemberCount(count);
      } catch (err) {
        if (mounted) setClassMemberCount(null);
      }
    };
    fetchMemberCount();
    return () => {
      mounted = false;
    };
  }, [id, getMemberCount]);

  useEffect(() => {
    if (!id) return;
    if (!getDocumentsByClassId) return;
    let mounted = true;
    const fetchDocs = async () => {
      setDocsLoading(true);
      try {
        const docs = await getDocumentsByClassId(Number(id));
        if (mounted) setDocuments(docs ?? []);
      } catch (err) {
        if (mounted) setDocuments([]);
      } finally {
        if (mounted) setDocsLoading(false);
      }
    };
    fetchDocs();
    return () => {
      mounted = false;
    };
  }, [id, getDocumentsByClassId]);

  const worksFromStore: ClassWork[] = currentClass?.data?.works ?? [];

  useEffect(() => {
    const students = currentClass?.data?.students ?? [];
    if (students && students.length > 0 && worksFromStore.length > 0) {
      const count = students.length;
      setMemberCounts((prev) => {
        const next = { ...prev };
        worksFromStore.forEach((w) => {
          if (next[w.id] === undefined || next[w.id] === null) {
            next[w.id] = count;
          }
        });
        return next;
      });
    }
  }, [currentClass?.data?.students, worksFromStore]);

  const fetchCountsForWork = async (workId: number) => {
    // member count
    try {
      const students = currentClass?.data?.students ?? [];
      if (students && students.length > 0) {
        setMemberCounts((prev) => ({ ...prev, [workId]: students.length }));
      } else if (memberCounts[workId] === undefined) {
        try {
          if (getMemberCount) {
            const count = await getMemberCount(workId);
            setMemberCounts((prev) => ({ ...prev, [workId]: count }));
          } else {
            const res = await axiosInstance.get(
              `/Class/classworks/membercount/${workId}`
            );
            const raw = res?.data ?? null;
            let memCount: number | null = null;
            if (raw !== null) {
              if (typeof raw === "number") memCount = raw;
              else if (typeof raw?.data === "number") memCount = raw.data;
              else if (typeof raw?.count === "number") memCount = raw.count;
            }
            setMemberCounts((prev) => ({ ...prev, [workId]: memCount }));
          }
        } catch (err) {
          setMemberCounts((prev) => ({ ...prev, [workId]: null }));
        }
      }
    } catch (err) {
      console.error("Unexpected member count error:", err);
    }

    // submission count: prefer store.getSubmissionCount if available; otherwise fallback to getClassworkSubmissions
    try {
      // only fetch if not cached
      if (submissionCounts[workId] === undefined || submissionCounts[workId] === null) {
        if (typeof getSubmissionCount === "function") {
          const count = await getSubmissionCount(workId);
          setSubmissionCounts((prev) => ({ ...prev, [workId]: count }));
        } else {
          const subs = await getClassworkSubmissions(workId);
          if (!subs) {
            setSubmissionCounts((prev) => ({ ...prev, [workId]: 0 }));
          } else {
            const unique = new Set<string>();
            subs.forEach((s) => {
              const uid = String(s.appUserId ?? (s as any).userId ?? "");
              if (uid) unique.add(uid);
            });
            setSubmissionCounts((prev) => ({ ...prev, [workId]: unique.size }));
          }
        }
      }
    } catch (err) {
      setSubmissionCounts((prev) => ({ ...prev, [workId]: null }));
    }
  };

  const [activeTab, setActiveTab] = useState("notifications");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!id) return;
    if (activeTab === "everyone") {
      const hasTeacher = !!currentClass?.data?.teacher;
      const hasStudents = (currentClass?.data?.students ?? []).length > 0;
      const hasParents = (currentClass?.data?.parents ?? []).length > 0;

      if (!hasTeacher && !hasStudents && !hasParents) {
        getClassMembers(Number(id));
      }
    }
  }, [
    activeTab,
    id,
    getClassMembers,
    currentClass?.data?.teacher,
    currentClass?.data?.students,
    currentClass?.data?.parents,
  ]);

  const teacher: ClassMemberDto | null = currentClass?.data?.teacher ?? null;
  const students: ClassMemberDto[] = currentClass?.data?.students ?? [];
  const parents: ClassMemberDto[] = currentClass?.data?.parents ?? [];
  const [notifications, setNotifications] = useState<ClassNotification[]>([]);

  useEffect(() => {
    if (activeTab === "exercise" && id) {
      const hasWorks = (currentClass?.data?.works ?? []).length > 0;
      if (!hasWorks) {
        getClassWorks(Number(id));
      }
    }
  }, [activeTab, id, getClassWorks, currentClass?.data?.works]);

  useEffect(() => {
    if (currentClass?.data?.notifications) {
      setNotifications(currentClass.data.notifications);
    }
  }, [currentClass?.data?.notifications]);

  const classInfo: ClassInfo | null = currentClass?.data?.classInfo ?? null;

  const totalMembers =
    (teacher ? 1 : 0) + (students?.length ?? 0) + (parents?.length ?? 0);

  const displayMemberCount = classMemberCount ?? totalMembers;

  const handlePost = async (
    content: string,
    files?: File[],
    links?: LinkPayload[],
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
        setNotifications((prev) => [created, ...prev]);
        await getClassInfo(Number(id));
      } else {
        console.error("Tạo thông báo thất bại: createNotification trả về null");
      }
    } catch (err: any) {
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
            onValueChange={setActiveTab}
            className="w-full mt-4"
          >
            <div className="mb-4">
              <TabsList>
                <TabsTrigger value="notifications" className="px-4 py-2 text-lg">
                  Thông báo
                </TabsTrigger>
                <TabsTrigger value="exercise" className="px-4 py-2 text-lg">
                  Bài tập
                </TabsTrigger>
                <TabsTrigger value="everyone" className="px-4 py-2 text-lg">
                  Mọi người
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="notifications">
              <div className="mb-4">
                <PostComposer onPost={handlePost} avatarUrl={"/vite.svg"} />
              </div>
              <div className="mt-4 space-y-5">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <PostCard
                      key={n.id}
                      post={{
                        id: n.id,
                        title: n.title,
                        description: n.description,
                        createdAt: n.createdAt,
                        files: n.files ?? [],
                        comments: n.comments ?? [],
                      }}
                    />
                  ))
                ) : (
                  <div className="text-slate-500 text-base">
                    Chưa có thông báo nào.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="exercise">
              <div className="flex justify-end mb-4">
                {role === "teacher" && (
                  <Button
                    onClick={() =>
                      navigate(`/class/${role}/${id}/classwork/add`)
                    }
                    className="text-base"
                  >
                    + Thêm bài tập
                  </Button>
                )}
              </div>

              <div className="mt-2">
                {worksFromStore.length === 0 ? (
                  <div className="text-slate-500 text-base">
                    Chưa có bài tập nào.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {worksFromStore.map((w) => (
                      <div key={w.id}>
                        <div
                          className={`bg-white border rounded-xl p-5 cursor-pointer hover:bg-blue-50 flex justify-between items-start`}
                          onClick={() => {
                            if (role === "student") {
                              navigate(
                                `/class/${role}/${id}/classwork/${w.id}/detail`
                              );
                            } else {
                              const next = openDropdownId === w.id ? null : w.id;
                              setOpenDropdownId(next);
                              if (next === w.id) {
                                void fetchCountsForWork(w.id);
                              }
                            }
                          }}
                        >
                          <div className="max-w-[70%]">
                            <div className="text-lg font-semibold text-slate-900">
                              {w.title}
                            </div>
                            <div className="text-base text-slate-600 mt-2">
                              {w.description}
                            </div>
                          </div>
                          <div className="text-right min-w-[140px]">
                            <div className="text-xs text-slate-400">Hạn nộp</div>
                            <div className="font-medium text-slate-800 mt-1">
                              {w.deadline
                                ? new Date(w.deadline).toLocaleString()
                                : "Không xác định"}
                            </div>
                            {role === "teacher" && (
                              <div className="mt-3">
                                <Button
                                  aria-label={`Sửa bài tập ${w.title}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/class/${role}/${id}/classwork/${w.id}/edit`
                                    );
                                  }}
                                  variant="secondary"
                                  size="sm"
                                >
                                  ✏️ Sửa
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        {openDropdownId === w.id && (
                          <Card className="mt-2">
                            <div className="p-5">
                              <div>
                                <span className="font-semibold">Tiêu đề:</span>{" "}
                                <span className="ml-2">{w.title}</span>
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <div>
                                  <div className="text-xs text-slate-400">Hạn nộp</div>
                                  <div className="font-medium">
                                    {w.deadline ? new Date(w.deadline).toLocaleString() : "Không xác định"}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-slate-400">Đã nộp / Tổng</div>
                                  <div className="font-semibold text-slate-700">
                                    {submissionCounts[w.id] ?? "—"} / {memberCounts[w.id] ?? "—"}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 text-right">
                                <Button onClick={() => navigate(`/class/${role}/${id}/classwork/${w.id}/submissions`)} size="sm">
                                  Xem chi tiết
                                </Button>
                              </div>
                            </div>
                          </Card>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="everyone">
              <div className="mb-3">
                {role === "teacher" && (
                  <Button onClick={handleOpenAdd} className="text-base">
                    Thêm thành viên
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <Card>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-lg">Giáo viên</div>
                      <div className="text-sm text-slate-500">
                        {teacher ? 1 : 0}
                      </div>
                    </div>
                    {teacher ? (
                      <MemberRowSimple
                        m={teacher}
                        onMail={handleMail}
                        onSelect={handleSelect}
                        roleLabel="Giáo viên"
                      />
                    ) : (
                      <div className="text-sm text-slate-500">
                        Chưa có giáo viên được gán cho lớp này.
                      </div>
                    )}
                  </div>
                </Card>

                <Card>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-lg">Học sinh</div>
                      <div className="text-sm text-slate-500">
                        {students.length}
                      </div>
                    </div>
                    {students.length === 0 ? (
                      <div className="text-sm text-slate-500">
                        Chưa có học sinh.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {students.map((s) => (
                          <MemberRowSimple
                            key={s.userId}
                            m={s}
                            onMail={handleMail}
                            onSelect={handleSelect}
                            roleLabel="Học sinh"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

                <Card>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-lg">Phụ huynh</div>
                      <div className="text-sm text-slate-500">
                        {parents.length}
                      </div>
                    </div>
                    {parents.length === 0 ? (
                      <div className="text-sm text-slate-500">
                        Chưa có phụ huynh.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {parents.map((p) => (
                          <MemberRowSimple
                            key={p.userId}
                            m={p}
                            onMail={handleMail}
                            onSelect={handleSelect}
                            roleLabel="Phụ huynh"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="col-span-12 lg:col-span-4">
          <div className="sticky top-6 space-y-4">
            <ClassInfoCard info={classInfo} memberCount={displayMemberCount} />
            <DocumentsBox
              documents={documents}
              loading={docsLoading}
              classId={id}
            />
          </div>
        </aside>
      </div>

      <MemberDetailModal
        open={!!selectedMember}
        member={selectedMember}
        onClose={handleCloseModal}
      />
      <AddMemberModal
        open={openAddMember}
        classId={id ? Number(id) : 0}
        onClose={handleCloseAdd}
        onInvited={handleInvited}
      />
    </div>
  );
};

export default DetailedClassTeacher;