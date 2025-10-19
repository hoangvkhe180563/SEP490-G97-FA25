import React from "react";
import { useNavigate } from "react-router-dom";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";

const LectureNextUp: React.FC = () => {
  const navigate = useNavigate();
  const chapters = useLectureStore((s) => s.chapters);
  const selected = useLectureStore((s) => s.selectedLesson);
  const fetchLesson = useLectureStore((s) => s.fetchLesson);

  // flatten lessons order and find next after selected
  const flat: any[] = [];
  for (const ch of chapters || []) {
    for (const l of ch.lessons || []) flat.push({ ...l, chapterId: ch.id });
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
        <CardTitle>Next Up</CardTitle>
      </CardHeader>
      <CardContent>
        {next ? (
          <div>
            <div className="font-medium">{next.name}</div>
            <div className="text-sm text-gray-500 mb-3">{next.type}</div>
            <div className="flex justify-end">
              <button
                className="px-3 py-1 rounded border text-sm"
                onClick={() => {
                  try {
                    fetchLesson(next.id);
                  } catch (err) {
                    console.debug("fetchLesson failed", err);
                  }
                  navigate(
                    `/courses/${next.courseId ?? ""}/lecture/${next.id}`
                  );
                }}
              >
                Play next
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            No upcoming lectures are scheduled.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LectureNextUp;
