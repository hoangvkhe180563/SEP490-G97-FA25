import React, { useEffect, useState, useCallback, useRef } from "react";
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

import NotificationsTab from "@/classManagement/components/tabs/notificationTab";
import ExerciseTab from "@/classManagement/components/tabs/exerciseTab";
import EveryoneTab from "@/classManagement/components/tabs/everyoneTab";
import ClassExams from "@/classManagement/components/ClassExams";

import { isPastDeadline } from "@/classManagement/utils/dateutil";

/*
  Updated: Restore guaranteed loading of documents and class-level member count while
  still minimizing duplicate requests.

  Approach:
  - Consolidated initial loader (runs once per id) that:
    1) calls getClassInfo (to populate store & possibly notifications)
    2) calls getDocumentsByClassId (to load documents into local state)
    3) calls getMemberClassCount (preferred) and falls back to getMemberCount/store students length
  - Guards ensure each of those calls runs once per id (refs).
  - Tab-driven fetches (works/members) remain one-time when user opens the tab.
  - Kept dependencies minimal to avoid re-runs caused by unstable function identities.
*/

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
    getMemberClassCount,
    getDocumentsByClassId,
    isLoading,
    createNotification,
    getClassworkSubmissions,
    getSubmissionCount,
  } = useClassStore();

  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [notifications, setNotifications] = useState<ClassNotification[]>([]);
  const [classMemberCount, setClassMemberCount] = useState<number | null>(null);

  const [submissionCounts, setSubmissionCounts] = useState<Record<number, number | null>>({});
  const [memberCounts, setMemberCounts] = useState<Record<number, number | null>>({});

  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "notifications";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const navigate = useNavigate();

  // refs to guard one-time calls per id
  const consolidatedFetchedRef = useRef<string | null>(null);
  const fetchedWorksRef = useRef<string | null>(null);
  const fetchedMembersRef = useRef<string | null>(null);
  const prefetchCountsRef = useRef<string | null>(null);

  const worksLength = (currentClass?.data?.works ?? []).length;
  const studentsLength = (currentClass?.data?.students ?? []).length;

  // Document card component
  const DocumentPreviewCard: React.FC<{ doc: DocumentDto; role: string }> = ({ doc, role }) => {
    const navigateLocal = useNavigate();
    const isImage = !!(doc.fileType && /jpg|jpeg|png|gif|bmp|webp/i.test(String(doc.fileType)));
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
          navigateLocal(detailPath);
        }}
        className="block"
        title={doc.name}
      >
        <Card className="p-3 hover:shadow-md transition">
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
        </Card>
      </a>
    );
  };

  // Consolidated loader: runs once per id (guarded)
  useEffect(() => {
    if (!id) {
      setDocuments([]);
      setNotifications([]);
      setClassMemberCount(null);
      return;
    }

    // Already fetched for this id
    if (consolidatedFetchedRef.current === id) {
      // sync notifications from store snapshot if available
      if (currentClass?.data?.notifications) setNotifications(currentClass.data.notifications);
      return;
    }
    consolidatedFetchedRef.current = id;

    let mounted = true;

    (async () => {
      try {
        // 1) getClassInfo (populate store + possibly return notifications)
        let maybeResult: any = null;
        try {
          if (typeof getClassInfo === "function") {
            maybeResult = await getClassInfo(Number(id));
          }
        } catch (err) {
          console.warn("getClassInfo failed", err);
        }

        if (!mounted) return;

        const returnedNotifications = maybeResult && (maybeResult.notifications ?? maybeResult.data?.notifications);
        if (Array.isArray(returnedNotifications)) {
          setNotifications(returnedNotifications);
        } else if (currentClass?.data?.notifications) {
          setNotifications(currentClass.data.notifications);
        } else {
          setNotifications([]);
        }

        // 2) documents: try server endpoint (once)
        try {
          if (typeof getDocumentsByClassId === "function") {
            setDocsLoading(true);
            const docs = await getDocumentsByClassId(Number(id));
            if (mounted) setDocuments(docs ?? []);
          } else {
            if (mounted) setDocuments([]);
          }
        } catch (err) {
          console.warn("getDocumentsByClassId failed", err);
          if (mounted) setDocuments([]);
        } finally {
          if (mounted) setDocsLoading(false);
        }

        // 3) member count: prefer getMemberClassCount, fallback to getMemberCount or store students length
        try {
          if (typeof getMemberClassCount === "function") {
            const cnt = await getMemberClassCount(Number(id));
            if (mounted) setClassMemberCount(typeof cnt === "number" ? cnt : null);
          } else {
            // fallback try getMemberCount
            if (typeof getMemberCount === "function") {
              try {
                const cnt2 = await getMemberCount(Number(id));
                if (mounted) setClassMemberCount(typeof cnt2 === "number" ? cnt2 : null);
              } catch {
                if (mounted) setClassMemberCount((currentClass?.data?.students ?? []).length ?? null);
              }
            } else {
              if (mounted) setClassMemberCount((currentClass?.data?.students ?? []).length ?? null);
            }
          }
        } catch (err) {
          console.warn("member count endpoints failed", err);
          if (mounted) setClassMemberCount((currentClass?.data?.students ?? []).length ?? null);
        }
      } catch (outer) {
        console.error("consolidated loader error", outer);
      }
    })();

    return () => {
      mounted = false;
    };
    // Only run when id changes (we intentionally avoid including store functions in deps to prevent re-runs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Keep notifications in sync if store updates later
  useEffect(() => {
    if (!id) return;
    if (currentClass?.data?.notifications) {
      setNotifications(currentClass.data.notifications);
    }
  }, [id, currentClass?.data?.notifications]);

  // Everyone tab: fetch members once (guarded)
  useEffect(() => {
    if (!id || activeTab !== "everyone") return;
    if (fetchedMembersRef.current === id) return;
    fetchedMembersRef.current = id;

    (async () => {
      try {
        const hasTeacher = (currentClass?.data?.teachers ?? []).length > 0;
        const hasStudents = (currentClass?.data?.students ?? []).length > 0;
        const hasParents = (currentClass?.data?.parents ?? []).length > 0;
        if (!hasTeacher && !hasStudents && !hasParents && typeof getClassMembers === "function") {
          await getClassMembers(Number(id));
        }
      } catch (err) {
        console.warn("getClassMembers failed", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id]);

  // Exercise tab: fetch works once (guarded)
  useEffect(() => {
    if (!id || activeTab !== "exercise") return;
    if (fetchedWorksRef.current === id) return;
    fetchedWorksRef.current = id;

    (async () => {
      try {
        const hasWorks = (currentClass?.data?.works ?? []).length > 0;
        if (!hasWorks && typeof getClassWorks === "function") {
          await getClassWorks(Number(id));
        }
      } catch (err) {
        console.warn("getClassWorks failed", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id]);

  // Prefetch per-work counts once per id on entering exercise tab
  useEffect(() => {
    if (!id || activeTab !== "exercise") return;
    if (prefetchCountsRef.current === id) return;
    prefetchCountsRef.current = id;

    const works = currentClass?.data?.works ?? [];
    if (!Array.isArray(works) || works.length === 0) return;

    (async () => {
      let defaultCount: number | null = classMemberCount ?? null;
      if (defaultCount === null) {
        try {
          if (typeof getMemberCount === "function") {
            const cnt = await getMemberCount(Number(id));
            defaultCount = typeof cnt === "number" ? cnt : null;
          }
        } catch {
          defaultCount = (currentClass?.data?.students ?? []).length ?? null;
        }
      }

      if (defaultCount !== null) {
        setMemberCounts((prev) => {
          const next = { ...prev };
          for (const w of works) {
            if (next[w.id] === undefined || next[w.id] === null) next[w.id] = defaultCount;
          }
          return next;
        });
      }

      try {
        await Promise.all(works.map((w) => fetchCountsForWork(w.id)));
      } catch (err) {
        console.warn("Prefetch per-work counts failed", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id, worksLength]);

  // fetchCountsForWork (stable-ish)
  const fetchCountsForWork = useCallback(
    async (wid: number) => {
      try {
        if (typeof getSubmissionCount === "function") {
          const sc = await getSubmissionCount(wid);
          setSubmissionCounts((prev) => ({ ...prev, [wid]: sc }));
        } else {
          const subs = await getClassworkSubmissions(wid);
          const unique = new Set<string>();
          subs?.forEach((s) => unique.add(String((s as any).appUserId ?? (s as any).userId ?? "")));
          setSubmissionCounts((prev) => ({ ...prev, [wid]: unique.size }));
        }

        let accurateCount: number | null = null;
        try {
          if (typeof getMemberCount === "function") {
            const cnt = await getMemberCount(Number(id));
            accurateCount = typeof cnt === "number" ? cnt : null;
          }
        } catch {
          // ignore
        }
        if (accurateCount === null) accurateCount = (currentClass?.data?.students ?? []).length ?? classMemberCount ?? null;
        setMemberCounts((prev) => ({ ...prev, [wid]: accurateCount }));
      } catch (e) {
        console.error("fetchCountsForWork failed for", wid, e);
      }
    },
    // limited deps on id and students length
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, studentsLength, classMemberCount]
  );

  // handlers
  const handlePost = async (content: string, files?: File[] | undefined, links?: any[] | undefined, titleFromComposer?: string) => {
    if (!id) return;
    const fallbackTitle = content && content.length > 40 ? `${content.slice(0, 40)}...` : "Thông báo mới";
    const titleToSend = titleFromComposer && titleFromComposer.trim().length > 0 ? titleFromComposer.trim() : fallbackTitle;
    const createdBy = user?.id ?? "";
    try {
      const payload = { classId: Number(id), title: titleToSend, description: content, files, links, createdBy };
      const created = await createNotification(payload);
      if (created) {
        setNotifications((prev) => [created, ...(prev ?? [])]);
        if (typeof getClassInfo === "function") await getClassInfo(Number(id));
      }
    } catch (err) {
      console.error("handlePost/createNotification error:", err);
    }
  };

  const handleMail = (person: ClassMemberDto) => {
    window.location.href = `mailto:${person.fullname.replace(/\s+/g, ".").toLowerCase()}@example.com`;
  };

  const handleSelect = (p: ClassMemberDto) => {}; // placeholder

  if (isLoading) return <div className="p-8 text-center text-slate-500">Đang tải thông tin lớp học...</div>;
  if (!currentClass?.success) return <div className="p-8 text-center text-red-500">Không thể tải thông tin lớp học.</div>;

  const classInfo: ClassInfo | null = currentClass?.data?.classInfo ?? null;
  const teacher: ClassMemberDto[] = currentClass?.data?.teachers ?? [];
  const students: ClassMemberDto[] = currentClass?.data?.students ?? [];
  const parents: ClassMemberDto[] = currentClass?.data?.parents ?? [];
  const worksFromStore: ClassWork[] = currentClass?.data?.works ?? [];

  return (
    <div className="p-8 relative w-full h-full overflow-y-auto">
      <Breadcrumb>
        <BreadcrumbList className="flex items-center gap-2 whitespace-nowrap">
          <BreadcrumbItem>
            <BreadcrumbLink href={`/class/${role}`} className="inline-flex items-center text-sm text-slate-600 hover:underline">Lớp học</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-slate-400"><ChevronRight className="w-4 h-4" /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="inline-block text-sm font-medium text-slate-900 truncate max-w-[48ch]" aria-current="page">{classInfo?.name ?? "Chi tiết lớp học"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6 mb-6 flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">{classInfo?.name ?? "Chi tiết lớp học"}</h1>
          <div className="text-base text-slate-500 mt-1">{classInfo?.description ?? ""}</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(String(v))} className="w-full mt-4">
            <div className="mb-4">
              <TabsList>
                <TabsTrigger value="notifications" className="px-4 py-2 text-lg">Thông báo</TabsTrigger>
                <TabsTrigger value="exercise" className="px-4 py-2 text-lg">Bài tập</TabsTrigger>
                <TabsTrigger value="everyone" className="px-4 py-2 text-lg">Mọi người</TabsTrigger>
                <TabsTrigger value="exam" className="px-4 py-2 text-lg">Bài kiểm tra</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="notifications">
              <NotificationsTab classId={id} notifications={notifications} onPost={handlePost} isTeacher={role === "teacher"} />
            </TabsContent>

            <TabsContent value="exercise">
              <ExerciseTab
                works={worksFromStore}
                role={role as "teacher" | "student"}
                onOpenWork={(workId) => {
                  if (role === "student") navigate(`/class/${role}/${id}/classwork/${workId}/detail`);
                  else navigate(`/class/${role}/${id}/classwork/${workId}/submissions`);
                }}
                onAddWork={() => navigate(`/class/${role}/${id}/classwork/add`)}
                fetchCountsForWork={fetchCountsForWork}
                submissionCounts={submissionCounts}
                memberCounts={memberCounts}
                classDefaultCount={classMemberCount ?? (students?.length ?? null)}
                navigateToEdit={(wid) => navigate(`/class/${role}/${id}/classwork/${wid}/edit`)}
              />
            </TabsContent>

            <TabsContent value="everyone">
              <EveryoneTab teachers={teacher} students={students} parents={parents} onMail={handleMail} onSelect={handleSelect} onAddMember={() => { if (typeof getClassMembers === "function") void getClassMembers(Number(id)); }} classId={currentClass?.data?.classInfo?.id ?? 0} />
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
                  <div className="text-sm font-semibold text-slate-600 mb-3">THÔNG TIN LỚP HỌC</div>
                  <div className="text-slate-800">
                    <div className="font-extrabold text-2xl mb-1">{classInfo?.name ?? "Tên lớp"}</div>
                    <div className="text-md text-slate-500 mb-4">{classInfo?.description ?? ""}</div>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 flex items-center justify-between">
                <div className="text-xs text-slate-400">Số thành viên</div>
                <Badge className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold text-lg">{classMemberCount ?? "—"}</Badge>
              </div>
            </Card>

            <Card className="mt-4">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-lg">Tài liệu lớp</div>
                  <div className="text-sm text-slate-500">{docsLoading ? "Đang tải..." : `${documents.length} tài liệu`}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {documents && documents.length > 0 ? documents.map((d) => <DocumentPreviewCard key={d.id} doc={d} role={role} />) : <div className="col-span-2 text-sm text-slate-500">Chưa có tài liệu.</div>}
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