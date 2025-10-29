import CourseCard from "@/courseManagement/components/CourseCard";
import CourseFilters from "@/courseManagement/components/CourseListFiltersStudent";
import { useEffect, useState } from "react";
import { documentService } from "@/documentManagement/services/documentService";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
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
  const [selectedPageSize, setSelectedPageSize] = useState<number | null>(6);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const filterAppUsers = useAppUserStore((s) => s.filterAppUsers);

  const pageSize = useCourseStore((s) => s.pageSize);
  const effectivePageSize = selectedPageSize ?? pageSize ?? 6;

  const load = (p: number = 1, opts: Record<string, any> = {}) => {
    const params: Record<string, any> = {
      page: p,
      pageSize: opts.pageSize ?? effectivePageSize,
      status: "Mở",
      isApproved: true,
      q,
      sort,
      ...filters,
      ...opts,
    };
    fetchCourses(params);
  };

  useEffect(() => {
    fetchCourses({
      page: 1,
      pageSize: effectivePageSize,
      status: "Mở",
      isApproved: true,
    });
  }, [fetchCourses, effectivePageSize]);

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
    (async () => {
      try {
        const r = await filterAppUsers(
          "role=00000000-0000-0000-0000-000000000003&page=1"
        );
        setTeachers(r?.data ?? []);
      } catch (err) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [filterAppUsers]);

  const page = useCourseStore((s) => s.page);

  // keep local selected page size in sync with store pageSize when provided
  useEffect(() => {
    if (pageSize !== undefined && pageSize !== null)
      setSelectedPageSize(pageSize);
  }, [pageSize]);

  const goPage = (p: number) => load(p);

  const applyFilters = (next: Record<string, any>) => {
    setFilters(next);
    load(1, { ...next });
  };

  const applySearch = (value?: string) => {
    setQ(value);
    load(1, { q: value });
  };

  const applySort = (value?: string) => {
    setSort(value);
    load(1, { sort: value });
  };

  // pagination display calculations
  const currentPage = page ?? 1;
  const startItem = total === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1;
  const endItem = Math.min(currentPage * effectivePageSize, total);

  return (
    <div className="max-w-[1300px] mx-auto my-3 w-full h-full overflow-y-auto scrollbar-hide">
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl font-normal text-[#171717]">
          Tất cả các khóa học
        </div>
        <div className="text-sm text-gray-500">
          Khám phá và đăng ký các khóa học để nâng cao hành trình học tập của
          bạn
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

          <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            {/* Ô tìm kiếm */}
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <i className="ri-search-line text-gray-500 text-base" />
              <input
                placeholder="Tìm kiếm khóa học..."
                className="w-full border-none outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                value={q ?? ""}
                onChange={(e) => applySearch(e.target.value || undefined)}
              />
            </div>

            {/* Bộ sắp xếp */}
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white hover:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400 transition"
              value={sort ?? ""}
              onChange={(e) => applySort(e.target.value || undefined)}
            >
              <option value="">Sắp xếp: Mức độ liên quan</option>
              <option value="newest">Thời gian: Mới nhất</option>
              <option value="priceAsc">Giá: Thấp → Cao</option>
              <option value="priceDesc">Giá: Cao → Thấp</option>
            </select>

            {/* Page size */}
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white hover:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400 transition"
              value={selectedPageSize ?? pageSize}
              onChange={(e) => {
                const next = Number(e.target.value);
                setSelectedPageSize(next);
                fetchCourses({
                  page: 1,
                  pageSize: next,
                  q,
                  sort,
                  ...filters,
                  status: "Mở",
                  isApproved: true,
                });
              }}
            >
              <option value={6}>6 / trang</option>
              <option value={12}>12 / trang</option>
              <option value={24}>24 / trang</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 lg:col-span-3">
          <CourseFilters
            filters={filters}
            teachers={teachers}
            onApply={applyFilters}
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
                    const id = c.subjectId as any;
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
                    subjectId: (c.subjectId as any) ?? null,
                    grade: c.grade,
                    schoolId: (c.schoolId as any) ?? null,
                    isFeatured: c.isFeatured,
                    // resolve instructor name into createdBy (keeps existing DTO shape)
                    createdBy:
                      (c.createdBy &&
                        (teachers.find(
                          (t) => String(t.id) === String(c.createdBy)
                        )?.fullname ??
                          String(c.createdBy))) ||
                      null,
                    // pass through course schedule fields (these exist on the DTO)
                    startAt: c.startAt ?? null,
                    endAt: c.endAt ?? null,
                    createdAt: c.createdAt,
                    subjectName: c.subjectName ?? "",
                    isApproved: c.isApproved ?? false,
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

          <div className="flex items-center justify-between mt-4 mb-8">
            <div className="text-sm text-gray-600">
              {total === 0 ? (
                <>Hiển thị 0 của 0</>
              ) : (
                <>
                  Hiển thị {startItem} - {endItem} của {total}
                </>
              )}
            </div>

            <nav className="inline-flex items-center gap-2">
              <button
                className={`p-2 ${
                  currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
                onClick={() => goPage(currentPage - 1)}
              >
                Trước
              </button>

              <button className="p-2 bg-black text-white rounded">
                {currentPage}
              </button>

              <button
                className={`p-2 ${
                  currentPage * effectivePageSize >= total
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
                onClick={() => goPage(currentPage + 1)}
              >
                Tiếp theo
              </button>
            </nav>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CourseList;
