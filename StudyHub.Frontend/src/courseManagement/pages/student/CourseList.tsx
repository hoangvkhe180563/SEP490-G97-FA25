import CourseCard from "@/courseManagement/components/CourseCard";
import CourseFilters from "@/courseManagement/components/CourseListFiltersStudent";
import type { Course } from "@/courseManagement/interfaces/types";

const sampleCourses: Course[] = [
  {
    id: "c1",
    title: "Introduction to Python Programming",
    description: "Learn the fundamentals of Python programming",
    instructor: "Dr. Sarah Wilson",
    duration: "12 hours",
    students: "1,234",
    updatedAt: "Jan 15, 2025",
  },
  {
    id: "c2",
    title: "Calculus I: Limits and Derivatives",
    description: "Master the fundamentals of differential calculus",
    instructor: "Prof. Michael Chen",
    duration: "18 hours",
    students: "856",
    updatedAt: "Jan 10, 2025",
  },
  {
    id: "c3",
    title: "UI/UX Design Fundamentals",
    description: "Learn the principles of user interface and experience design",
    instructor: "Emma Rodriguez",
    duration: "15 hours",
    students: "482",
    updatedAt: "Jan 8, 2025",
  },
];

const CourseList: React.FC = () => {
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
                Showing 1-12 of 64 courses
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
              {sampleCourses.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
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
