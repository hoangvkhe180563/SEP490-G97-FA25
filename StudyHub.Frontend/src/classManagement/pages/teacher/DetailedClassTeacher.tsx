/* eslint-disable @typescript-eslint/no-unused-expressions */
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import type { ClassWork } from "@/classManagement/interfaces/class";
import PostComposer from "@/classManagement/components/ui/postcomposer";
import PostCard from "@/classManagement/components/ui/postcard";
import MemberDetailModal from "@/classManagement/components/ui/memberdetailmodal";
import AddMemberModal from "@/classManagement/components/ui/addmembermodal";
import type { UserRole } from "@/classManagement/components/ui/classcard";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/common/components/ui/breadcrumb";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/common/components/ui/tabs";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { mapToCoarseRole } from "@/classManagement/utils/roleutil";
import type {
  ClassInfo,
  ClassMemberDto,
  ClassNotification,
  DocumentDto,
} from "@/classManagement/interfaces/class";

import { axiosInstance } from "@/lib/axios"; // <-- dùng để gọi API đếm

// local type for links coming from PostComposer
type LinkPayload = { url: string; title?: string; thumbnail?: string };

// ===== Thẻ thông tin lớp học =====
const ClassInfoCard: React.FC<{ info: ClassInfo | null; memberCount?: number }> = ({ info, memberCount = 0 }) => {
  if (!info) return null;
  return (
    <div className="bg-white/90 border border-slate-200 rounded-xl p-6 mb-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-600 mb-3">THÔNG TIN LỚP HỌC</div>
      <div className="text-slate-800">
        <div className="font-extrabold text-2xl mb-1">{info.name ?? "Tên lớp"}</div>
        <div className="text-md text-slate-500 mb-4">{info.description ?? ""}</div>
        <div className="mt-3 text-sm text-slate-700 flex items-center justify-between">
          <div className="text-xs text-slate-400">Số thành viên</div>
          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold text-lg">{memberCount}</div>
        </div>
      </div>
    </div>
  );
};

// ===== Thành phần hiển thị chi tiết bài tập dưới dạng dropdown =====
const ClassWorkDropdown: React.FC<{
  work: ClassWork;
  submitted?: number | null;
  total?: number | null;
  onViewDetails?: () => void;
}> = ({ work, submitted, total, onViewDetails }) => {
  return (
    <div className="bg-slate-50 border-t px-5 py-4 text-base rounded-b-lg">
      <div>
        <span className="font-semibold">Tiêu đề:</span> <span className="ml-2">{work.title}</span>
      </div>
      <div className="mt-3">
        <span className="font-semibold">Mô tả:</span>{" "}
        <span className="ml-2 text-slate-600">{work.description || "Không có mô tả"}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Hạn nộp</div>
          <div className="font-medium">{work.deadline ? new Date(work.deadline).toLocaleString() : "Không xác định"}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Đã nộp / Tổng</div>
          <div className="font-semibold text-slate-700">{submitted ?? "—"} / {total ?? "—"}</div>
        </div>
      </div>
      {onViewDetails && (
        <div className="mt-4 text-right">
          <button
            onClick={onViewDetails}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
          >
            Xem chi tiết
          </button>
        </div>
      )}
    </div>
  );
};

// Small document preview card (image/pdf/other)
const DocumentPreviewCard: React.FC<{ doc: DocumentDto }> = ({ doc }) => {
  const isImage = !!(doc.fileType && /jpg|jpeg|png|gif|bmp|webp/i.test(String(doc.fileType)));
  const isPdf = !!(doc.fileType && /pdf/i.test(String(doc.fileType)));

  return (
    <a
      href={doc.documentUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border rounded-md p-3 shadow-sm hover:shadow-md transition"
      title={doc.name}
    >
      <div className="w-full h-36 flex flex-col items-center justify-start gap-3">
        <div className="w-full h-24 bg-gray-100 flex items-center justify-center overflow-hidden rounded-lg">
          {isImage ? (
            <img src={doc.documentUrl} alt={doc.name} className="w-full h-full object-cover rounded" />
          ) : isPdf ? (
            <div className="text-sm text-slate-600 text-center px-2">
              <svg className="mx-auto mb-1" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 2v6h6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
        <div className="text-sm text-slate-700 text-center line-clamp-2 px-1 font-medium">{doc.name}</div>
        <div className="text-xs text-slate-400">{doc.uploaderName ?? ""}</div>
      </div>
    </a>
  );
};

// Documents box to be rendered under the ClassInfoCard
const DocumentsBox: React.FC<{ documents: DocumentDto[]; loading: boolean; classId: string }> = ({ documents, loading, classId }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-lg">Tài liệu lớp</div>
        <div className="text-sm text-slate-500">{loading ? "Đang tải..." : `${documents.length} tài liệu`}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {documents && documents.length > 0 ? (
          documents.map((d) => <DocumentPreviewCard key={d.id} doc={d} />)
        ) : (
          <div className="col-span-2 text-sm text-slate-500">Chưa có tài liệu.</div>
        )}
      </div>
      <div className="mt-3 flex justify-end">
        <a
          className="text-sm text-blue-600 underline font-medium"
          href={`/documents?classId=${classId}`}
        >
          Xem toàn bộ
        </a>
      </div>
    </div>
  );
};

// Small component for displaying one member row (teacher/student)
const MemberRowSimple: React.FC<{ m: ClassMemberDto; onMail?: (p: ClassMemberDto) => void; onSelect?: (p: ClassMemberDto) => void; roleLabel?: string }> = ({ m, onMail, onSelect, roleLabel }) => {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => onSelect && onSelect(m)}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-semibold text-slate-700">
          {m.fullname ? m.fullname.charAt(0).toUpperCase() : String(m.userId).charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-slate-800">{m.fullname}</div>
          {m.email && <div className="text-sm text-slate-500">{m.email}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {roleLabel && <div className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-600">{roleLabel}</div>}
        <button onClick={(e) => { e.stopPropagation(); onMail && onMail(m); }} className="text-sm text-blue-600 underline">Mail</button>
      </div>
    </div>
  );
};

// ===== Trang chi tiết lớp học =====
const DetailedClassTeacher: React.FC = () => {
  // read id from URL only (we no longer read role from URL/path)
  const params = useParams<{ id?: string; role?: string }>();
  const id = params.id ?? "";

  // Get role only from auth store (do NOT read from URL/path)
  const { user } = useAuthStore();
  const coarseRole = mapToCoarseRole(user?.roles);

  // Determine role strictly from auth info (with a safe fallback)
  let role: UserRole;
  if (coarseRole === "student") role = "student";
  else if (coarseRole === "teacher") role = "teacher";
  else {
    const stored = localStorage.getItem("currentUserRole");
    role = stored === "teacher" ? "teacher" : "student";
    console.warn(
      `DetailedClassTeacher: role not found in auth store; falling back to stored/current default role='${role}'`
    );
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
  } = useClassStore();
  const [selectedMember, setSelectedMember] = useState<ClassMemberDto | null>(null);
  const [openAddMember, setOpenAddMember] = useState(false);

  // State cho dropdown bài tập: lưu id bài tập đang mở dropdown (teacher)
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // NEW: lưu số đã nộp và tổng theo workId
  const [submissionCounts, setSubmissionCounts] = useState<Record<number, number | null>>({});
  const [memberCounts, setMemberCounts] = useState<Record<number, number | null>>({});

  // NEW: số thành viên lớp lấy trực tiếp từ API /Class/membercount/{classId}
  const [classMemberCount, setClassMemberCount] = useState<number | null>(null);

  // NEW: documents state
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const navigate = useNavigate();

  // ✅ Gọi API lấy thông tin lớp + notifications khi mount
  useEffect(() => {
    if (id) {
      getClassInfo(Number(id));
    }
  }, [id, getClassInfo]);

  // MỚI: fetch số thành viên ngay khi vào trang (dùng store)
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const fetchMemberCount = async () => {
      try {
        if (!getMemberCount) return;
        const count = await getMemberCount(Number(id));
        if (mounted) setClassMemberCount(count);
      } catch (err) {
        console.error("Error fetching class member count via store:", err);
        if (mounted) setClassMemberCount(null);
      }
    };
    fetchMemberCount();
    return () => {
      mounted = false;
    };
  }, [id, getMemberCount]);

  // NEW: fetch documents for this class when mount
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
        console.error("Error fetching documents for class:", err);
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

  // Nếu members đã load trên currentClass, cập nhật memberCounts cho tất cả work có sẵn
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

  // Khi teacher mở dropdown cho 1 work: gọi API lấy counts (nếu chưa có)
  const fetchCountsForWork = async (workId: number) => {
    const students = currentClass?.data?.students ?? [];
    if (students && Array.isArray(students) && students.length > 0) {
      setMemberCounts((prev) => ({ ...prev, [workId]: students.length }));
    } else if (memberCounts[workId] === undefined) {
      try {
        const memRes = await axiosInstance.get(`/Class/classworks/membercount/${workId}`);
        const memRaw = memRes?.data ?? null;
        let memCount: number | null = null;
        if (memRaw !== null) {
          if (typeof memRaw === "number") memCount = memRaw;
          else if (typeof memRaw?.data === "number") memCount = memRaw.data;
          else if (typeof memRaw?.count === "number") memCount = memRaw.count;
        }
        setMemberCounts((prev) => ({ ...prev, [workId]: memCount }));
      } catch (err) {
        console.error("fetch membercount error:", err);
        setMemberCounts((prev) => ({ ...prev, [workId]: null }));
      }
    }

    if (submissionCounts[workId] === undefined) {
      try {
        const subRes = await axiosInstance.get(`/Class/classworks/submissioncount/${workId}`);
        const subRaw = subRes?.data ?? null;
        let subCount: number | null = null;
        if (subRaw !== null) {
          if (typeof subRaw === "number") subCount = subRaw;
          else if (typeof subRaw?.data === "number") subCount = subRaw.data;
          else if (typeof subRaw?.count === "number") subCount = subRaw.count;
        }
        setSubmissionCounts((prev) => ({ ...prev, [workId]: subCount }));
      } catch (err) {
        console.error("fetch submissioncount error:", err);
        setSubmissionCounts((prev) => ({ ...prev, [workId]: null }));
      }
    }
  };

  // Tab đang hoạt động
  const [activeTab, setActiveTab] = useState("notifications");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Khi mở tab "everyone", load members (nếu cần)
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
    if (!id) return;
    if (activeTab === "exercise") {
      const hasWorks = (currentClass?.data?.works ?? []).length > 0;
      if (!hasWorks) {
        getClassWorks(Number(id));
      }
    }
  }, [activeTab, id, getClassWorks, currentClass?.data?.works]);

  // sync notifications whenever currentClass updates
  useEffect(() => {
    if (currentClass?.data?.notifications) {
      setNotifications(currentClass.data.notifications);
    }
  }, [currentClass?.data?.notifications]);

  const classInfo: ClassInfo | null = currentClass?.data?.classInfo ?? null;

  const totalMembers = (teacher ? 1 : 0) + (students?.length ?? 0) + (parents?.length ?? 0);

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

  // ... rest of function unchanged ...
  };

  const handleMail = (person: ClassMemberDto) => {
    window.location.href = `mailto:${person.fullname
      .replace(/\s+/g, ".")
      .toLowerCase()}@example.com`;
  };

  const handleSelect = (p: ClassMemberDto) => setSelectedMember(p);
  const handleCloseModal = () => setSelectedMember(null);

  // Add member modal handlers
  const handleOpenAdd = () => setOpenAddMember(true);
  const handleCloseAdd = () => setOpenAddMember(false);
  const handleInvited = (res?: any) => {
    if (id) {
      getClassMembers(Number(id));
      // re-fetch count to keep it up to date
      axiosInstance.get(`/Class/membercount/${id}`).then((res) => {
        const raw = res?.data ?? null;
        let count: number | null = null;
        if (raw !== null) {
          if (typeof raw === "number") count = raw;
          else if (typeof raw?.data === "number") count = raw.data;
          else if (typeof raw?.count === "number") count = raw.count;
        }
        setClassMemberCount(count);
      }).catch((e) => {
        console.error("failed to refresh member count:", e);
      });

      // refresh documents (in case inviter attached documents or class documents changed)
      if (getDocumentsByClassId) {
        getDocumentsByClassId(Number(id)).then((docs) => setDocuments(docs ?? [])).catch((e) => {
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
    <div className="p-8 relative">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/class/${role}`}>Lớp học</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {classInfo?.name ?? "Chi tiết lớp học"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
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

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full mt-4"
          >
            <div className="mb-4">
              <TabsList>
                <TabsTrigger value="notifications" className="px-4 py-2 text-lg">Thông báo</TabsTrigger>
                <TabsTrigger value="exercise" className="px-4 py-2 text-lg">Bài tập</TabsTrigger>
                <TabsTrigger value="everyone" className="px-4 py-2 text-lg">Mọi người</TabsTrigger>
              </TabsList>
            </div>

            {/* Notifications */}
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

            {/* Exercise */}
            <TabsContent value="exercise">
              <div className="flex justify-end mb-4">
                {/* only show Add classwork when teacher */}
                {role === "teacher" && (
                  <button
                    className="bg-blue-600 text-white px-5 py-3 rounded-lg text-base shadow"
                    onClick={() =>
                      navigate(`/class/${role}/${id}/classwork/add`)
                    }
                  >
                    + Thêm bài tập
                  </button>
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
                            // New logic:
                            // - If student: navigate to detail page
                            // - If teacher: toggle dropdown for this work (show more info)
                            if (role === "student") {
                              navigate(
                                `/class/${role}/${id}/classwork/${w.id}/detail`
                              );
                            } else {
                              const next = openDropdownId === w.id ? null : w.id;
                              setOpenDropdownId(next);
                              // when opening dropdown, fetch counts if not present
                              if (next === w.id) {
                                fetchCountsForWork(w.id);
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
                            {/* show Edit link only for teacher */}
                            {role === "teacher" && (
                              <div className="mt-3">
                                <button
                                  aria-label={`Sửa bài tập ${w.title}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/class/${role}/${id}/classwork/${w.id}/edit`
                                    );
                                  }}
                                  className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md"
                                >
                                  <span className="text-lg">✏️</span>
                                  <span>Sửa</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* dropdown only rendered when openDropdownId matches */}
                        {openDropdownId === w.id && (
                          <ClassWorkDropdown
                            work={w}
                            submitted={submissionCounts[w.id]}
                            total={memberCounts[w.id]}
                            onViewDetails={() => navigate(`/class/${role}/${id}/classwork/${w.id}/submissions`)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Everyone */}
            <TabsContent value="everyone">
              <div className="mb-3">
                {/* show Add member only for teachers */}
                {role === "teacher" && (
                  <button
                    onClick={handleOpenAdd}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-base"
                  >
                    Thêm thành viên
                  </button>
                )}
              </div>

              {/* ---- NEW: Explicitly separate Teacher / Students / Parents for clarity ---- */}
              <div className="space-y-4">
                {/* Teacher section */}
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-lg">Giáo viên</div>
                    <div className="text-sm text-slate-500">{teacher ? 1 : 0}</div>
                  </div>
                  {teacher ? (
                    <MemberRowSimple m={teacher} onMail={handleMail} onSelect={handleSelect} roleLabel="Giáo viên" />
                  ) : (
                    <div className="text-sm text-slate-500">Chưa có giáo viên được gán cho lớp này.</div>
                  )}
                </div>

                {/* Students section */}
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-lg">Học sinh</div>
                    <div className="text-sm text-slate-500">{students.length}</div>
                  </div>
                  {students.length === 0 ? (
                    <div className="text-sm text-slate-500">Chưa có học sinh.</div>
                  ) : (
                    <div className="space-y-2">
                      {students.map((s) => (
                        <MemberRowSimple key={s.userId} m={s} onMail={handleMail} onSelect={handleSelect} roleLabel="Học sinh" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Parents section (if needed) */}
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-lg">Phụ huynh</div>
                    <div className="text-sm text-slate-500">{parents.length}</div>
                  </div>
                  {parents.length === 0 ? (
                    <div className="text-sm text-slate-500">Chưa có phụ huynh.</div>
                  ) : (
                    <div className="space-y-2">
                      {parents.map((p) => (
                        <MemberRowSimple key={p.userId} m={p} onMail={handleMail} onSelect={handleSelect} roleLabel="Phụ huynh" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column: show class info and documents (no role distinction) */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="sticky top-6">
            <ClassInfoCard info={classInfo} memberCount={displayMemberCount} />
            <DocumentsBox documents={documents} loading={docsLoading} classId={id} />
          </div>
        </aside>
      </div>

      {/* Modals */}
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