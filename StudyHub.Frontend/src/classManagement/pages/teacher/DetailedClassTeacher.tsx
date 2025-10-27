import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
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
import type {
  ClassInfo,
  ClassMemberDto,
  ClassNotification,
} from "@/classManagement/interfaces/class";

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
const ClassWorkDropdown: React.FC<{ work: ClassWork }> = ({ work }) => {
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
        {work.deadline
          ? new Date(work.deadline).toLocaleString()
          : "Không xác định"}
      </div>
      {work.classId && (
        <div className="mt-2 text-xs text-gray-400">Mã lớp: {work.classId}</div>
      )}
      {/* Thêm các trường khác nếu cần */}
    </div>
  );
};

// ===== Trang chi tiết lớp học =====
const DetailedClassTeacher: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    getClassInfo,
    getClassMembers,
    getClassWorks,
    currentClass,
    isLoading,
    createNotification,
  } = useClassStore();
  const [selectedMember, setSelectedMember] = useState<ClassMemberDto | null>(
    null
  );
  const [openAddMember, setOpenAddMember] = useState(false);

  // State cho dropdown bài tập
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const navigate = useNavigate();

  const userRole: UserRole = useMemo(() => {
    if (location.pathname.includes("/student")) return "student";
    return "teacher";
  }, [location.pathname]);

  // ✅ Gọi API lấy thông tin lớp + notifications khi mount
  useEffect(() => {
    if (id) {
      getClassInfo(Number(id));
    }
  }, [id, getClassInfo]);
  const worksFromStore: ClassWork[] = currentClass?.data?.works ?? [];
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
      // Only fetch if we don't already have loaded members (avoid refetching every open)
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
        // call store action
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

  // handlePost now accepts title and links from PostComposer and forwards them to the store
  const handlePost = async (
    content: string,
    files?: File[],
    links?: LinkPayload[],
    titleFromComposer?: string
  ) => {
    if (!id) return;

    // decide title: use provided composer title when available, otherwise fallback to generated one
    const fallbackTitle =
      content && content.length > 40
        ? `${content.slice(0, 40)}...`
        : "Thông báo mới";
    const titleToSend =
      titleFromComposer && titleFromComposer.trim().length > 0
        ? titleFromComposer.trim()
        : fallbackTitle;

    // createdBy must be a GUID string that backend accepts.
    // Replace with actual current user id when available.
    const createdByGuid = "d4e5f6a7-b8c9-0123-4567-890abcdef014";

    // Call store action to create notification
    // Include links if provided (store should append LinksJson or send appropriately)
    const created = await createNotification({
      classId: Number(id),
      title: titleToSend,
      description: content,
      createdBy: createdByGuid,
      files: files && files.length > 0 ? files : undefined,
      links: links && links.length > 0 ? links : undefined,
    });

    if (created) {
      // Refresh notifications from API to get server-generated fields
      const refreshed = await getClassInfo(Number(id));
      if (refreshed && refreshed.data?.notifications) {
        setNotifications(refreshed.data.notifications);
      } else {
        // fallback: prepend created item if refresh failed
        setNotifications((prev) => [created, ...prev]);
      }
    } else {
      // fallback: just add to local UI (optimistic) - include links as pseudo-file entries
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
    // refresh members if needed (store inviteMembers already attempts getClassMembers)
    if (id) {
      getClassMembers(Number(id));
    }
    // close modal handled by AddMemberModal caller or parent
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
      {/* ===== Breadcrumb ===== */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={"/class/" + userRole}>Lớp học</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {classInfo?.name ?? "Chi tiết lớp học"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header with title and Add member button */}
      <div className="mt-4 mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {classInfo?.name ?? "Chi tiết lớp học"}
          </h1>
          <div className="text-sm text-gray-500">
            {classInfo?.description ?? ""}
          </div>
        </div>
        <div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded"
          >
            Thêm thành viên
          </button>
        </div>
      </div>

      {/* ===== Lưới bố cục chính ===== */}
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

            {/* --- Thông báo --- */}
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

            {/* --- Bài tập --- */}
            <TabsContent value="exercise">
              <div className="flex justify-end mb-3">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                  onClick={() => navigate(`/class/teacher/${id}/classwork/add`)}
                >
                  + Thêm bài tập
                </button>
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
                          onClick={() =>
                            navigate(`/class/teacher/${id}/classwork/${w.id}/detail`)
                          }
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
                            <button
                              className="ml-4 text-blue-600 underline text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/class/teacher/${id}/classwork/${w.id}/edit`);
                              }}
                            >
                              Sửa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* --- Mọi người --- */}
            <TabsContent value="everyone">
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

        {/* ===== Cột bên phải ===== */}
        <aside className="col-span-12 lg:col-span-4">
          <ClassInfoCard info={classInfo} />
        </aside>
      </div>

      {/* ===== Modal chi tiết thành viên ===== */}
      <MemberDetailModal
        open={!!selectedMember}
        member={selectedMember}
        onClose={handleCloseModal}
      />

      {/* ===== Add member modal ===== */}
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