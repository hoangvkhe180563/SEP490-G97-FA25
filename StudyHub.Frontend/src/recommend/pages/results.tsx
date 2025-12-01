import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useRecommendStore from "../stores/useRecommendStore";
import DOMPurify from "dompurify";
import LoadingSpinner from "../components/LoadingSpinner";
import { X, Sparkles } from "lucide-react";
import RecommendationCourseList from "../components/RecommendationCourseList";
import RecommendationDocumentList from "../components/RecommendationDocumentList";

const ResultsPage: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode") || "profile";

  const fetchRecommend = useRecommendStore((s: any) => s.fetchRecommend);
  const recommendation = useRecommendStore((s: any) => s.recommendation);
  const loading = useRecommendStore((s: any) => s.loading);
  const error = useRecommendStore((s: any) => s.error);

  const llmRecommendation = useRecommendStore((s: any) => s.llmRecommendation);
  const llmLoading = useRecommendStore((s: any) => s.llmLoading);
  // const updateLlmHistoryResponse = useRecommendStore(
  //   (s: any) => s.updateLlmHistoryResponse
  // );
  const getLlmHistoryById = useRecommendStore((s: any) => s.getLlmHistoryById);

  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (mode === "profile") {
      void fetchRecommend();
      return; // early return for profile mode
    }

    // when in LLM mode with historyId, try to load the stored recommendation
    (async () => {
      if (mode !== "llm") return;
      const historyId = params.get("historyId");
      if (!historyId) return;
      try {
        setLoadingHistory(true);
        const rec = await getLlmHistoryById(Number(historyId));
        if (rec) {
          // set recommendation into zustand store so UI renders uniformly
          try {
            (useRecommendStore as any).setState({ llmRecommendation: rec });
          } catch {
            (useRecommendStore as any).getState().llmRecommendation = rec;
          }
        }
      } catch (e) {
        // ignore, store handles errors
      } finally {
        setLoadingHistory(false);
      }
    })();
    // eslint-disable-next-line
  }, [mode, fetchRecommend]);

  if (error)
    return (
      <div className="p-6 text-red-600 font-medium text-center">
        <X className="inline-block mr-2" /> Lỗi: {error}
      </div>
    );

  if (mode === "profile") {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner label="Đang phân tích dữ liệu của bạn..." />
        </div>
      );
    }

    if (!recommendation)
      return (
        <div className="p-6 text-center text-slate-500 dark:text-slate-300">
          Không có đề xuất nào phù hợp.
        </div>
      );

    return (
      <div className="relative py-12 max-h-screen overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 opacity-90 pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 dark:opacity-6 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-white/30 dark:border-slate-700 rounded-3xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-semibold">Kết quả đề xuất</h1>
              <div className="inline-flex items-center gap-3 text-sm text-slate-600">
                <Sparkles className="text-indigo-500" /> Đề xuất cá nhân hoá
              </div>
            </div>

            <RecommendationCourseList courses={recommendation.courses} />
            <RecommendationDocumentList documents={recommendation.documents} />
          </div>
        </div>
      </div>
    );
  }

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
    <div className="relative py-12 max-h-screen overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 opacity-90 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 dark:opacity-6 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-white/30 dark:border-slate-700 rounded-3xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold">Kết quả đề xuất (AI)</h1>
            <div className="inline-flex items-center gap-3 text-sm text-slate-600">
              <Sparkles className="text-indigo-500" /> Đề xuất AI
            </div>
          </div>
          {/* LLM chat history is not editable on this page; the stored recommendation (if any) is shown below. */}
          {llmRecommendation.courseExplanation && (
            <div className="mb-6 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <h2 className="font-semibold mb-2">Lý giải tổng quan</h2>
              <div
                className="prose prose-sm dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    llmRecommendation.courseExplanation.replace(/\n/g, "<br/>")
                  ),
                }}
              />
            </div>
          )}

          <RecommendationCourseList
            courses={llmRecommendation.courseRecommendations}
            improveSubjects={llmRecommendation.profile?.subject ?? []}
          />

          {llmRecommendation.documentExplanation && (
            <div className="my-6 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
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
          />
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
