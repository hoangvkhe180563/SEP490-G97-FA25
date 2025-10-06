import React, { useState } from "react";
import PostComposer from "@/classManagement/components/ui/postcomposer";
import PostCard from "@/classManagement/components/ui/postcard";
import type { Post } from "@/classManagement/components/ui/postcard";
import AssignmentCard from "@/classManagement/components/ui/assignmentcard";
import EveryoneList from "@/classManagement/components/ui/listeveryone";
import type { Person } from "@/classManagement/components/ui/listeveryone";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/common/components/ui/breadcrumb";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/common/components/ui/tabs";

type Person2 = { id: string; name: string; subtitle?: string; avatarUrl?: string };

const DetailedClassStudent: React.FC = () => {
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
    { id: 2, title: "Assignment 3: Derivatives", due: "30/9/2025 00:00", submitted: 36, icon: "alert" as const },
    { id: 3, title: "Midterm Exam", due: "30/9/2025 00:00", submitted: 36, icon: "calendar" as const },
  ]);

  const classTitle = "Mathematics 101";
  const teacher = { id: "t1", name: "Dr. Sarah Johnson", subtitle: "Mathematics Professor", avatarUrl: "/vite.svg" };
  const students: Person2[] = [
    { id: "s1", name: "John Smith", subtitle: "ID: STU001", avatarUrl: "/vite.svg" },
    { id: "s2", name: "Emily Davis", subtitle: "ID: STU002", avatarUrl: "/vite.svg" },
    { id: "s3", name: "Michael Brown", subtitle: "ID: STU003", avatarUrl: "/vite.svg" },
  ];
  const parents = [
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

  const handleMail = (person: { id: string | number; name: string }) => {
    window.location.href = `mailto:${person.name.replace(/\s+/g, ".").toLowerCase()}@example.com`;
  };

  return (
    <div className="p-6">
      {/* ✅ Breadcrumb theo chuẩn shadcn */}
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

      <div className="grid grid-cols-12 gap-6 mt-4">
        <div className="col-span-12 lg:col-span-8">
          <Tabs defaultValue="posts" className="w-full">
            <div className="mb-4">
              <TabsList>
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="exercise">Exercise</TabsTrigger>
                <TabsTrigger value="everyone">Everyone</TabsTrigger>
              </TabsList>
            </div>

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

            <TabsContent value="everyone">
              <EveryoneList
                teacher={teacher}
                students={students}
                parents={parents}
                onMail={handleMail}
                onSelect={(p: Person) => setSelectedMember(p)}
              />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="col-span-12 lg:col-span-4">
          <div className="text-lg font-medium mb-3">Upcoming Deadlines</div>
          <div className="space-y-3">
            {assignments.map((a) => (
              <AssignmentCard key={a.id} a={a} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DetailedClassStudent;