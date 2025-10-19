import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Label } from "@/common/components/ui/label";
// Checkbox not used; using native inputs
import { documentService } from "@/documentManagement/services/documentService";

type Props = {
  filters?: Record<string, any>;
  onApply?: (next: Record<string, any>) => void;
  onReset?: () => void;
};

const CourseFilters: React.FC<Props> = ({ filters = {}, onApply, onReset }) => {
  const [local, setLocal] = useState<Record<string, any>>({
    category: filters.category ?? undefined,
    grade: filters.grade ?? filters.level ?? undefined,
    duration: filters.duration ?? undefined,
    instructor: filters.instructor ?? undefined,
    isFeatured: filters.isFeatured ?? undefined,
  });

  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [grades, setGrades] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    // when syncing from parent props, avoid triggering auto-apply
    suppressApply.current = true;
    setLocal((l) => ({
      ...l,
      ...filters,
      grade: filters.grade ?? filters.level ?? l.grade,
    }));
  }, [filters]);

  // Auto-apply behavior: notify parent when local filters change
  const debounceRef = useRef<number | null>(null);
  const firstRun = useRef(true);
  // use a ref flag to suppress auto-apply when local is updated from incoming props
  const suppressApply = useRef(false);
  useEffect(() => {
    // don't trigger on first mount (avoid double-fetch) unless filters prop provided
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    if (suppressApply.current) {
      // This change originated from incoming props; skip auto-apply once
      suppressApply.current = false;
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    // debounce for text input changes; numeric/checkbox changes will also respect debounce (300ms)
    // setTimeout returns number in browser
    debounceRef.current = window.setTimeout(() => {
      if (onApply) onApply(local);
    }, 300) as unknown as number;

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await documentService.getSubjects();
        if (!mounted) return;
        setSubjects((s || []).map((x: any) => ({ id: x.id, name: x.name })));
        // grades are not provided by documentService in this project; use static 1..12
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
        <h3 className="text-lg font-medium text-[#171717]">Filters</h3>
        <button
          onClick={doReset}
          className="text-sm text-gray-500 hover:underline"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm">Subject</Label>
            <span className="text-xs text-gray-400">{subjects.length}</span>
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
          <Label className="text-sm">Grade</Label>
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
          <Label className="text-sm">Duration</Label>
          <div className="space-y-2 mt-2 text-sm">
            {[
              { id: "0-5", label: "0-5 hours" },
              { id: "5-20", label: "5-20 hours" },
              { id: "20+", label: "20+ hours" },
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
          <Label className="text-sm">Instructor</Label>
          <Input
            placeholder="Search instructors..."
            className="mt-2"
            value={local.instructor ?? ""}
            onChange={(e) =>
              setLocal({ ...local, instructor: e.target.value || undefined })
            }
          />
        </div>

        <div className="flex items-center gap-2">
          <Button className="bg-black text-white" onClick={doReset}>
            Reset
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default CourseFilters;
