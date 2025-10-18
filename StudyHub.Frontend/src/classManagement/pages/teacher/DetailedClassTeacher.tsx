import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import PostComposer from "@/classManagement/components/ui/postcomposer";
import PostCard from "@/classManagement/components/ui/postcard";
import EveryoneListTC from "@/classManagement/components/ui/listeveryoneteacher";
import MemberDetailModal from "@/classManagement/components/ui/memberdetailmodal";

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

// ===== Class Info Card =====
const ClassInfoCard: React.FC<{ info: ClassInfo | null }> = ({ info }) => {
  if (!info) return null;
  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="text-sm font-medium mb-3">Class Information</div>
      <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
        <div className="text-xs text-gray-400">Class ID:</div>
        <div className="font-medium text-right">{info.id}</div>

        <div className="text-xs text-gray-400">Subject ID:</div>
        <div className="font-medium text-right">{info.subjectId}</div>

        <div className="text-xs text-gray-400">Created At:</div>
        <div className="font-medium text-right">
          {new Date(info.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

// ===== DetailedClassTeacher =====
const DetailedClassTeacher: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getClassDetail, currentClass, isLoading } = useClassStore();

  const [selectedMember, setSelectedMember] = useState<ClassMemberDto | null>(
    null
  );

  // ✅ Gọi API lấy thông tin lớp khi mount
  useEffect(() => {
    if (id) {
      getClassDetail(Number(id));
    }
  }, [id, getClassDetail]);

  const teacher: ClassMemberDto | null = currentClass?.data?.teacher ?? null;

  const students: ClassMemberDto[] = currentClass?.data?.students ?? [];
  const parents: ClassMemberDto[] = currentClass?.data?.parents ?? [];

  const [notifications, setNotifications] = useState<ClassNotification[]>([]);

  useEffect(() => {
    if (currentClass?.data?.notifications) {
      setNotifications(currentClass.data.notifications);
    }
  }, [currentClass]);

  const classInfo: ClassInfo | null = currentClass?.data?.classInfo ?? null;

  const handlePost = (content: string) => {
    const newNotification: ClassNotification = {
      id: Date.now(),
      title: "Thông báo mới",
      description: content,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const handleMail = (person: ClassMemberDto) => {
    window.location.href = `mailto:${person.fullname
      .replace(/\s+/g, ".")
      .toLowerCase()}@example.com`;
  };

  const handleSelect = (p: ClassMemberDto) => setSelectedMember(p);
  const handleCloseModal = () => setSelectedMember(null);

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading class details...
      </div>
    );
  }

  if (!currentClass?.success) {
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load class details.
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* ===== Breadcrumb ===== */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Classroom</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{classInfo?.name ?? "Class Detail"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ===== Main Grid ===== */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <Tabs defaultValue="notifications" className="w-full mt-4">
            <div className="mb-4">
              <TabsList>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="exercise">Exercise</TabsTrigger>
                <TabsTrigger value="everyone">Everyone</TabsTrigger>
              </TabsList>
            </div>

            {/* --- Posts --- */}
            <TabsContent value="notifications">
              <PostComposer onPost={handlePost} avatarUrl={"/vite.svg"} />
              <div className="mt-4 space-y-4">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <PostCard
                      key={n.id}
                      post={{
                        id: n.id,
                        author: teacher?.fullname ?? "Teacher",
                        time: "recently",
                        avatarUrl: "/vite.svg",
                        content: `${n.title}\n${n.description}`,
                        comments: [],
                      }}
                    />
                  ))
                ) : (
                  <div className="text-gray-500 text-sm">
                    No notifications yet.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* --- Exercise --- */}
            <TabsContent value="exercise">
              <div className="text-gray-500 text-sm">No exercises yet.</div>
            </TabsContent>

            {/* --- Everyone --- */}
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

        {/* ===== Sidebar ===== */}
        <aside className="col-span-12 lg:col-span-4">
          <ClassInfoCard info={classInfo} />
        </aside>
      </div>

      {/* ===== Member Detail Modal ===== */}
      <MemberDetailModal
        open={!!selectedMember}
        member={selectedMember}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default DetailedClassTeacher;
