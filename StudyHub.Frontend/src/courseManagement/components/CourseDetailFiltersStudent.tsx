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
  assignment: boolean;
  quiz: boolean;
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
  onClear,
  stats,
}) => {
  return (
    <aside className="space-y-6">
      <div className="bg-white rounded-md p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Điều hướng khóa học</h4>
          <button className="text-xs text-gray-400" onClick={onClear}>
            Xóa
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-2">Bộ lọc tiến độ</div>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.completed}
              onChange={(e) =>
                setFilters({ ...filters, completed: e.target.checked })
              }
            />
            <span>Đã hoàn thành</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.inProgress}
              onChange={(e) =>
                setFilters({ ...filters, inProgress: e.target.checked })
              }
            />
            <span>Đang tiến hành</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.notStarted}
              onChange={(e) =>
                setFilters({ ...filters, notStarted: e.target.checked })
              }
            />
            <span>Chưa bắt đầu</span>
          </label>
        </div>

        <div className="mt-4 text-sm text-gray-600">Loại nội dung</div>
        <div className="space-y-2 text-sm mt-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={contentTypes.video}
              onChange={(e) =>
                setContentTypes({ ...contentTypes, video: e.target.checked })
              }
            />
            <span>Video</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={contentTypes.reading}
              onChange={(e) =>
                setContentTypes({ ...contentTypes, reading: e.target.checked })
              }
            />
            <span>Tài liệu đọc</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={contentTypes.assignment}
              onChange={(e) =>
                setContentTypes({
                  ...contentTypes,
                  assignment: e.target.checked,
                })
              }
            />
            <span>Bài tập</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={contentTypes.quiz}
              onChange={(e) =>
                setContentTypes({ ...contentTypes, quiz: e.target.checked })
              }
            />
            <span>Câu đố</span>
          </label>
        </div>

        <div className="mt-4">
          <Label className="text-sm">Thời gian</Label>
          <select
            className="w-full mt-2 border rounded px-2 py-1 text-sm"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="all">Tất cả thời gian</option>
            <option value="0-5">0-5 giờ</option>
            <option value="5-20">5-20 giờ</option>
            <option value="20+">20+ giờ</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-md p-4 shadow-sm">
        <h4 className="text-sm font-medium mb-2">Thống kê khóa học</h4>
        <div className="text-sm text-gray-600">Tiến độ tổng thể</div>
        <div className="w-full bg-gray-100 h-3 rounded mt-2 overflow-hidden">
          <div
            className="bg-gray-700 h-3"
            style={{
              width: stats
                ? `${Math.round(
                    (stats.completed /
                      Math.max(1, stats.completed + stats.remaining)) *
                      100
                  )}%`
                : "0%",
            }}
          />
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500 mt-3">
          <div>
            {stats ? `${stats.completed} Đã hoàn thành` : "0 Đã hoàn thành"}
          </div>
          <div>
            {stats ? `${stats.remaining} Chưa hoàn thành` : "0 Chưa hoàn thành"}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CourseNavSidebar;
