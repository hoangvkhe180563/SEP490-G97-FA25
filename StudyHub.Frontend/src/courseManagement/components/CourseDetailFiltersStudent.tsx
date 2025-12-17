import React from "react";
import { Label } from "@/common/components/ui/label";

type ProgressFilters = {
  completed: boolean;
  inProgress: boolean;
  notStarted: boolean;
};

type ContentTypes = {
  video: boolean;
  reading: boolean;
  exam: boolean;
};

type Stats = {
  completed: number;
  remaining: number;
};

type Props = {
  filters: ProgressFilters;
  setFilters: (next: ProgressFilters) => void;
  contentTypes: ContentTypes;
  setContentTypes: (next: ContentTypes) => void;
  duration: string;
  setDuration: (d: string) => void;
  onClear: () => void;
  stats?: Stats;
};

const CourseNavSidebar: React.FC<Props> = ({
  filters,
  setFilters,
  contentTypes,
  setContentTypes,
  duration,
  setDuration,
}) => {
  const toggleProgress = (key: keyof ProgressFilters) => {
    setFilters({ ...filters, [key]: !filters[key] });
  };

  const toggleContentType = (key: keyof ContentTypes) => {
    setContentTypes({ ...contentTypes, [key]: !contentTypes[key] });
  };

  const setDurationSingle = (d: string) => setDuration(d);

  // define progress filter options once, keep them static and typed
  const PROGRESS_ITEMS: ReadonlyArray<{
    key: keyof ProgressFilters;
    label: string;
    title?: string;
  }> = [
    {
      key: "completed",
      label: "Đã hoàn thành",
      title: "Hiển thị các bài đã hoàn thành",
    },
    {
      key: "inProgress",
      label: "Đang tiến hành",
      title: "Hiển thị các bài đang học",
    },
    {
      key: "notStarted",
      label: "Chưa bắt đầu",
      title: "Hiển thị các bài chưa bắt đầu",
    },
  ];

  const contentTypeItems: { key: keyof ContentTypes; label: string }[] = [
    { key: "video", label: "Video" },
    { key: "reading", label: "Tài liệu đọc" },
    { key: "exam", label: "Bài kiểm tra" },
  ];

  const durationItems = [
    { id: "all", label: "Tất cả" },
    { id: "0-15m", label: "0–15 phút" },
    { id: "15-60m", label: "15–60 phút" },
    { id: "60m+", label: "60+ phút" },
  ];

  const progressClass =
    PROGRESS_ITEMS.length === 3
      ? "flex flex-col gap-2 mb-3"
      : "grid grid-cols-2 gap-2 mb-3";
  const contentClass =
    contentTypeItems.length === 4
      ? "grid grid-cols-2 gap-2 mt-2 mb-3"
      : "flex flex-col gap-2 mt-2 mb-3";
  const durationClass =
    durationItems.length === 4
      ? "grid grid-cols-2 gap-2 mt-2"
      : "flex items-center gap-2 flex-wrap mt-2";

  return (
    <aside className="space-y-6">
      <div className="bg-white rounded-md p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">Lọc khóa học</h4>
        </div>

        <div className="text-sm text-gray-600 mb-2">Bộ lọc tiến độ</div>
        <div className={progressClass} role="group" aria-label="Bộ lọc tiến độ">
          {PROGRESS_ITEMS.map((it) => {
            const active = Boolean(filters[it.key]);
            return (
              <button
                key={it.key}
                type="button"
                title={it.title}
                aria-pressed={active}
                onClick={() => toggleProgress(it.key)}
                className={`px-3 py-1.5 text-sm rounded-md border transition focus:outline-none focus:ring-2 focus:ring-sky-300 ${
                  active
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                }`}
              >
                {it.label}
              </button>
            );
          })}
        </div>

        <div className="mt-2 text-sm text-gray-600">Loại nội dung</div>
        <div className={contentClass}>
          {contentTypeItems.map((it) => (
            <button
              key={it.key}
              onClick={() => toggleContentType(it.key)}
              className={`px-3 py-1.5 text-sm rounded-md border transition ${
                contentTypes[it.key]
                  ? "bg-sky-600 text-white border-sky-600"
                  : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
              }`}
            >
              {it.label}
            </button>
          ))}
        </div>

        <div className="mt-2">
          <Label className="text-sm">Thời lượng</Label>
          <div className={durationClass}>
            {durationItems.map((d) => (
              <button
                key={d.id}
                onClick={() => setDurationSingle(String(d.id))}
                className={`px-3 py-1.5 text-sm rounded-md border transition ${
                  duration === d.id
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CourseNavSidebar;
