import React, { useState } from "react";
import PostComposer from "@/common/components/ui/postcomposer";
import PostCard from "@/common/components/ui/postcard";
import type { Post } from "@/common/components/ui/postcard";
import AssignmentCard from "@/common/components/ui/assignmentcard";
import EveryoneListTC from "@/common/components/ui/listeveryoneteacher";
import type { Person } from "@/common/components/ui/listeveryoneteacher"; // ✅ import type Person
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/common/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/common/components/ui/tabs";
import MemberDetailModal from "@/common/components/ui/memberdetailmodal"; // ✅ để hiển thị thông tin người được click

// ===== Class Info Card =====
const ClassInfoCard: React.FC<{ info: { id?: string; students?: number; schedule?: string } }> = ({ info }) => {
  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="text-sm font-medium mb-3">Class Information</div>
      <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
        <div className="text-xs text-gray-400">Class ID:</div>
        <div className="font-medium text-right">{info.id ?? "—"}</div>

        <div className="text-xs text-gray-400">Students:</div>
        <div className="font-medium text-right">{info.students ?? "—"}</div>

        <div className="text-xs text-gray-400">Schedule:</div>
        <div className="font-medium text-right">{info.schedule ?? "—"}</div>
      </div>
    </div>
  );
};

// ===== DetailedClassTeacher =====
const DetailedClassTeacher: React.FC = () => {
  const classTitle = "Mathematics 101";

  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      author: "Dr. Sarah Johnson",
      time: "2 hours ago",
      avatarUrl: "/vite.svg",
      content:
        "Welcome to Advanced Mathematics! Please review the syllabus and prepare for our first lesson on differential equations.",
      attachmentLabel: "Course_Syllabus_2025.pdf",
      comments: [
        { id: 1, author: "Student A", text: "Thanks, looking forward!", avatarUrl: "/vite.svg", time: "1h" },
      ],
    },
  ]);

  const [assignments] = useState([
    { id: 1, title: "Assignment 3: Derivatives", due: "30/9/2025 00:00", submitted: 36, icon: "alert" as const },
    { id: 2, title: "Assignment 4: Integrals", due: "10/10/2025 00:00", submitted: 25, icon: "calendar" as const },
    { id: 3, title: "Midterm Exam", due: "20/10/2025 00:00", submitted: 0, icon: "calendar" as const },
  ]);

  const classInfo = { id: "MATH-ADV-2025", students: 28, schedule: "MWF 10:00 AM" };

  const teacher: Person = { id: "t1", name: "Dr. Sarah Johnson", subtitle: "Mathematics Professor", avatarUrl: "/vite.svg" };
  const students: Person[] = [
    { id: "s1", name: "John Smith", subtitle: "ID: STU001", avatarUrl: "/vite.svg" },
    { id: "s2", name: "Emily Davis", subtitle: "ID: STU002", avatarUrl: "/vite.svg" },
    { id: "s3", name: "Michael Brown", subtitle: "ID: STU003", avatarUrl: "/vite.svg" },
  ];
  const parents: Person[] = [
    { id: "p1", name: "Robert Smith", subtitle: "Parent of John Smith", avatarUrl: "/vite.svg" },
    { id: "p2", name: "Linda Davis", subtitle: "Parent of Emily Davis", avatarUrl: "/vite.svg" },
  ];

  const [selectedMember, setSelectedMember] = useState<Person | null>(null);

  const handlePost = (content: string) => {
    const next: Post = {
      id: Date.now(),
      author: "You",
      time: "just now",
      content,
      avatarUrl: "/vite.svg",
      comments: [],
    };
    setPosts((p) => [next, ...p]);
  };

  const handleMail = (person: Person) => {
    window.location.href = `mailto:${person.name.replace(/\s+/g, ".").toLowerCase()}@example.com`;
  };

  const handleSelect = (p: Person) => {
    setSelectedMember(p);
  };

  const handleCloseModal = () => setSelectedMember(null);

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
            <BreadcrumbLink href="/classes">{classTitle}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {selectedMember ? (
              <BreadcrumbPage>{selectedMember.name}</BreadcrumbPage>
            ) : (
              <BreadcrumbPage>Overview</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ===== Main Grid ===== */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="mt-4">
            <Tabs defaultValue="posts" className="w-full">
              <div className="mb-4">
                <TabsList>
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                  <TabsTrigger value="exercise">Exercise</TabsTrigger>
                  <TabsTrigger value="everyone">Everyone</TabsTrigger>
                </TabsList>
              </div>

              {/* --- Posts --- */}
              <TabsContent value="posts">
                <div className="bg-white border rounded-lg p-6 mb-4">
                  <div className="text-lg font-semibold">{classTitle}</div>
                  <div className="text-sm text-gray-500 mt-1">Spring 2025 • 32 students enrolled</div>
                </div>

                <PostComposer onPost={handlePost} avatarUrl="/vite.svg" />
                <div className="mt-4 space-y-4">
                  {posts.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              </TabsContent>

              {/* --- Exercise --- */}
              <TabsContent value="exercise">
                <div className="bg-white border rounded-lg p-4">
                  <div className="text-sm font-medium mb-2">Exercises / Classworks</div>
                  <div className="text-gray-500">
                    No exercises yet. You can create assignments from the teacher dashboard.
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {assignments.map((a) => (
                    <AssignmentCard key={a.id} a={a} />
                  ))}
                </div>
              </TabsContent>

              {/* --- Everyone --- */}
              <TabsContent value="everyone">
                <EveryoneListTC
                  teacher={teacher}
                  students={students}
                  parents={parents}
                  onMail={handleMail}
                  onSelect={handleSelect} // ✅ chọn người → hiển thị modal
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* ===== Sidebar ===== */}
        <aside className="col-span-12 lg:col-span-4">
          <ClassInfoCard info={classInfo} />
          <div className="text-lg font-medium mb-3">Upcoming Deadlines</div>
          <div className="space-y-3">
            {assignments.map((a) => (
              <AssignmentCard key={a.id} a={a} />
            ))}
          </div>
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
