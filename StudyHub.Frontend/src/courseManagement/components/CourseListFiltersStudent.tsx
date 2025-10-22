import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Label } from "@/common/components/ui/label";
import { documentService } from "@/documentManagement/services/documentService";

type Props = {
  filters?: Record<string, any>;
  teachers?: any[];
  onApply?: (next: Record<string, any>) => void;
  onReset?: () => void;
};

const CourseFilters: React.FC<Props> = ({
  filters = {},
  teachers = [],
  onApply,
  onReset,
}) => {
  const [local, setLocal] = useState<Record<string, any>>({
    category: filters.category ?? undefined,
    grade: filters.grade ?? filters.level ?? undefined,
    duration: filters.duration ?? undefined,
    // 'instructor' here will store the id to send to backend
    instructor: filters.instructor ?? undefined,
    // displayInstructor stores the visible text shown in the input (teacher name)
    displayInstructor: undefined,
    isFeatured: filters.isFeatured ?? undefined,
  });

  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [grades, setGrades] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    suppressApply.current = true;
    setLocal((l) => ({
      ...l,
      ...filters,
      grade: filters.grade ?? filters.level ?? l.grade,
      // if filters.instructor is an id, try to show the teacher name
      displayInstructor:
        filters.instructor && Array.isArray(teachers)
          ? teachers.find(
              (t: any) => String(t.id) === String(filters.instructor)
            )?.fullname ?? String(filters.instructor)
          : filters.instructor ?? l.displayInstructor,
    }));
  }, [filters, teachers]);

  const debounceRef = useRef<number | null>(null);
  const firstRun = useRef(true);
  const suppressApply = useRef(false);
  // keep a stable ref to onApply so changes in parent's function identity
  // won't retrigger this effect and cause loops
  const onApplyRef = useRef<typeof onApply | undefined>(onApply);
  useEffect(() => {
    onApplyRef.current = onApply;
  }, [onApply]);

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
      if (onApplyRef.current) onApplyRef.current(local);
    }, 300) as unknown as number;

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [local]);

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

  const doReset = () => {
    setLocal({});
    if (onReset) onReset();
  };

  return (
    <aside className="bg-white rounded-md p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-[#171717]">Bộ lọc</h3>
        <button
          onClick={doReset}
          className="text-sm text-gray-500 hover:underline"
        >
          Xóa tất cả
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm">Chủ đề</Label>
          </div>
          <div className="space-y-2 mt-2">
            {subjects.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={
                    Array.isArray(local.category)
                      ? local.category.includes(cat.id)
                      : local.category === cat.id
                  }
                  onChange={(e) => {
                    if (Array.isArray(local.category)) {
                      const set = new Set(local.category);
                      if (e.target.checked) set.add(cat.id);
                      else set.delete(cat.id);
                      setLocal({ ...local, category: Array.from(set) });
                    } else {
                      setLocal({
                        ...local,
                        category: e.target.checked ? cat.id : undefined,
                      });
                    }
                  }}
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm">Khối</Label>
          <div className="space-y-2 mt-2 text-sm">
            {grades.map((g) => (
              <label key={g.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={
                    Array.isArray(local.grade)
                      ? local.grade.includes(g.id)
                      : local.grade === g.id
                  }
                  onChange={(e) => {
                    if (Array.isArray(local.grade)) {
                      const set = new Set(local.grade);
                      if (e.target.checked) set.add(g.id);
                      else set.delete(g.id);
                      setLocal({ ...local, grade: Array.from(set) });
                    } else {
                      setLocal({
                        ...local,
                        grade: e.target.checked ? [g.id] : [],
                      });
                    }
                  }}
                />
                <span>{g.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm">Khoảng thời gian</Label>
          <div className="space-y-2 mt-2 text-sm">
            {[
              { id: "0-5", label: "0-5 giờ" },
              { id: "5-20", label: "5-20 giờ" },
              { id: "20+", label: "20+ giờ" },
            ].map((d) => (
              <label key={d.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    Array.isArray(local.duration)
                      ? local.duration.includes(d.id)
                      : local.duration === d.id
                  }
                  onChange={(e) => {
                    if (Array.isArray(local.duration)) {
                      const set = new Set(local.duration);
                      if (e.target.checked) set.add(d.id);
                      else set.delete(d.id);
                      setLocal({ ...local, duration: Array.from(set) });
                    } else {
                      setLocal({
                        ...local,
                        duration: e.target.checked ? d.id : undefined,
                      });
                    }
                  }}
                />
                <span>{d.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm">Giáo viên</Label>
          <Input
            placeholder="Tìm kiếm giáo viên..."
            className="mt-2"
            list="teachers-suggestions"
            value={local.displayInstructor ?? ""}
            onChange={(e) => {
              const v = e.target.value || undefined;
              // try to find an exact match by fullname/username/email
              const found = teachers.find(
                (t: any) =>
                  String(t.fullname ?? t.username ?? t.email).toLowerCase() ===
                  String(v ?? "").toLowerCase()
              );
              setLocal({
                ...local,
                displayInstructor: v,
                // only set instructor id when an exact match is found
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

        <div className="flex items-center gap-2">
          <Button className="bg-black text-white" onClick={doReset}>
            Đặt lại
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default CourseFilters;
