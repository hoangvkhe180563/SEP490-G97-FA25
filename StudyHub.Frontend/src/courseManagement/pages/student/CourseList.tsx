import CourseCard from "@/courseManagement/components/CourseCard";
import CourseFilters from "@/courseManagement/components/CourseListFiltersStudent";
import { useEffect, useState } from "react";
import { documentService } from "@/documentManagement/services/documentService";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import type { CourseListDto } from "@/courseManagement/types/api";
import type { CourseListDto as Course } from "@/courseManagement/interfaces/types";

const CourseList: React.FC = () => {
  const courses = useCourseStore((s) => s.courses);
  const total = useCourseStore((s) => s.total);
  const loading = useCourseStore((s) => s.loading);
  const fetchCourses = useCourseStore((s) => s.fetchCourses);

  const [q, setQ] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    // initial load
    fetchCourses({ page: 1, pageSize: 12 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await documentService.getSubjects();
        if (!mounted) return;
        setSubjects((s || []).map((x: any) => ({ id: x.id, name: x.name })));
      } catch (err) {
        console.error("Failed to load subjects", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const page = useCourseStore((s) => s.page);
  const pageSize = useCourseStore((s) => s.pageSize);

  const goPage = (p: number) => {
    fetchCourses({ page: p, pageSize, q, sort, ...filters });
  };

  const applyFilters = (next: Record<string, any>) => {
    setFilters(next);
    // fetch page 1 with new filters
    fetchCourses({ page: 1, pageSize, q, sort, ...next });
  };

  const applySearch = (value?: string) => {
    setQ(value);
    fetchCourses({ page: 1, pageSize, q: value, sort, ...filters });
  };

  const applySort = (value?: string) => {
    setSort(value);
    fetchCourses({ page: 1, pageSize, q, sort: value, ...filters });
  };

  return (
    <div>
      <main className="max-w-screen-xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-normal text-[#171717]">All Courses</div>
          <div className="text-sm text-gray-500">
            Discover and enroll in courses to advance your learning journey
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 mb-6">
          <div className="hidden lg:block lg:col-span-3" />

          <div className="col-span-12 lg:col-span-9 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`w-8 h-8 rounded border bg-white flex items-center justify-center ${
                    viewMode === "grid" ? "ring-2 ring-black" : ""
                  }`}
                >
                  ▦
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`w-8 h-8 rounded border bg-white flex items-center justify-center ${
                    viewMode === "list" ? "ring-2 ring-black" : ""
                  }`}
                >
                  ≡
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                placeholder="Search courses..."
                className="border rounded px-3 py-1 text-sm"
                value={q ?? ""}
                onChange={(e) => applySearch(e.target.value || undefined)}
              />

              <select
                className="border rounded px-3 py-1 text-sm"
                value={sort ?? ""}
                onChange={(e) => applySort(e.target.value || undefined)}
              >
                <option value="">Sort: Relevance</option>
                <option value="newest">Time: Newest</option>
                <option value="priceAsc">Price: Low - High</option>
                <option value="priceDesc">Price: High - Low</option>
              </select>

              <select
                className="border rounded px-3 py-1 text-sm"
                value={pageSize}
                onChange={(e) =>
                  fetchCourses({
                    page: 1,
                    pageSize: Number(e.target.value),
                    q,
                    sort,
                    ...filters,
                  })
                }
              >
                <option value={6}>6 / page</option>
                <option value={12}>12 / page</option>
                <option value={24}>24 / page</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-3">
            <CourseFilters
              filters={filters}
              onApply={applyFilters}
              onReset={() => {
                setFilters({});
                fetchCourses({ page: 1, pageSize, q, sort });
              }}
            />
          </aside>

          <section className="col-span-12 lg:col-span-9">
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-40 bg-gray-100 animate-pulse rounded"
                    />
                  ))
                : courses.map((c: CourseListDto) => {
                    // map category id -> subject name if available
                    const categoryLabel = (() => {
                      const id = c.category as any;
                      if (id === null || id === undefined) return undefined;
                      const found = subjects.find((s) => s.id === Number(id));
                      return found ? found.name : String(id);
                    })();

                    const uiCourse: Course = {
                      id: c.id,
                      name: c.name,
                      information: c.information ?? null,
                      imageUrl: c.imageUrl ?? null,
                      price: c.price,
                      status: c.status,
                      category: (c.category as any) ?? null,
                      instructorName: c.instructorName ?? null,
                      createdAt: c.createdAt,
                    };

                    return (
                      <div
                        key={c.id}
                        className={viewMode === "list" ? "" : undefined}
                      >
                        <CourseCard
                          course={uiCourse}
                          categoryLabel={categoryLabel ?? undefined}
                        />
                      </div>
                    );
                  })}
            </div>

            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * pageSize + 1} -
                {Math.min(page * pageSize, total)} of {total}
              </div>

              <nav className="inline-flex items-center gap-2">
                <button
                  className={`p-2 ${
                    page <= 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                  onClick={() => goPage((page || 1) - 1)}
                >
                  Prev
                </button>

                <button className="p-2 bg-black text-white rounded">
                  {page || 1}
                </button>

                <button
                  className={`p-2 ${
                    page * pageSize >= total
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                  onClick={() => goPage((page || 1) + 1)}
                >
                  Next
                </button>
              </nav>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CourseList;
