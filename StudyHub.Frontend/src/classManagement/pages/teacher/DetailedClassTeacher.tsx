import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import type { ClassWork } from "@/classManagement/interfaces/class";
import PostComposer from "@/classManagement/components/ui/postcomposer";
import PostCard from "@/classManagement/components/ui/postcard";
import EveryoneListTC from "@/classManagement/components/ui/listeveryoneteacher";
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
} from "@/classManagement/interfaces/class";

import { axiosInstance } from "@/lib/axios"; // <-- dùng để gọi API đếm

// local type for links coming from PostComposer
type LinkPayload = { url: string; title?: string; thumbnail?: string };

// ===== Thẻ thông tin lớp học =====
const ClassInfoCard: React.FC<{ info: ClassInfo | null }> = ({ info }) => {
  if (!info) return null;
  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="text-sm font-medium mb-3">Thông tin lớp học</div>
      <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
        <div className="text-xs text-gray-400">Mã lớp:</div>
        <div className="font-medium text-right">{info.id}</div>
        <div className="text-xs text-gray-400">Mã môn học:</div>
        <div className="font-medium text-right">{info.subjectId}</div>
        <div className="text-xs text-gray-400">Ngày tạo:</div>
        <div className="font-medium text-right">
          {new Date(info.createdAt).toLocaleDateString()}
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
    <div className="bg-gray-50 border-t px-4 py-3 text-sm">
      <div>
        <span className="font-medium">Tiêu đề:</span> {work.title}
      </div>
      <div className="mt-2">
        <span className="font-medium">Mô tả:</span>{" "}
        {work.description || "Không có mô tả"}
      </div>
      <div className="mt-2">
        <span className="font-medium">Hạn nộp:</span>{" "}
        {work.deadline ? new Date(work.deadline).toLocaleString() : "Không xác định"}
      </div>
      {work.classId && (
        <div className="mt-2 text-xs text-gray-400">Mã lớp: {work.classId}</div>
      )}
      <div className="mt-3 text-sm text-gray-700 flex items-center justify-between">
        <div>
          <span className="font-medium">Đã nộp:</span>{" "}
          <span className="font-medium text-gray-800">{submitted ?? "—"}</span>{" "}
          /{" "}
          <span className="font-medium text-gray-800">{total ?? "—"}</span>{" "}
          học sinh
        </div>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="ml-4 text-xs bg-blue-600 text-white px-3 py-1 rounded"
          >
            Xem chi tiết
          </button>
        )}
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

  console.log("Role (from auth store only):", role, "Class ID:", id);

  const {
    getClassInfo,
    getClassMembers,
    getClassWorks,
    currentClass,
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

  const navigate = useNavigate();

  // ✅ Gọi API lấy thông tin lớp + notifications khi mount
  useEffect(() => {
    if (id) {
      getClassInfo(Number(id));
    }
  }, [id, getClassInfo]);

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

  // handlePost accepts title and links from PostComposer and forwards them to the store
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

    const createdByGuid =
      localStorage.getItem("currentUserId") ??
      "d4e5f6a7-b8c9-0123-4567-890abcdef014";

    const created = await createNotification({
      classId: Number(id),
      title: titleToSend,
      description: content,
      createdBy: createdByGuid,
      files: files && files.length > 0 ? files : undefined,
      links: links && links.length > 0 ? links : undefined,
    });

    if (created) {
      const refreshed = await getClassInfo(Number(id));
      if (refreshed && refreshed.data?.notifications) {
        setNotifications(refreshed.data.notifications);
      } else {
        setNotifications((prev) => [created, ...prev]);
      }
    } else {
      const fallbackFiles =
        files?.map((f) => ({ id: 0, fileName: f.name, fileUrl: "" })) ??
        links?.map((l, idx) => ({
          id: `link-${Date.now()}-${idx}`,
          fileName: l.title ?? l.url,
          fileUrl: l.url,
          thumbnail: l.thumbnail,
          isExternal: true,
        })) ??
        [];

      const fallback: ClassNotification = {
        id: Date.now(),
        classId: Number(id),
        title: titleToSend,
        description: content,
        createdAt: new Date().toISOString(),
        createdBy: createdByGuid,
        files: fallbackFiles as any,
        comments: [],
      };
      setNotifications((prev) => [fallback, ...prev]);
    }
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
    }
    handleCloseAdd();
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Đang tải thông tin lớp học...
      </div>
    );
  }

  if (!currentClass?.success) {
    return (
      <div className="p-6 text-center text-red-500">
        Không thể tải thông tin lớp học.
      </div>
    );
  }

  return (
    <div className="p-6">
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
      <div className="mt-4 mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {classInfo?.name ?? "Chi tiết lớp học"}
          </h1>
          <div className="text-sm text-gray-500">
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
                <TabsTrigger value="notifications">Thông báo</TabsTrigger>
                <TabsTrigger value="exercise">Bài tập</TabsTrigger>
                <TabsTrigger value="everyone">Mọi người</TabsTrigger>
              </TabsList>
            </div>

            {/* Notifications */}
            <TabsContent value="notifications">
              <PostComposer onPost={handlePost} avatarUrl={"/vite.svg"} />
              <div className="mt-4 space-y-4">
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
                  <div className="text-gray-500 text-sm">
                    Chưa có thông báo nào.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Exercise */}
            <TabsContent value="exercise">
              <div className="flex justify-end mb-3">
                {/* only show Add classwork when teacher */}
                {role === "teacher" && (
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded"
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
                  <div className="text-gray-500 text-sm">
                    Chưa có bài tập nào.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {worksFromStore.map((w) => (
                      <div key={w.id}>
                        <div
                          className={`bg-white border rounded-lg p-4 cursor-pointer hover:bg-blue-50 flex justify-between items-start`}
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
                          <div>
                            <div className="text-sm font-semibold text-gray-800">
                              {w.title}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {w.description}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 text-right min-w-[110px]">
                            <div className="text-gray-400">Hạn nộp</div>
                            <div className="font-medium">
                              {w.deadline
                                ? new Date(w.deadline).toLocaleString()
                                : "Không xác định"}
                            </div>
                            {/* show Edit link only for teacher */}
                            {role === "teacher" && (
                              <button
                                className="ml-4 text-blue-600 underline text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/class/${role}/${id}/classwork/${w.id}/edit`
                                  );
                                }}
                              >
                                Sửa
                              </button>
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
              <div>
                {/* show Add member only for teachers */}
                {role === "teacher" && (
                  <button
                    onClick={handleOpenAdd}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded"
                  >
                    Thêm thành viên
                  </button>
                )}
              </div>
              <EveryoneListTC
                teacher={teacher ?? undefined}
                students={students}
                parents={parents}
                onMail={handleMail}
                onSelect={handleSelect}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column: hide class info for students */}
        <aside className="col-span-12 lg:col-span-4">
          {role === "teacher" && <ClassInfoCard info={classInfo} />}
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