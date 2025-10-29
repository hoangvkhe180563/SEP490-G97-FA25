import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { documentService } from "@/documentManagement/services/documentService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";

type FiltersShape = {
  subjectId?: number | string;
  grade?: number | string;
  level?: number | string;
  instructor?: string | number;
  isFeatured?: boolean;
  minDuration?: number;
  maxDuration?: number;
};

type Teacher = {
  id: number | string;
  fullname?: string;
  username?: string;
  email?: string;
};

type Props = {
  filters?: FiltersShape;
  teachers?: Teacher[];
  onApply?: (f: Record<string, any>) => void;
};

const CourseListFiltersStudent: React.FC<Props> = ({
  filters = {},
  teachers = [],
  onApply,
}) => {
  const [local, setLocal] = useState<Record<string, any>>({
    subjectId: filters.subjectId ?? undefined,
    grade: filters.grade ?? filters.level ?? undefined,
    instructor: filters.instructor ?? undefined,
    displayInstructor: undefined,
    isFeatured: filters.isFeatured ?? undefined,
    duration: undefined,
    minDuration: filters.minDuration ?? undefined,
    maxDuration: filters.maxDuration ?? undefined,
  });

  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [grades, setGrades] = useState<{ id: number; name: string }[]>([]);

  const debounceRef = useRef<number | null>(null);
  const suppressApply = useRef(false);
  const firstRun = useRef(true);
  const onApplyRef = useRef<typeof onApply | undefined>(onApply);
  useEffect(() => {
    onApplyRef.current = onApply;
  }, [onApply]);

  // Auto-apply on change
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    if (suppressApply.current) {
      suppressApply.current = false;
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      if (onApplyRef.current) {
        const { duration, ...payloadRaw } = local;
        const payload: Record<string, any> = { ...(payloadRaw as any) };
        if (payload.subjectId === "all") {
          delete payload.subjectId;
        }
        onApplyRef.current(payload);
      }
    }, 300) as unknown as number;

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [local]);

  // Load subjects & grades
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await documentService.getSubjects();
        if (!mounted) return;
        setSubjects((s || []).map((x: any) => ({ id: x.id, name: x.name })));
        const staticGrades = Array.from({ length: 12 }).map((_, i) => ({
          id: i + 1,
          name: String(i + 1),
        }));
        setGrades(staticGrades);
      } catch (err) {
        console.error("Failed to load subjects/grades", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleSingle = (field: string, id: any) => {
    setLocal((prev) => ({
      ...prev,
      [field]: prev[field] === id ? undefined : id,
    }));
  };

  return (
    <aside className="bg-white rounded-md p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-[#171717] mb-4">Bộ lọc</h3>

      <div className="space-y-6">
        {/* Chủ đề */}
        <div>
          <Label className="text-sm font-medium">Chủ đề</Label>
          <Select
            value={local.subjectId ?? "all"}
            onValueChange={(value) => {
              if (value === "all") {
                // selecting "all" should clear the subject filter
                setLocal((prev) => ({ ...prev, subjectId: undefined }));
                return;
              }
              toggleSingle("subjectId", value);
            }}
          >
            <SelectTrigger className="mt-2 w-full">
              <SelectValue placeholder="Chọn môn học" />
            </SelectTrigger>
            <SelectContent className="max-h-40 overflow-y-auto">
              <SelectItem value="all">Tất cả môn học</SelectItem>
              {subjects.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Khối */}
        <div>
          <Label className="text-sm font-medium">Khối</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {grades.map((g) => (
              <button
                key={g.id}
                onClick={() => toggleSingle("grade", g.id)}
                className={`px-2 py-1 text-sm rounded-md border transition ${
                  local.grade === g.id
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* Khoảng thời gian */}
        <div>
          <Label className="text-sm font-medium">Khoảng thời gian</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { id: "0-5", label: "0–5 giờ", min: 0, max: 5 * 60 },
              { id: "5-20", label: "5–20 giờ", min: 5 * 60, max: 20 * 60 },
              { id: "20+", label: "20+ giờ", min: 20 * 60, max: undefined },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() =>
                  setLocal((prev) => {
                    if (prev.duration === d.id) {
                      return {
                        ...prev,
                        duration: undefined,
                        minDuration: undefined,
                        maxDuration: undefined,
                      };
                    }
                    return {
                      ...prev,
                      duration: d.id,
                      minDuration: d.min,
                      maxDuration: d.max,
                    };
                  })
                }
                className={`px-3 py-1.5 text-sm rounded-md border transition ${
                  local.duration === d.id
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Giáo viên */}
        <div>
          <Label className="text-sm font-medium">Giáo viên</Label>
          <Input
            placeholder="Tìm kiếm giáo viên..."
            className="mt-2"
            list="teachers-suggestions"
            value={local.displayInstructor ?? ""}
            onChange={(e) => {
              const v = e.target.value || undefined;
              const found = teachers.find(
                (t: any) =>
                  String(t.fullname ?? t.username ?? t.email).toLowerCase() ===
                  String(v ?? "").toLowerCase()
              );
              setLocal({
                ...local,
                displayInstructor: v,
                instructor: found ? String(found.id) : undefined,
              });
            }}
          />
          <datalist id="teachers-suggestions">
            {teachers.map((t: any) => (
              <option key={t.id} value={t.fullname ?? t.username ?? t.email} />
            ))}
          </datalist>
        </div>
      </div>
    </aside>
  );
};

export default CourseListFiltersStudent;
