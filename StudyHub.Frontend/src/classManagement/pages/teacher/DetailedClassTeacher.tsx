import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import PostComposer from "@/classManagement/components/ui/postcomposer";
import PostCard from "@/classManagement/components/ui/postcard";
import EveryoneListTC from "@/classManagement/components/ui/listeveryoneteacher";
import MemberDetailModal from "@/classManagement/components/ui/memberdetailmodal";
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

// ===== Trang chi tiết lớp học =====
const DetailedClassTeacher: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getClassInfo, getClassMembers, currentClass, isLoading, createNotification } =
    useClassStore();
  const [selectedMember, setSelectedMember] = useState<ClassMemberDto | null>(null);
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
      // you may want to avoid refetch if already loaded; simple call for now
      getClassMembers(Number(id));
    }
  }, [activeTab, id, getClassMembers]);

  const teacher: ClassMemberDto | null = currentClass?.data?.teacher ?? null;
  const students: ClassMemberDto[] = currentClass?.data?.students ?? [];
  const parents: ClassMemberDto[] = currentClass?.data?.parents ?? [];
  const [notifications, setNotifications] = useState<ClassNotification[]>([]);

  // sync notifications whenever currentClass updates
  useEffect(() => {
    if (currentClass?.data?.notifications) {
      setNotifications(currentClass.data.notifications);
    }
  }, [currentClass?.data?.notifications]);

  const classInfo: ClassInfo | null = currentClass?.data?.classInfo ?? null;

  // handlePost now calls backend to create notification (and uploads file if provided).
  // After successful creation we refresh notifications via getClassInfo.
  const handlePost = async (content: string, files?: File[]) => {
    if (!id) return;
    const title = content.length > 40 ? `${content.slice(0, 40)}...` : "Thông báo mới";

    // createdBy must be a GUID string that backend accepts.
    // Replace with actual current user id when available.
    const createdByGuid = "d4e5f6a7-b8c9-0123-4567-890abcdef014";

    // Call store action to create notification
    const created = await createNotification({
      classId: Number(id),
      title,
      description: content,
      createdBy: createdByGuid,
      files: files && files.length > 0 ? files : undefined,
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
      // fallback: just add to local UI (optimistic) - optional
      const fallback: ClassNotification = {
        id: Date.now(),
        classId: Number(id),
        title,
        description: content,
        createdAt: new Date().toISOString(),
        createdBy: createdByGuid,
        files: files?.map((f) => ({ id: 0, fileName: f.name, fileUrl: "" })) ?? [],
        comments: [],
      };
      setNotifications((prev) => [fallback, ...prev]);
    }
  };

  const handleMail = (person: ClassMemberDto) => {
    window.location.href = `mailto:${person.fullname.replace(/\s+/g, ".").toLowerCase()}@example.com`;
  };

  const handleSelect = (p: ClassMemberDto) => setSelectedMember(p);
  const handleCloseModal = () => setSelectedMember(null);

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">Đang tải thông tin lớp học...</div>;
  }

  if (!currentClass?.success) {
    return <div className="p-6 text-center text-red-500">Không thể tải thông tin lớp học.</div>;
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
            <BreadcrumbPage>{classInfo?.name ?? "Chi tiết lớp học"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ===== Lưới bố cục chính ===== */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
            <div className="mb-4">
              <TabsList>
                <TabsTrigger value="notifications">Thông báo</TabsTrigger>
                <TabsTrigger value="exercise">Bài tập</TabsTrigger>
                <TabsTrigger value="everyone">Mọi người</TabsTrigger>
              </TabsList>
            </div>

            {/* --- Thông báo --- */}
            <TabsContent value="notifications">
              {/* If PostComposer supports files, ensure it calls onPost(content, files) */}
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
                  <div className="text-gray-500 text-sm">Chưa có thông báo nào.</div>
                )}
              </div>
            </TabsContent>

            {/* --- Bài tập --- */}
            <TabsContent value="exercise">
              <div className="text-gray-500 text-sm">Chưa có bài tập nào.</div>
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
      <MemberDetailModal open={!!selectedMember} member={selectedMember} onClose={handleCloseModal} />
    </div>
  );
};

export default DetailedClassTeacher;