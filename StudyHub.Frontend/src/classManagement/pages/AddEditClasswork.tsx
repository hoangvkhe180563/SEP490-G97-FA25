import React, { useState, useEffect } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { mapToCoarseRole } from "@/classManagement/utils/roleutil";
import type { ClassInfo } from "@/classManagement/interfaces/class";
import type { UserRole } from "@/classManagement/components/ui/classcard";
import { axiosInstance } from "@/lib/axios";

/* This component creates/edits a "classwork" by calling the unified ClassNotification API.
   For creation we POST multipart/form-data to /ClassNotification with fields matching
   CreateNotificationDto (Type = "classwork", Deadline, MaxScore, GradeType, AllowSubmission, InstructionsHtml).
   For editing we fall back to the legacy /api/Classwork/{id} PUT route (keeps backward compatibility).
*/

const AddEditClassworkForm: React.FC = () => {
  const params = useParams<{ id?: string; classworkId?: string }>();
  const id = params.id ?? "";

  const { user } = useAuthStore();
  const coarseRole = mapToCoarseRole(user?.roles);
  const role: UserRole = coarseRole === "student" ? "student" : "teacher";

  const isEdit = !!params.classworkId;
  const {
    createClasswork,
    editClasswork,
    getClassWorks,
    getClassInfo,
    currentClass,
    getSubmissionByUserAndClasswork,
  } = useClassStore();
  const navigate = useNavigate();

  // form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructionsHtml, setInstructionsHtml] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxScore, setMaxScore] = useState<number | "">("");
  const [gradeType, setGradeType] = useState<string>("points");
  const [allowSubmission, setAllowSubmission] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);

  // only teachers allowed to access this page (check auth-derived role)
  useEffect(() => {
    if (role !== "teacher") {
      navigate(`/class/${role}/${id}`);
    }
  }, [role, id, navigate]);

  // when editing, prefill fields from store.currentClass.works if present
  useEffect(() => {
    if (isEdit && params.classworkId && currentClass?.data?.works) {
      const cw = currentClass.data.works.find((w) => String(w.id) === String(params.classworkId));
      if (cw) {
        setTitle(cw.title ?? "");
        setDescription(cw.description ?? "");
        // instructionsHtml may be stored in instructionsHtml or same as description
        setInstructionsHtml((cw as any).instructionsHtml ?? cw.description ?? "");
        if (cw.deadline) {
          const d = new Date(cw.deadline);
          const tzOffset = d.getTimezoneOffset() * 60000;
          const localISO = new Date(d.getTime() - tzOffset).toISOString().slice(0, -1);
          setDeadline(localISO.slice(0, 16));
        } else {
          setDeadline("");
        }
        setMaxScore((cw as any).maxScore ?? (cw as any).max_score ?? "");
        setGradeType((cw as any).gradeType ?? "points");
        setAllowSubmission((cw as any).allowSubmission ?? true);
      }
    }
  }, [isEdit, params.classworkId, currentClass?.data?.works]);

  useEffect(() => {
    if (id) getClassInfo(Number(id));
  }, [id, getClassInfo]);

  const handleCancel = () => navigate(`/class/${role}/${id}?tab=exercise`);

  // Helper to post FormData to /ClassNotification (create)
  const postCreateNotification = async (fd: FormData) => {
    const endpoints = ["/ClassNotification", "/api/ClassNotification"];
    let lastError: any = null;
    for (const ep of endpoints) {
      try {
        // Let browser set the multipart Content-Type with boundary
        const res = await axiosInstance.post(ep, fd);
        return res;
      } catch (err: any) {
        lastError = err;
        if (err?.response?.status === 404) continue;
        // on other errors break and surface the server response
        if (err?.response) break;
      }
    }
    throw lastError ?? new Error("Failed to call create notification endpoint");
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);

    try {
      // basic validation
      if (!title || title.trim().length === 0) {
        alert("Tiêu đề không được để trống");
        return;
      }
      if (!id || Number(id) <= 0) {
        alert("ClassId không hợp lệ");
        return;
      }

      const createdBy = user?.id ?? (localStorage.getItem("currentUserId") ?? "");
      if (!createdBy) {
        alert("Thiếu thông tin người dùng");
        return;
      }

      // If editing -> try legacy edit route for classwork (keeps compatibility)
      if (isEdit && params.classworkId) {
        // Attempt to call unified notification edit if available, otherwise fallback to /api/Classwork/{id}
        // We'll call /api/Classwork/{id} with JSON body that contains extended fields.
        const putBody: any = {
          classId: Number(id),
          title: title.trim(),
          description: description?.trim() ?? "",
          deadline: deadline ? new Date(deadline).toISOString() : null,
          maxScore: maxScore === "" ? null : Number(maxScore),
          gradeType: gradeType ?? null,
          allowSubmission: !!allowSubmission,
          instructionsHtml: instructionsHtml ?? null,
        };

        // Try a few endpoints: /api/ClassNotification/{id} (if server supports PUT), then /api/Classwork/{id}
        const putEndpoints = [
          `/api/ClassNotification/${encodeURIComponent(params.classworkId)}`,
          `/ClassNotification/${encodeURIComponent(params.classworkId)}`,
          `/api/Classwork/${encodeURIComponent(params.classworkId)}`,
          `/Classwork/${encodeURIComponent(params.classworkId)}`,
        ];

        let putRes: any = null;
        let lastPutErr: any = null;
        for (const ep of putEndpoints) {
          try {
            putRes = await axiosInstance.put(ep, putBody, { headers: { "Content-Type": "application/json" } });
            break;
          } catch (err: any) {
            lastPutErr = err;
            if (err?.response?.status === 404) continue;
            if (err?.response) break;
          }
        }

        if (!putRes) {
          const msg = lastPutErr?.response?.data?.message ?? lastPutErr?.message ?? "Không thể cập nhật bài tập";
          alert(msg);
        } else {
          // Refresh classworks and class info then navigate back
          await getClassWorks(Number(id));
          await getClassInfo(Number(id));
          navigate(`/class/${role}/${id}?tab=exercise`);
        }
        return;
      }

      // Create new classwork -> actually create a ClassNotification with Type = "classwork"
      const fd = new FormData();
      fd.append("ClassId", String(Number(id)));
      fd.append("Type", "classwork");
      fd.append("Title", title.trim());
      fd.append("Description", description?.trim() ?? "");
      fd.append("CreatedBy", createdBy);
      // optional fields
      if (deadline) fd.append("Deadline", new Date(deadline).toISOString());
      if (maxScore !== "") fd.append("MaxScore", String(maxScore));
      if (gradeType) fd.append("GradeType", gradeType);
      fd.append("AllowSubmission", String(allowSubmission));
      if (instructionsHtml) fd.append("InstructionsHtml", instructionsHtml);

      // (Files and Links are optional - this form doesn't include file picker UI now,
      // but code supports them if you later add file inputs)
      // Example: fd.append("Files", fileObj, fileObj.name);
      // For Links, send LinksJson
      // If you had link attachments in UI, you'd append:
      // fd.append("LinksJson", JSON.stringify(linksArray));

      // Send to create endpoint (controller will upload files if any and persist file records)
      const res = await postCreateNotification(fd);
      const raw = res?.data ?? null;
      if (!raw || raw.success === false) {
        const msg = raw?.message ?? "Tạo thông báo thất bại";
        alert(msg);
        return;
      }

      // Refresh store data and navigate back to class exercise tab
      await getClassWorks(Number(id));
      await getClassInfo(Number(id));
      navigate(`/class/${role}/${id}?tab=exercise`);
    } catch (err: any) {
      console.error("Save error", err);
      const msg = err?.response?.data?.message ?? err?.message ?? "Lỗi khi lưu bài tập";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const classInfo: ClassInfo | null = currentClass?.data?.classInfo ?? null;

  return (
    <div className="p-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 rounded-full hover:bg-slate-100 text-lg">←</button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">📝</div>
            <div>
              <div className="text-lg font-semibold">Bài tập</div>
              <div className="text-sm text-slate-500">{isEdit ? "Chỉnh sửa bài tập" : "Tạo bài tập mới"}</div>
            </div>
          </div>
        </div>
        <div>
          <button onClick={() => handleSave()} disabled={loading} className="bg-blue-600 text-white px-5 py-3 rounded-lg text-lg">
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white border rounded-xl p-6 mb-4">
            <div className="mb-2 text-sm text-slate-600">Tiêu đề*</div>
            <input
              className="w-full border-b pb-3 mb-4 text-2xl outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề"
            />

            <div className="mb-2 text-sm text-slate-600">Hướng dẫn (không bắt buộc)</div>
            <textarea
              className="w-full border rounded p-4 min-h-[220px] mb-4 text-base"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả ngắn cho học viên..."
            />

            <div className="rounded-lg border p-5">
              <div className="text-md font-semibold mb-4">Đính kèm</div>
              <div className="flex gap-6">
                <button className="px-4 py-2 bg-slate-100 rounded-lg" disabled>
                  Thêm tệp (chưa triển khai UI)
                </button>
                <button className="px-4 py-2 bg-slate-100 rounded-lg" disabled>
                  Thêm liên kết (chưa triển khai UI)
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="col-span-12 lg:col-span-4">
          {/* Sidebar: assignment-specific fields */}
          <div className="bg-white border rounded-xl p-5 space-y-4">
            <div>
              <div className="text-sm font-semibold mb-2">Hạn nộp</div>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">Điểm tối đa</div>
              <input
                type="number"
                value={maxScore}
                onChange={(e) => {
                  const v = e.target.value;
                  setMaxScore(v === "" ? "" : Number(v));
                }}
                className="w-full border rounded px-3 py-2"
                placeholder="Ví dụ: 100"
                min={0}
              />
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">Loại điểm</div>
              <select value={gradeType} onChange={(e) => setGradeType(e.target.value)} className="w-full border rounded px-3 py-2">
                <option value="points">Points</option>
                <option value="percentage">Percentage</option>
                <option value="pass_fail">Pass / Fail</option>
                <option value="letter">Letter</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input id="allowSubmit" type="checkbox" checked={allowSubmission} onChange={(e) => setAllowSubmission(e.target.checked)} />
              <label htmlFor="allowSubmit" className="text-sm">Cho phép nộp bài</label>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">Hướng dẫn chi tiết (HTML)</div>
              <textarea
                value={instructionsHtml}
                onChange={(e) => setInstructionsHtml(e.target.value)}
                className="w-full border rounded px-3 py-2 min-h-[120px]"
                placeholder="Hướng dẫn chi tiết (HTML hoặc plain text)"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AddEditClassworkForm;