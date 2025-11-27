import React from "react";
import type { DocumentRecommendation } from "../interfaces/recommend";
import {
  FileText,
  Tag,
  CalendarDays,
  Clock,
  Star,
  Bookmark,
} from "lucide-react";
import DOMPurify from "dompurify";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/common/components/ui/tooltip";
import { Button } from "@/common/components/ui/button";
import { formatDate } from "@/user/utils/dateUtils";
import { Link, useNavigate } from "react-router-dom";

const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <span
    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${className}`}
  >
    {children}
  </span>
);

function translateLength(val?: string) {
  if (!val) return "Không xác định";
  const v = String(val).toLowerCase();
  if (v.includes("short") || v.includes("ngắn")) return "Ngắn";
  if (v.includes("medium") || v.includes("trung")) return "Trung bình";
  if (v.includes("long") || v.includes("dài")) return "Dài";
  return val;
}

function translateDocumentLevel(val?: string) {
  if (!val) return "Không xác định";
  const v = String(val).toLowerCase();
  if (
    v.includes("basic") ||
    v.includes("beginner") ||
    v.includes("cơ bản") ||
    v.includes("easy")
  )
    return "Cơ bản";
  if (v.includes("intermediate") || v.includes("trung") || v.includes("medium"))
    return "Trung cấp";
  if (
    v.includes("advanced") ||
    v.includes("cao") ||
    v.includes("nâng cao") ||
    v.includes("hard")
  )
    return "Nâng cao";
  return val;
}

function difficultyBadgeClass(val?: string) {
  const v = String(val ?? "").toLowerCase();
  if (
    v.includes("beginner") ||
    v.includes("basic") ||
    v.includes("cơ bản") ||
    v.includes("easy")
  )
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (v.includes("intermediate") || v.includes("trung") || v.includes("medium"))
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  if (
    v.includes("advanced") ||
    v.includes("cao") ||
    v.includes("nâng cao") ||
    v.includes("hard")
  )
    return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
  return "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
}

function lengthBadgeClass(val?: string) {
  const v = String(val ?? "").toLowerCase();
  if (v.includes("short") || v.includes("ngắn"))
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (v.includes("medium") || v.includes("trung"))
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  if (v.includes("long") || v.includes("dài"))
    return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
  return "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
}

const DocumentCard: React.FC<{ doc: DocumentRecommendation }> = ({ doc }) => {
  const navigate = useNavigate();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group relative" tabIndex={0}>
            <article
              onClick={() => {
                try {
                  navigate(`/document/student/details/${doc.id}`);
                } catch {
                  /* ignore */
                }
              }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transform hover:-translate-y-1 overflow-hidden"
            >
              {/* Category badge (top-right) */}
              {doc.documentCategoryName && (
                <div className="absolute right-3 top-3 z-10">
                  <Badge
                    className={`${difficultyBadgeClass(
                      doc.documentCategoryName
                    )} px-3 py-1 text-sm font-semibold shadow-xl ring-1 ring-white/20 dark:ring-black/20 backdrop-blur-sm`}
                  >
                    <Bookmark size={16} /> {doc.documentCategoryName}
                  </Badge>
                </div>
              )}
              {/* Top thumbnail */}
              {doc.thumbnail ? (
                <img
                  src={doc.thumbnail}
                  alt={doc.title ?? "doc"}
                  className="w-full h-44 object-cover"
                />
              ) : (
                <div className="w-full h-44 bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                  <FileText size={48} />
                </div>
              )}

              <div className="p-5">
                <h3 className="text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100">
                  {doc.title ?? doc.name}
                </h3>
                <div className="mt-2">
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {doc.subject ?? doc.subjectName} • Lớp {doc.grade}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 mt-2">
                  <div className="inline-flex items-center gap-2">
                    <Badge className={difficultyBadgeClass(doc.documentLevel)}>
                      <Star size={14} />{" "}
                      {translateDocumentLevel(doc.documentLevel)}
                    </Badge>
                    <Badge className={lengthBadgeClass(doc.documentLengthType)}>
                      <Clock size={14} />{" "}
                      {translateLength(doc.documentLengthType)}
                    </Badge>
                    <Badge
                      className={lengthBadgeClass(doc.grade?.toLocaleString())}
                    >
                      <Tag size={14} /> {`Lớp ${doc.grade}`}
                    </Badge>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <div>
                    Cập nhật gần đây:{" "}
                    {doc.updatedAt ? formatDate(doc.updatedAt) : "—"}
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  {doc.documentUrl && (
                    <Link to={`/document/student/details/${doc.id}`}>
                      <Button
                        variant="ghost"
                        className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-300"
                      >
                        <FileText size={16} /> Mở tài liệu
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </article>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-md p-4 text-sm sm:text-base leading-relaxed bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-lg"
        >
          <div className="font-semibold text-slate-900 dark:text-slate-100 text-base">
            {doc.title ?? doc.name}
          </div>
          {doc.description && (
            <div
              className="mt-2 text-slate-700 dark:text-slate-300 text-sm sm:text-base"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(doc.description),
              }}
            />
          )}
          <div className="mt-3 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-2">
              <Badge className={lengthBadgeClass(doc.documentLengthType)}>
                <Clock size={14} /> {translateLength(doc.documentLengthType)}
              </Badge>
            </span>
            <span className="inline-flex items-center gap-2">
              <Badge className={difficultyBadgeClass(doc.documentLevel)}>
                <Star size={14} /> {translateDocumentLevel(doc.documentLevel)}
              </Badge>
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const RecommendationDocumentList: React.FC<{
  documents?: DocumentRecommendation[];
  improveSubjects?: string[];
}> = ({ documents = [], improveSubjects = [] }) => {
  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Gợi ý tài liệu</h2>
            <div className="text-sm text-slate-500">
              {documents.length} kết quả
            </div>
          </div>

          {improveSubjects.length > 0 && (
            <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-full text-sm">
              <Tag size={16} />
              <div>
                Cần cải thiện:{" "}
                <strong className="ml-1">
                  {improveSubjects.slice(0, 3).join(", ")}
                  {improveSubjects.length > 3 ? "..." : ""}
                </strong>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((d) => (
            <DocumentCard key={String(d.id)} doc={d} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default RecommendationDocumentList;
