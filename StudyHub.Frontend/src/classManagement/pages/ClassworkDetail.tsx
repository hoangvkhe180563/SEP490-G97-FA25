import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import type {
  ClassWork,
  ClassworkSubmission,
} from "@/classManagement/interfaces/class";

const AvatarIcon: React.FC = () => (
  <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white text-xl shadow">
    📝
  </div>
);

const RightCard: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow p-4 mb-4">
    <div className="text-sm font-medium mb-2">{title}</div>
    <div>{children}</div>
  </div>
);

const ClassworkDetail: React.FC = () => {
  const { classworkId, id } = useParams<{ classworkId?: string; id?: string }>();
  const {
    getClassWorks,
    submitClasswork,
    getClassworkSubmissions,
    getClassInfo,
    currentClass,
  } = useClassStore();

  const [classwork, setClasswork] = useState<ClassWork | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [submissions, setSubmissions] = useState<ClassworkSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    getClassInfo(Number(id));
    getClassWorks(Number(id)).then((works) => {
      const cw = works?.find((w) => String(w.id) === String(classworkId));
      setClasswork(cw ?? null);
    });
    if (classworkId) {
      getClassworkSubmissions(Number(classworkId)).then((data) =>
        setSubmissions(data ?? [])
      );
    }
  }, [id, classworkId, getClassWorks, getClassworkSubmissions, getClassInfo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files ?? []));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classworkId) return;
    setLoading(true);
    try {
      const appUserId = localStorage.getItem("currentUserId") ?? "";
      await submitClasswork(Number(classworkId), appUserId, files);
      setFiles([]);
      const updated = await getClassworkSubmissions(Number(classworkId));
      setSubmissions(updated ?? []);
    } catch (err) {
      console.error("Submit error", err);
    } finally {
      setLoading(false);
    }
  };

  const classInfo = currentClass?.data?.classInfo ?? null;

  // helper: format deadline to "Đến hạn 30 thg 10" similar feel
  const formatDeadlineShort = (iso?: string | null) => {
    if (!iso) return "Không xác định";
    const d = new Date(iso);
    const day = d.getDate();
    const monthNames = [
      "thg 1",
      "thg 2",
      "thg 3",
      "thg 4",
      "thg 5",
      "thg 6",
      "thg 7",
      "thg 8",
      "thg 9",
      "thg 10",
      "thg 11",
      "thg 12",
    ];
    const month = monthNames[d.getMonth()];
    return `Đến hạn ${day} ${month}`;
  };

  const isPastDeadline = (iso?: string | null) => {
    if (!iso) return false;
    try {
      return new Date() > new Date(iso);
    } catch {
      return false;
    }
  };

  if (!classwork) {
    return (
      <div className="p-6">
        <div className="text-gray-500">Đang tải thông tin bài tập...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Main header like Google Classroom */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <AvatarIcon />
          <div>
            <h1 className="text-2xl font-semibold">{classwork.title}</h1>
            <div className="text-sm text-gray-500 mt-1">
              {/** author placeholder: use currentClass.createdBy if available */}
              {currentClass?.data?.classInfo ? (
                <>
                  {currentClass.data.classInfo?.name ? (
                    <span className="mr-2">{/* class name shown if desired */}</span>
                  ) : null}
                </>
              ) : null}
              <span>Chu Quoc Khanh Chung • 04:10</span>
            </div>
            <div className="mt-3 text-sm text-gray-700">100 điểm</div>
          </div>
        </div>

        <div className="text-sm text-gray-600">{formatDeadlineShort(classwork.deadline)}</div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* left column: content */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white border rounded-lg p-6">
            <div className="text-gray-700 mb-4">{classwork.description || "Không có mô tả"}</div>

            <hr className="my-4" />

            {/* Class comments / feedback placeholder */}
            <div className="flex items-center gap-3 text-gray-700 mb-2">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <div className="font-medium">Nhận xét của lớp học</div>
            </div>
            <div>
              <button className="text-blue-600">Thêm nhận xét về lớp học</button>
            </div>
          </div>
        </div>

        {/* right column: actions like Google Classroom */}
        <aside className="col-span-12 lg:col-span-4">
          <RightCard title="Bài tập của bạn">
            <div className="flex flex-col gap-3">
              <button
                className="w-full border rounded-full py-2 text-sm flex items-center justify-center gap-2"
                onClick={() => {
                  /* open add/create UI: for now navigate to add page */
                  navigate(`/class/${id}/classwork/add`);
                }}
              >
                <span className="text-lg">+</span> Thêm hoặc tạo
              </button>

              <button
                disabled={isPastDeadline(classwork.deadline)}
                className={`w-full py-2 rounded text-white ${
                  isPastDeadline(classwork.deadline) ? "bg-gray-300" : "bg-blue-600"
                }`}
                onClick={() => {
                  // mark as done mock
                  alert("Đánh dấu là đã hoàn thành (demo)");
                }}
              >
                Đánh dấu là đã hoàn thành
              </button>

              <div className="text-xs text-gray-400 mt-1">
                {isPastDeadline(classwork.deadline)
                  ? "Không thể nộp bài tập sau ngày đến hạn"
                  : "Bạn có thể nộp trước hạn nộp"}
              </div>
            </div>
          </RightCard>

          <RightCard title="Nhận xét riêng tư">
            <div className="text-sm text-gray-700">
              <button className="text-blue-600">Thêm nhận xét cho Chu Quoc Khanh Chung</button>
            </div>
          </RightCard>
        </aside>
      </div>
    </div>
  );
};

export default ClassworkDetail;