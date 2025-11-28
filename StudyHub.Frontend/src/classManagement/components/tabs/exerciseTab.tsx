/* eslint-disable @typescript-eslint/no-unused-expressions */
import React, { useMemo, useState } from "react";
import { Button } from "@/common/components/ui/button";
import { Card } from "@/common/components/ui/card";
import type { ClassWork } from "@/classManagement/interfaces/class";
import { isPastDeadline } from "@/classManagement/utils/dateutil";

type Props = {
  works: ClassWork[];
  role: "teacher" | "student";
  onOpenWork: (workId: number) => void;
  onAddWork?: () => void;
  fetchCountsForWork?: (workId: number) => Promise<void>;
  submissionCounts?: Record<number, number | null>;
  memberCounts?: Record<number, number | null>;
  navigateToEdit?: (workId: number) => void;
};

const normalizeFiles = (rawFiles: any[], workId: number) => {
  console.debug("[ExerciseTab] normalizeFiles called for workId:", workId, "rawFiles:", rawFiles);
  if (!Array.isArray(rawFiles)) return [];
  const normalized = rawFiles.map((f: any, idx: number) => ({
    id: f.id ?? `${workId}-file-${idx}`,
    fileName: f.fileName ?? f.name ?? f.title ?? f.file_name ?? "",
    fileUrl: f.fileUrl ?? f.url ?? f.file_url ?? f.documentUrl ?? "",
    thumbnail: f.thumbnail ?? f.thumb ?? undefined,
    fileType: (f.fileType ?? f.contentType ?? "").toString().toLowerCase(),
    raw: f,
  }));
  console.debug("[ExerciseTab] normalizeFiles result for workId:", workId, normalized);
  return normalized;
};

const isImageExt = (nameOrUrl?: string) => {
  if (!nameOrUrl) return false;
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(nameOrUrl) || /jpg|jpeg|png|gif|webp|bmp|svg/i.test(nameOrUrl.split(".").pop() || "");
};

const isPdfExt = (nameOrUrl?: string) => {
  if (!nameOrUrl) return false;
  return /\.pdf$/i.test(nameOrUrl) || (nameOrUrl.split(".").pop() || "").toLowerCase() === "pdf";
};

const AttachmentRow: React.FC<{ file: any }> = ({ file }) => {
  const url = file?.fileUrl ?? file?.url ?? "";
  const name = file?.fileName ?? file?.name ?? url;
  const ext = (name || url).split(".").pop()?.toLowerCase() ?? "";
  const image = isImageExt(url || name);
  const pdf = isPdfExt(url || name);

  const stop = (e: React.MouseEvent) => {
    console.debug("[ExerciseTab][AttachmentRow] click stopPropagation for url:", url);
    e.stopPropagation();
  };

  return (
    <div className="w-full flex items-center gap-3 bg-white border rounded overflow-hidden px-3 py-2 hover:shadow transition">
      <div className="w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
        {image ? (
          <a href={url} target="_blank" rel="noopener noreferrer" onClick={stop} className="w-full h-full block">
            <img src={url} alt={name} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          </a>
        ) : pdf ? (
          <div className="flex items-center justify-center w-full h-full bg-red-50 text-red-600">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="currentColor" strokeWidth="1.2" />
              <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-700">
            <div className="text-xs font-medium">{ext ? ext.toUpperCase() : "FILE"}</div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0" style={{ overflow: "hidden" }}>
        <div className="text-sm text-gray-800 underline decoration-dashed truncate block" title={name}>
          {name}
        </div>
        <div className="text-xs text-gray-500 mt-1" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {pdf ? "PDF" : image ? "Image" : (ext ? ext.toUpperCase() : "File")}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        {url ? (
          <>
            <a href={url} target="_blank" rel="noopener noreferrer" onClick={stop} className="text-xs text-blue-600 hover:underline px-2 py-1 rounded">Mở</a>
            <a href={url} download onClick={stop} className="text-xs text-slate-600 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100">Tải</a>
          </>
        ) : (
          <div className="text-xs text-slate-400">Không có liên kết</div>
        )}
      </div>
    </div>
  );
};

const ExerciseTab: React.FC<Props> = ({
  works,
  role,
  onOpenWork,
  onAddWork,
  fetchCountsForWork,
  submissionCounts = {},
  memberCounts = {},
  navigateToEdit,
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // dedupe by id to avoid duplicates from store/API
  const uniqWorks = useMemo(() => {
    console.debug("[ExerciseTab] incoming works length:", Array.isArray(works) ? works.length : 0, "works:", works);
    const map = new Map<number, ClassWork>();
    (works ?? []).forEach((w) => {
      if (w && typeof w.id === "number") map.set(w.id, w);
    });
    const arr = Array.from(map.values());
    console.debug("[ExerciseTab] uniqWorks computed length:", arr.length, "uniqWorks:", arr);
    return arr;
  }, [works]);

  const handleCardClick = (w: ClassWork) => {
    console.debug("[ExerciseTab] handleCardClick", { workId: w.id, role, openDropdownId });
    if (role === "student") {
      // navigate to detail (parent provides navigation)
      console.debug("[ExerciseTab] student clicking work -> onOpenWork", w.id);
      onOpenWork && onOpenWork(w.id);
    } else {
      // teacher: toggle dropdown and fetch counts when opening
      const next = openDropdownId === w.id ? null : w.id;
      console.debug("[ExerciseTab] teacher toggling dropdown", { workId: w.id, next });
      setOpenDropdownId(next);
      if (next === w.id && typeof fetchCountsForWork === "function") {
        console.debug("[ExerciseTab] calling fetchCountsForWork for workId:", w.id);
        void fetchCountsForWork(w.id);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        {role === "teacher" && (
          <Button
            type="button"
            onClick={(e) => {
              console.debug("[ExerciseTab] onAddWork clicked");
              e.stopPropagation();
              if (typeof onAddWork === "function") onAddWork();
            }}
            className="text-base"
          >
            + Thêm bài tập
          </Button>
        )}
      </div>

      <div className="mt-2">
        {uniqWorks.length === 0 ? (
          <div className="text-slate-500 text-base">Chưa có bài tập nào.</div>
        ) : (
          <div className="space-y-4">
            {uniqWorks.map((w) => {
              const past = !!w.deadline && isPastDeadline(w.deadline);
              const submission = submissionCounts[w.id] ?? "—";
              const members = memberCounts[w.id] ?? "—";
              const isOpen = openDropdownId === w.id;

              // normalize files from many possible shapes
              const rawFiles =
                (w as any).files ??
                (w as any).attachments ??
                (w as any).documents ??
                (w as any).raw?.files ??
                (w as any).raw?.attachments ??
                [];
              console.debug("[ExerciseTab] rawFiles for work", w.id, rawFiles);
              const files = Array.isArray(rawFiles) ? normalizeFiles(rawFiles, w.id) : [];
              console.debug("[ExerciseTab] normalized files for work", w.id, files);

              return (
                <div key={w.id}>
                  <div
                    className={`bg-white border rounded-xl p-5 cursor-pointer hover:bg-blue-50 flex justify-between items-start`}
                    onClick={() => handleCardClick(w)}
                  >
                    <div className="max-w-[70%]">
                      <div className="text-lg font-semibold text-slate-900">{w.title}</div>
                      <div className="text-base text-slate-600 mt-2">{w.description}</div>
                    </div>

                    <div className="text-right min-w-[140px]">
                      <div className="text-xs text-slate-400">Hạn nộp</div>
                      <div className="font-medium text-slate-800 mt-1">
                        {w.deadline ? new Date(w.deadline).toLocaleString() : "Không xác định"}
                      </div>
                      {past && <div className="mt-2 text-xs text-red-600 font-semibold">Đã quá hạn</div>}
                      {role === "teacher" && (
                        <div className="mt-3">
                          <Button
                            type="button"
                            aria-label={`Sửa bài tập ${w.title}`}
                            onClick={(e) => {
                              console.debug("[ExerciseTab] edit clicked for workId:", w.id);
                              e.stopPropagation();
                              if (past) return;
                              navigateToEdit && navigateToEdit(w.id);
                            }}
                            variant="secondary"
                            size="sm"
                            disabled={past}
                            title={past ? "Bài tập đã quá hạn, không thể chỉnh sửa" : undefined}
                          >
                            ✏️ Sửa
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isOpen && role === "teacher" && (
                    <Card className="mt-2">
                      <div className="p-5">
                        <div>
                          <span className="font-semibold">Tiêu đề:</span>{" "}
                          <span className="ml-2">{w.title}</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <div className="text-xs text-slate-400">Hạn nộp</div>
                            <div className="font-medium">
                              {w.deadline ? new Date(w.deadline).toLocaleString() : "Không xác định"}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-slate-400">Đã nộp / Tổng</div>
                            <div className="font-semibold text-slate-700">
                              {submission} / {members}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="text-xs text-slate-400 mb-2">Tệp đính kèm</div>
                          {files.length === 0 ? (
                            <div className="text-sm text-slate-400">Không có tệp đính kèm</div>
                          ) : (
                            <div className="space-y-2">
                              {files.map((f) => (
                                <AttachmentRow key={String(f.id) + String(f.fileUrl ?? "")} file={f} />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 text-right">
                          <Button
                            type="button"
                            onClick={(e) => {
                              console.debug("[ExerciseTab] 'Xem chi tiết' clicked for workId:", w.id);
                              e.stopPropagation();
                              onOpenWork && onOpenWork(w.id);
                            }}
                          >
                            Xem chi tiết
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseTab; 