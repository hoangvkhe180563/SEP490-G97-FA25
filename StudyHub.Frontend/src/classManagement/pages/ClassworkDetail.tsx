import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import type { ClassWork, ClassworkSubmission } from "@/classManagement/interfaces/class";

const AvatarIcon: React.FC = () => (
  <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white text-xl shadow">📝</div>
);

const RightCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow p-4 mb-4">
    <div className="text-sm font-medium mb-2">{title}</div>
    <div>{children}</div>
  </div>
);

const Icon: React.FC<{ name: "drive" | "link" | "file" | string }> = ({ name }) => {
  if (name === "drive") return (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 17h18l-2-4-4-8H9L5 13l-2 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>);
  if (name === "link") return (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M10 14a5 5 0 0 1 7.07 0l1.41 1.41a5 5 0 0 1-7.07 7.07l-1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M14 10a5 5 0 0 1-7.07 0L5.52 8.59a5 5 0 0 1 7.07-7.07L14 2.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>);
  return (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M17 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>);
};

const ClassworkDetail: React.FC = () => {
  // read role param so we can restrict to students
  const params = useParams<{ role?: string; id?: string; classworkId?: string }>();
  const roleParam = params.role;
  const id = params.id;
  const classworkId = params.classworkId;
  const role = roleParam === "student" ? "student" : "teacher";

  const { getClassWorks, submitClasswork, getClassworkSubmissions, getClassInfo, currentClass } = useClassStore();
  const [classwork, setClasswork] = useState<ClassWork | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [linkAttachments, setLinkAttachments] = useState<{ title?: string; url: string }[]>([]);
  const [submissions, setSubmissions] = useState<ClassworkSubmission[]>([]);
  const [loading, setLoading] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  // If not student, redirect teacher to edit page (teachers shouldn't access student detail view)
  useEffect(() => {
    if (role !== "student" && id && classworkId) {
      navigate(`/class/${role}/${id}/classwork/${classworkId}/edit`);
    }
  }, [role, id, classworkId, navigate]);

  useEffect(() => {
    if (!id || !classworkId) return;
    getClassInfo(Number(id));
    getClassWorks(Number(id)).then((works) => {
      const cw = works?.find((w) => String(w.id) === String(classworkId));
      setClasswork(cw ?? null);
    });
    getClassworkSubmissions(Number(classworkId)).then((data) => setSubmissions(data ?? []));
  }, [id, classworkId, getClassWorks, getClassworkSubmissions, getClassInfo]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      const target = e.target as Node;
      if (!menuRef.current.contains(target)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...newFiles]);
    setMenuOpen(false);
  };

  const handleAddLink = async (kind: "drive" | "link") => {
    const url = window.prompt(`${kind === "drive" ? "Drive URL" : "Nhập đường liên kết"}`);
    if (!url) return;
    const title = window.prompt("Tiêu đề hiển thị (không bắt buộc)");
    setLinkAttachments((prev) => [...prev, { title: title ?? undefined, url }]);
    setMenuOpen(false);
  };

  const removeFileAt = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));
  const removeLinkAt = (index: number) => setLinkAttachments((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!classworkId) return;
    setLoading(true);
    try {
      const appUserId = localStorage.getItem("currentUserId") ?? "";
      await submitClasswork(Number(classworkId), appUserId, files, linkAttachments);
      setFiles([]);
      setLinkAttachments([]);
      const updated = await getClassworkSubmissions(Number(classworkId));
      setSubmissions(updated ?? []);
      setMenuOpen(false);
    } catch (err) {
      console.error("Submit error", err);
    } finally {
      setLoading(false);
    }
  };

  const classInfo = currentClass?.data?.classInfo ?? null;

  const formatDeadlineShort = (iso?: string | null) => {
    if (!iso) return "Không xác định";
    const d = new Date(iso);
    const day = d.getDate();
    const monthNames = ["thg 1","thg 2","thg 3","thg 4","thg 5","thg 6","thg 7","thg 8","thg 9","thg 10","thg 11","thg 12"];
    return `Đến hạn ${day} ${monthNames[d.getMonth()]}`;
  };

  const isPastDeadline = (iso?: string | null) => {
    if (!iso) return false;
    try { return new Date() > new Date(iso); } catch { return false; }
  };

  if (!classwork) {
    return <div className="p-6"><div className="text-gray-500">Đang tải thông tin bài tập...</div></div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <AvatarIcon />
          <div>
            <h1 className="text-2xl font-semibold">{classwork.title}</h1>
            <div className="text-sm text-gray-500 mt-1">
              <span>{currentClass?.data?.teacher?.fullname ?? "Giáo viên"} • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="mt-3 text-sm text-gray-700">100 điểm</div>
          </div>
        </div>
        <div className="text-sm text-gray-600">{formatDeadlineShort(classwork.deadline)}</div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white border rounded-lg p-6">
            <div className="text-gray-700 mb-4">{classwork.description || "Không có mô tả"}</div>
            <hr className="my-4" />
            <div className="flex items-center gap-3 text-gray-700 mb-2">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              <div className="font-medium">Nhận xét của lớp học</div>
            </div>
            <div><button className="text-blue-600">Thêm nhận xét về lớp học</button></div>

            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Danh sách bài đã nộp</h4>
              <div className="space-y-2">
                {submissions.length === 0 ? (<div className="text-gray-500 text-sm">Chưa có bài nộp nào.</div>) : submissions.map((sub) => (
                  <div key={sub.id} className="border rounded p-3 bg-gray-50">
                    <div className="text-sm text-gray-800">Nộp lần cuối: {new Date(sub.latestSubmissionTime).toLocaleString()}</div>
                    <div className="flex flex-wrap gap-2 mt-2">{sub.files.map((f) => (<a key={f.id} href={f.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">{f.fileName}</a>))}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <aside className="col-span-12 lg:col-span-4">
          <RightCard title="Bài tập của bạn">
            <div className="flex flex-col gap-3">
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen((s) => !s)} className="w-full border rounded-full py-2 text-sm flex items-center justify-center gap-2"><span className="text-lg">+</span> Thêm hoặc tạo</button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg border z-20">
                    <button className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50" onClick={() => handleAddLink("drive")}><div className="w-6"><Icon name="drive" /></div><div>Google Drive</div></button>
                    <button className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50" onClick={() => handleAddLink("link")}><div className="w-6"><Icon name="link" /></div><div>Đường liên kết</div></button>
                    <button className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50" onClick={() => { setMenuOpen(false); fileInputRef.current?.click(); }}><div className="w-6"><Icon name="file" /></div><div>Tệp</div></button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {files.length === 0 && linkAttachments.length === 0 ? (<div className="text-gray-500 text-sm">Chưa có tệp hoặc liên kết nào được thêm.</div>) : (<>
                  {files.map((f, idx) => (<div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm">{f.name?.slice(0,1).toUpperCase()}</div><div className="text-sm">{f.name}</div></div><button onClick={() => removeFileAt(idx)} className="text-xs text-red-500">Xóa</button></div>))}
                  {linkAttachments.map((l, idx) => (<div key={`link-${idx}`} className="flex items-center justify-between bg-gray-50 p-2 rounded"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm">🔗</div><div className="text-sm"><a href={l.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">{l.title ?? l.url}</a></div></div><button onClick={() => removeLinkAt(idx)} className="text-xs text-red-500">Xóa</button></div>))}
                </>)}
              </div>

              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

              <button disabled={isPastDeadline(classwork.deadline) || loading} onClick={handleSubmit} className={`w-full py-2 rounded text-white ${isPastDeadline(classwork.deadline) ? "bg-gray-300" : "bg-blue-600"}`}>Đánh dấu là đã hoàn thành</button>
              <div className="text-xs text-gray-400 mt-1">{isPastDeadline(classwork.deadline) ? "Không thể nộp bài tập sau ngày đến hạn" : "Bạn có thể nộp trước hạn nộp"}</div>
            </div>
          </RightCard>

          <RightCard title="Nhận xét riêng tư">
            <div className="text-sm text-gray-700"><button className="text-blue-600">Thêm nhận xét cho {currentClass?.data?.teacher?.fullname ?? "học viên"}</button></div>
          </RightCard>
        </aside>
      </div>
    </div>
  );
};

export default ClassworkDetail;