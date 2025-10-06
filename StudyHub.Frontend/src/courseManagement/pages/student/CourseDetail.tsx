import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import CourseNavSidebar from "@/courseManagement/components/CourseDetailFiltersStudent";
import CourseContentItem from "@/courseManagement/components/CourseContentItem";

const CourseDetail: React.FC = () => {
  const navigate = useNavigate();
  const content = [
    {
      id: "l1",
      title: "Introduction to JavaScript",
      subtitle: "Understanding the basics and setting up your environment",
      duration: "25 min",
    },
    {
      id: "l2",
      title: "Variables and Data Types",
      subtitle: "Learn about different data types and variable declarations",
      duration: "32 min",
    },
    {
      id: "l3",
      title: "Functions and Scope",
      subtitle: "Understanding function declarations and variable scope",
      duration: "45 min",
    },
    {
      id: "l4",
      title: "Assignment: Basic Calculator",
      subtitle: "Build a simple calculator using JavaScript functions",
      duration: "2 hours",
    },
    {
      id: "l5",
      title: "Objects and Arrays",
      subtitle: "Working with complex data structures in JavaScript",
      duration: "38 min",
    },
  ];

  return (
    <div className="w-full bg-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-sm text-gray-500 mb-4">
          My Courses / Web Development / JavaScript Fundamentals
        </div>

        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center border rounded"
            aria-label="Go back"
          >
            ←
          </button>
          <div className="text-lg font-medium">JavaScript Fundamentals</div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-3">
            <CourseNavSidebar />
          </aside>

          <main className="col-span-12 lg:col-span-9">
            <div className="bg-white rounded-md border p-4 mb-6 flex items-start justify-between">
              <div>
                <div className="text-lg font-medium">
                  JavaScript Fundamentals
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Master the core concepts of JavaScript programming language
                  including variables, functions, objects, and DOM manipulation.
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                      JS
                    </div>
                    <span>Dr. Sarah Johnson</span>
                  </div>
                  <div>8 weeks</div>
                  <div>★ 4.8 (342 reviews)</div>
                </div>
              </div>

              <div>
                <Button>Course Image</Button>
              </div>
            </div>

            <div className="bg-white rounded-md border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-medium">Course Content</div>
                <div className="flex items-center gap-3">
                  <select className="border rounded px-3 py-1 text-sm">
                    <option>Sort by: Default</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <button className="border rounded p-2">List</button>
                    <button className="border rounded p-2">Grid</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {content.map((c) => (
                  <CourseContentItem
                    key={c.id}
                    title={c.title}
                    subtitle={c.subtitle}
                    duration={c.duration}
                  />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
