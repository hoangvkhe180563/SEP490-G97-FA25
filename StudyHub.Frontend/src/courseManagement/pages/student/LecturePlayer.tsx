import React, { useEffect } from "react";
import LectureResources from "@/courseManagement/components/LectureResources";
import LectureDiscussion from "@/courseManagement/components/LectureDiscussion";
import LectureNextUp from "@/courseManagement/components/LectureNextUp";
import { Button } from "@/common/components/ui/button";
import LectureFilters from "@/courseManagement/components/LectureFilters";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import { useParams } from "react-router-dom";

const LecturePlayer: React.FC = () => {
  const { lessonId, courseId } = useParams();
  const lid = Number(lessonId || 0);
  const cid = Number(courseId || 0);

  const { selectedLesson, fetchChapters, fetchLesson } = useLectureStore(
    (s: any) => ({
      selectedLesson: s.selectedLesson,
      fetchChapters: s.fetchChapters,
      fetchLesson: s.fetchLesson,
    })
  );

  useEffect(() => {
    if (cid) fetchChapters(cid);
    if (lid) fetchLesson(lid);
  }, [cid, lid, fetchChapters, fetchLesson]);

  return (
    <div className="w-full bg-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-3">
            <LectureFilters />
          </aside>

          <main className="col-span-12 lg:col-span-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm text-gray-500 mb-2">
                  My Courses / Course
                </div>
                <div className="text-lg font-medium">
                  {selectedLesson?.name ?? "Lecture"}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {selectedLesson?.type ?? ""}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="border rounded px-3 py-1 text-sm">
                  Save
                </button>
                <button className="border rounded px-3 py-1 text-sm">
                  Share
                </button>
              </div>
            </div>

            <div className="bg-black h-[420px] rounded mb-4 flex items-center justify-center text-white">
              <div className="text-3xl">▶</div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <Button className="bg-black text-white">Play</Button>
              <Button variant="outline">Download</Button>
              <Button variant="outline">Bookmark</Button>
            </div>

            <div className="bg-white border rounded p-4">
              <h4 className="font-medium mb-2">Lecture Transcript</h4>
              <div className="max-h-48 overflow-auto text-sm text-gray-700">
                <p>{selectedLesson?.content ?? "No transcript available."}</p>
              </div>
            </div>
          </main>

          <aside className="col-span-12 lg:col-span-3 space-y-4">
            <LectureResources />
            <LectureDiscussion />
            <LectureNextUp />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default LecturePlayer;
