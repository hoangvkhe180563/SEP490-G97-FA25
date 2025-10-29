import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import type { ClassMemberDto, ClassworkSubmission, ClassworkSubmissionFile } from "@/classManagement/interfaces/class";

const ClassworkSubmissionsPage: React.FC = () => {
  const params = useParams<{ id?: string; role?: string; classworkId?: string }>();
  const classId = Number(params.id ?? 0);
  const workId = Number(params.classworkId ?? 0);
  const navigate = useNavigate();

  const { getClassworkSubmissions, getClassMembers, currentClass, getClassInfo } = useClassStore();
  const { user } = useAuthStore();

  const [submissions, setSubmissions] = useState<ClassworkSubmission[] | null>(null);
  const [members, setMembers] = useState<ClassMemberDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // ensure class info / members loaded: prefer currentClass.data.students
        let students = currentClass?.data?.students ?? [];
        if (!students || students.length === 0) {
          const mem = await getClassMembers(classId);
          students = mem ?? [];
        }
        if (!mounted) return;
        setMembers(students);

        const subs = await getClassworkSubmissions(workId);
        if (!mounted) return;
        setSubmissions(subs ?? []);
      } catch (err) {
        console.error("load submissions page error", err);
        if (mounted) setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (classId && workId) load();
    else {
      setError("Thiếu classId hoặc workId");
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [classId, workId, currentClass?.data?.students, getClassworkSubmissions, getClassMembers]);

  if (loading) return <div className="p-6 text-gray-500">Đang tải...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  const submittedMap = new Map<string, ClassworkSubmission>();
  (submissions ?? []).forEach((s) => submittedMap.set(String(s.appUserId), s));

  const submittedList = (members ?? []).filter((m) => submittedMap.has(String(m.userId)));
  const notSubmittedList = (members ?? []).filter((m) => !submittedMap.has(String(m.userId)));

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="mr-3 px-3 py-2 rounded border">Quay lại</button>
          <h2 className="text-xl font-semibold inline">Danh sách nộp bài</h2>
        </div>
        <div className="text-sm text-gray-600">Bài tập #{workId}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-3">Đã nộp ({submittedList.length})</h3>
          {submittedList.length === 0 ? (
            <div className="text-gray-500">Chưa có ai nộp.</div>
          ) : (
            <div className="space-y-3">
              {submittedList.map((m) => {
                const s = submittedMap.get(String(m.userId))!;
                return (
                  <div key={m.userId} className="border rounded p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{m.fullname ?? m.userId}</div>
                        <div className="text-xs text-gray-500">ID: {m.userId}</div>
                      </div>
                      <div className="text-xs text-gray-500">Nộp: {new Date(s.latestSubmissionTime).toLocaleString()}</div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(s.files ?? []).map((f: ClassworkSubmissionFile) => (
                        <a key={f.id} href={f.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">
                          {f.fileName}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-3">Chưa nộp ({notSubmittedList.length})</h3>
          {notSubmittedList.length === 0 ? (
            <div className="text-gray-500">Mọi người đã nộp.</div>
          ) : (
            <div className="space-y-2">
              {notSubmittedList.map((m) => (
                <div key={m.userId} className="flex items-center justify-between border rounded p-2 bg-gray-50">
                  <div>
                    <div className="font-medium">{m.fullname ?? m.userId}</div>
                    <div className="text-xs text-gray-500">ID: {m.userId}</div>
                  </div>
                  <div className="text-xs text-gray-500">—</div>
                </div>
              ))}
            </div>
          )}  
        </section>
      </div>
    </div>
  );
};

export default ClassworkSubmissionsPage;