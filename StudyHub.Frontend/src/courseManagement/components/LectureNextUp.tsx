import React from "react";
// import { useNavigate } from "react-router-dom";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import { useEnrollmentStore } from "@/courseManagement/stores/useEnrollmentStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";

const LectureNextUp: React.FC = () => {
  // const navigate = useNavigate();
  const chapters = useLectureStore((s) => s.chapters);
  const selected = useLectureStore((s) => s.selectedLesson);
  const fetchLesson = useLectureStore((s) => s.fetchLesson);
  const getLessonCompleted = useEnrollmentStore((s) => s.getLessonCompleted);
  // subscribe to progresses so component re-renders when progress data updates
  const progresses = useEnrollmentStore((s) => s.progresses);
  // reference to silence unused-var lint; we rely on the subscription side-effect
  void progresses;

  // flatten lessons order and find next after selected
  const flat: any[] = [];
  for (const ch of chapters || []) {
    for (const l of ch.lessons || [])
      flat.push({ ...l, chapterId: ch.id, courseId: ch.courseId });
  }

  let next: any | undefined;
  if (selected) {
    const idx = flat.findIndex((f) => f.id === selected.id);
    if (idx >= 0 && idx + 1 < flat.length) next = flat[idx + 1];
  } else if (flat.length > 0) {
    next = flat[0];
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tiếp theo</CardTitle>
      </CardHeader>
      <CardContent>
        {next ? (
          <div>
            <div className="font-medium">{next.name}</div>
            <div className="text-sm text-gray-500 mb-3">{next.type}</div>
            <div className="flex justify-end">
              {/** only allow going to next if current lesson is completed */}
              <button
                className={`px-3 py-1 rounded border text-sm ${
                  selected && !getLessonCompleted(selected.id)
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => {
                  // prevent navigation when current lesson not completed
                  if (selected && !getLessonCompleted(selected.id)) return;
                  try {
                    fetchLesson(next.id);
                  } catch (err) {
                    console.debug("fetchLesson failed", err);
                  }
                  location.href = `/course/student/courses/${next.courseId}/lecture/${next.id}`
                }}
                disabled={selected ? !getLessonCompleted(selected.id) : false}
                title={
                  selected && !getLessonCompleted(selected.id)
                    ? "Hoàn thành bài học hiện tại để mở bài tiếp theo"
                    : "Phát tiếp theo"
                }
              >
                Phát tiếp theo
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            Không có bài giảng nào sắp tới.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LectureNextUp;
