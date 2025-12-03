import CourseCard from "@/courseManagement/components/CourseCard";
import CourseFilters from "@/courseManagement/components/CourseListFiltersStudent";
import { useEffect, useState } from "react";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import type { CourseListDto } from "@/courseManagement/types/api";
import type { CourseListDto as Course } from "@/courseManagement/interfaces/types";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";

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
  const [teachers, setTeachers] = useState<any[]>([]);
  const getTeachers = useAppUserStore((s) => s.getTeachers);
  const authUser = useAuthStore((s) => s.user);

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

    // If the user belongs to a school, request courses for that school (backend also includes public courses).
    // If the user has no school (public user), request public-only courses.
    if (authUser?.schoolId) {
      params.schoolId = authUser.schoolId;
    } else {
      params.publicOnly = true;
    }

    fetchCourses(params);
  };

  useEffect(() => {
    const params: Record<string, any> = {
      page: 1,
      pageSize: effectivePageSize,
      status: "Mở",
      isApproved: true,
    };

    if (authUser?.schoolId) params.schoolId = authUser.schoolId;
    else params.publicOnly = true;

    fetchCourses(params);
  }, [fetchCourses, effectivePageSize, authUser?.schoolId]);

  useEffect(() => {
    (async () => {
      try {
        const list = await getTeachers?.();
        setTeachers(list ?? []);
      } catch (err) {
        // ignore
      }
    })();
  }, [getTeachers]);

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

  return (
    <div className={`p-4 mx-auto w-full h-full overflow-y-auto scrollbar-hide ${authUser ? '' : 'mt-[65px]'}`}>
      <div className="mb-4">
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
              <Button
                variant={viewMode === "grid" ? undefined : "ghost"}
                onClick={() => setViewMode("grid")}
                className="w-8 h-8 p-0 flex items-center justify-center"
              >
                ▦
              </Button>
              <Button
                variant={viewMode === "list" ? undefined : "ghost"}
                onClick={() => setViewMode("list")}
                className="w-8 h-8 p-0 flex items-center justify-center"
              >
                ≡
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            {/* Ô tìm kiếm */}
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <i className="ri-search-line text-gray-500 text-base" />
              <Input
                placeholder="Tìm kiếm khóa học..."
                className="w-full border-none outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                value={q ?? ""}
                onChange={(e: any) => applySearch(e.target.value || undefined)}
              />
            </div>

            {/* Bộ sắp xếp */}
            <Select
              value={sort ?? ""}
              onValueChange={(v) => applySort(v || undefined)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Sắp xếp: Mức độ liên quan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Thời gian: Mới nhất</SelectItem>
                <SelectItem value="priceAsc">Giá: Thấp → Cao</SelectItem>
                <SelectItem value="priceDesc">Giá: Cao → Thấp</SelectItem>
              </SelectContent>
            </Select>

            {/* Page size */}
            <Select
              value={String(selectedPageSize ?? pageSize ?? 6)}
              onValueChange={(v) => {
                const next = Number(v);
                setSelectedPageSize(next);

                if (authUser?.schoolId)
                  fetchCourses({
                    page: 1,
                    pageSize: next,
                    q,
                    sort,
                    ...filters,
                    status: "Mở",
                    isApproved: true,
                    schoolId: authUser?.schoolId,
                  });
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(6)}>6 / trang</SelectItem>
                <SelectItem value={String(12)}>12 / trang</SelectItem>
                <SelectItem value={String(24)}>24 / trang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 lg:col-span-3 lg:sticky lg:top-24 self-start">
          <CourseFilters
            filters={filters}
            teachers={teachers}
            onApply={applyFilters}
          />
        </aside>

        <section className="col-span-12 lg:col-span-9 lg:overflow-y-auto lg:max-h-[calc(100vh-6rem)] scrollbar-hide">
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
                    createdBy: c.createdBy,
                    startAt: c.startAt ?? null,
                    endAt: c.endAt ?? null,
                    createdAt: c.createdAt,
                    teacherCreatedName: c.teacherCreatedName ?? null,
                    subjectName: c.subject?.name ?? "",
                    isApproved: c.isApproved ?? false,
                    difficulty: c.difficulty ?? null,
                    length: c.length ?? null,
                  };

                  return (
                    <div
                      key={c.id}
                      className={viewMode === "list" ? "" : undefined}
                    >
                      <CourseCard course={uiCourse} />
                    </div>
                  );
                })}
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-600">
              {total > 0
                ? `Hiển thị từ ${
                    (currentPage - 1) * effectivePageSize + 1
                  } đến ${Math.min(
                    total,
                    (currentPage - 1) * effectivePageSize + courses.length
                  )} trong tổng số ${total} kết quả`
                : "Không tìm thấy kết quả nào"}
            </span>

            <DocumentPagination
              pagination={{
                currentPage: currentPage,
                totalPages: Math.max(1, Math.ceil(total / effectivePageSize)),
                totalCount: total,
                pageSize: effectivePageSize,
              }}
              onPageChange={(p: number) => goPage(p)}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default CourseList;
