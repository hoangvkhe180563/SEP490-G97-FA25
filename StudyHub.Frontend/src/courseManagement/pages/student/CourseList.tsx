import CourseCard from "@/courseManagement/components/CourseCard";
import CourseFilters from "@/courseManagement/components/CourseListFiltersStudent";
import { useEffect } from "react";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import type { CourseListItemDto } from "@/courseManagement/types/api";
import type { Course } from "@/courseManagement/interfaces/types";

const CourseList: React.FC = () => {
  const { courses, total, loading, fetchCourses } = useCourseStore(
    (s: any) => ({
      courses: s.courses,
      total: s.total,
      loading: s.loading,
      fetchCourses: s.fetchCourses,
    })
  );

  useEffect(() => {
    fetchCourses({ page: 1, pageSize: 12 });
  }, [fetchCourses]);

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
              <div className="text-sm text-gray-600">
                Showing 1-12 of {total}
              </div>

              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded border bg-white flex items-center justify-center">
                  ▦
                </button>
                <button className="w-8 h-8 rounded border bg-white flex items-center justify-center">
                  ≡
                </button>
              </div>
            </div>

            <div>
              <select className="border rounded px-3 py-1 text-sm">
                <option>Sort by: Most Popular</option>
                <option>Newest</option>
                <option>Duration</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-3">
            <CourseFilters />
          </aside>

          <section className="col-span-12 lg:col-span-9">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-40 bg-gray-100 animate-pulse rounded"
                    />
                  ))
                : courses.map((c: CourseListItemDto) => {
                    const uiCourse: Course = {
                      id: String(c.id),
                      title: c.name,
                      description: c.information ?? undefined,
                      instructor: undefined,
                      category: undefined,
                      duration: undefined,
                      students: undefined,
                      image: c.imageUrl ?? undefined,
                      price: c.price,
                    };

                    return <CourseCard key={c.id} course={uiCourse} />;
                  })}
            </div>

            <div className="flex items-center justify-center mt-8">
              <nav className="inline-flex items-center gap-2">
                <button className="p-2">&lt;</button>
                <button className="p-2 bg-black text-white rounded">1</button>
                <button className="p-2">2</button>
                <button className="p-2">&gt;</button>
              </nav>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CourseList;
