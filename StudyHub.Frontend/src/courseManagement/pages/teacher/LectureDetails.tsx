import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import { Button } from "@/common/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { ArrowLeft, Play, Download, Bookmark } from "lucide-react";

const LectureDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const lid = Number(id || 0);

  const selectedLesson = useLectureStore((s: any) => s.selectedLesson);
  const fetchLesson = useLectureStore((s: any) => s.fetchLesson);

  useEffect(() => {
    if (lid) fetchLesson(lid);
  }, [lid, fetchLesson]);

  const l = selectedLesson;

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1100px] mx-auto px-6 py-6">
        {/* === Breadcrumb === */}
        <div className="text-sm text-[#525252] mb-3">
          Courses / Lecture / {l?.name ?? "Loading..."}
        </div>

        {/* === Header === */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 text-[#525252]" />
            </button>

            <div>
              <h1 className="text-2xl font-semibold text-[#171717]">
                {l?.name ?? "Lecture"}
              </h1>
              <p className="text-sm text-[#525252]">
                {l?.type ?? ""} • {l?.teacherName ?? "Unknown Teacher"} •{" "}
                {l?.postDate
                  ? new Date(l.postDate).toLocaleDateString()
                  : "No post date"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {l?.videoUrl && (
              <Button variant="outline">
                <Play className="w-4 h-4 mr-2" /> Play
              </Button>
            )}
            {l?.fileUrl && (
              <Button variant="outline" asChild>
                <a href={l.fileUrl} download>
                  <Download className="w-4 h-4 mr-2" /> Download File
                </a>
              </Button>
            )}
            <Button variant="outline">
              <Bookmark className="w-4 h-4 mr-2" /> Bookmark
            </Button>
          </div>
        </div>

        {/* === MAIN CONTENT === */}
        <div
          className="bg-black rounded-lg overflow-hidden flex justify-center items-center"
          style={{ aspectRatio: "16/9" }}
        >
          {l?.type === "Video" && l?.videoUrl ? (
            <iframe
              src={l.videoUrl}
              title={l.name}
              className="w-full h-full"
              allowFullScreen
            />
          ) : l?.type === "Đọc" && l?.readingContent ? (
            <div className="bg-[#fafafa] w-full h-full flex justify-center items-start overflow-y-auto p-8">
              <div className="bg-white shadow-lg rounded-lg w-full max-w-[800px] p-8 leading-relaxed text-[#1f1f1f] text-[15px] tracking-[0.015em] font-[400] prose prose-sm prose-slate overflow-y-auto max-h-full">
                <div className="whitespace-pre-wrap">{l.readingContent}</div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-2xl">
              No content available for this lecture.
            </div>
          )}
        </div>

        {/* === DESCRIPTION === */}
        {l?.description && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#404040] leading-relaxed whitespace-pre-line">
                  {l.description}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default LectureDetails;
