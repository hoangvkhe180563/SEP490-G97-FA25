import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import type { ChapterListDto, LessonListDto } from "../types/api";

const LectureFilters: React.FC = () => {
  const { courseId } = useParams();
  const cid = Number(courseId || 0);

  const chapters = useLectureStore((s) => s.chapters as ChapterListDto[]);
  const fetchChapters = useLectureStore((s) => s.fetchChapters);
  const selectedLesson = useLectureStore(
    (s) => s.selectedLesson as LessonListDto | undefined
  );
  const fetchLesson = useLectureStore((s) => s.fetchLesson);

  const navigate = useNavigate();
  const [openChapters, setOpenChapters] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (cid) fetchChapters(cid);
  }, [cid, fetchChapters]);

  const toggleChapter = (id: number) => {
    setOpenChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow border border-gray-100">
        <div className="text-sm font-medium text-gray-800">
          Advanced Mathematics
        </div>
        <div className="text-xs text-gray-500 mt-2">Progress: 65%</div>
        <div className="w-full bg-gray-100 h-2 rounded mt-3 overflow-hidden">
          <div className="bg-black h-2 w-2/3 rounded" />
        </div>
      </div>

      {chapters.map((ch) => {
        const isOpen = !!openChapters[ch.id];
        return (
          <div
            key={ch.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm transition-all"
          >
            <button
              aria-expanded={isOpen}
              onClick={() => toggleChapter(ch.id)}
              className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 rounded-t-2xl"
            >
              <div className="text-sm font-semibold text-gray-800">
                {ch.name}
              </div>
              <div className="text-gray-400">{isOpen ? "▾" : "▸"}</div>
            </button>

            {isOpen && ch.lessons?.length > 0 && (
              <div className="p-3 space-y-1 border-t border-gray-100">
                {ch.lessons.map((l) => {
                  const isActive = selectedLesson?.id === l.id;
                  return (
                    <div
                      key={l.id}
                      onClick={() => {
                        try {
                          fetchLesson(l.id);
                        } catch (err) {
                          console.debug("fetchLesson failed", err);
                        }
                        navigate(
                          `/course/student/courses/${cid}/lecture/${l.id}`
                        );
                      }}
                      className={`flex items-center justify-between text-sm rounded-lg p-2 cursor-pointer transition-all ${
                        isActive
                          ? "bg-black text-white shadow-sm"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${
                            isActive
                              ? "bg-white text-black border-black"
                              : l.isPreview && l.id !== ch.lessons?.[0]?.id
                              ? "bg-black text-white border-black"
                              : "bg-white text-gray-400 border-gray-300"
                          }`}
                        >
                          ●
                        </div>

                        <div className={`${isActive ? "font-semibold" : ""}`}>
                          {l.name}
                        </div>
                      </div>
                      <div
                        className={`text-xs ${
                          isActive ? "text-gray-200" : "text-gray-500"
                        }`}
                      >
                        {l.type}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LectureFilters;
