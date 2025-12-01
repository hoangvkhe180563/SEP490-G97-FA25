import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useRecommendStore from "../stores/useRecommendStore";
import LlmSidebar from "../components/LlmSidebar";
import DOMPurify from "dompurify";
import LoadingSpinner from "../components/LoadingSpinner";
import { X, Sparkles } from "lucide-react";
import RecommendationCourseList from "../components/RecommendationCourseList";
import RecommendationDocumentList from "../components/RecommendationDocumentList";

const LlmResultPage: React.FC = () => {
  const { historyId } = useParams<{ historyId: string }>();
  const getLlmHistoryById = useRecommendStore((s: any) => s.getLlmHistoryById);
  const llmRecommendation = useRecommendStore((s: any) => s.llmRecommendation);
  const llmLoading = useRecommendStore((s: any) => s.llmLoading);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const error = useRecommendStore((s: any) => s.error);

  useEffect(() => {
    (async () => {
      if (!historyId) return;
      try {
        setLoadingHistory(true);
        const rec = await getLlmHistoryById(Number(historyId));
        console.log("Loaded LLM history", rec);
        if (rec) {
          try {
            (useRecommendStore as any).setState({ llmRecommendation: rec });
          } catch {
            (useRecommendStore as any).getState().llmRecommendation = rec;
          }
        }
      } catch (e) {
        // ignore: store sets error
      } finally {
        setLoadingHistory(false);
      }
    })();
    // eslint-disable-next-line
  }, [historyId]);

  if (error)
    return (
      <div className="p-6 text-red-600 font-medium text-center">
        <X className="inline-block mr-2" /> Lỗi: {error}
      </div>
    );

  if (llmLoading || loadingHistory)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner label="AI đang phân tích văn bản của bạn..." />
      </div>
    );

  if (!llmRecommendation)
    return (
      <div className="p-6">
        Chưa có kết quả LLM. Hãy quay lại và nhập mô tả.
      </div>
    );

  return (
    <div className="relative max-h-screen overflow-y-auto p-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="max-w-full grid grid-cols-[20rem_1fr] gap-6">
        <LlmSidebar />

        <div className="relative">
          {/* Dot grid (Linear style) */}
          <div
            className="absolute inset-0 opacity-[0.2] dark:opacity-[0.15]
          bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.20)_1px,transparent_0)] 
          bg-[size:22px_22px]"
          />
          {/* Aurora glow */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 
                      w-[900px] h-[350px] blur-3xl 
                      bg-purple-300/20 dark:bg-purple-600/20 rounded-full"
          />
          <div
            className="absolute bottom-10 right-20 
                      w-[400px] h-[240px] blur-3xl 
                      bg-indigo-300/20 dark:bg-indigo-800/20 rounded-full"
          />
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-white/30 dark:border-slate-700 rounded-3xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-semibold">Kết quả đề xuất (AI)</h1>
              <div className="inline-flex items-center gap-3 text-sm text-slate-600">
                <Sparkles className="text-indigo-500" /> Đề xuất AI
              </div>
            </div>

            {llmRecommendation.courseExplanation && (
              <div className="mb-6 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                <h2 className="font-semibold mb-2">Lý giải khoá học</h2>
                <div
                  className="prose prose-sm dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      llmRecommendation.courseExplanation.replace(
                        /\n/g,
                        "<br/>"
                      )
                    ),
                  }}
                />
              </div>
            )}

            <RecommendationCourseList
              courses={llmRecommendation.courseRecommendations}
              improveSubjects={llmRecommendation.profile?.subject ?? []}
              size="small"
            />

            {llmRecommendation.documentExplanation && (
              <div className="mb-6 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                <h2 className="font-semibold mb-2">
                  Lý giải cho tài liệu được đề xuất
                </h2>
                <div
                  className="prose prose-sm dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      llmRecommendation.documentExplanation.replace(
                        /\n/g,
                        "<br/>"
                      )
                    ),
                  }}
                />
              </div>
            )}

            <RecommendationDocumentList
              documents={llmRecommendation.documentRecommendations}
              improveSubjects={llmRecommendation.profile?.subject ?? []}
              size="small"
            />
          </div>
          ;
        </div>
      </div>
    </div>
  );
};

export default LlmResultPage;
