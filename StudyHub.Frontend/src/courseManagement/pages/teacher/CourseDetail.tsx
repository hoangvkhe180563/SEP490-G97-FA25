import React from "react";
import type { Course } from "@/courseManagement/interfaces/types";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Edit2, ArrowLeft } from "lucide-react";

const CourseDetail: React.FC = () => {
  const navigate = useNavigate();
  useParams();

  // demo static data for layout
  const course: Course = {
    id: "demo-course",
    title: "Advanced Web Development",
    subtitle: "Master modern web technologies and frameworks",
    instructor: "John Smith",
    createdAt: "Jan 15, 2025",
    duration: "12 weeks",
    totalStudents: 247,
    completionRate: "78%",
    avgRating: 4.6,
    totalLessons: 24,
    description:
      "This comprehensive course covers modern web development technologies including React, Node.js, and database management. Students will learn to build full-stack applications from scratch.",
  };

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1200px] mx-auto px-8 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 mb-4 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 text-[#525252]" />
          </button>
          <div className="text-sm text-[#525252] mb-3">
            Courses / Course Details
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center justify-between bg-white border rounded p-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#D9D9D9] rounded flex items-center justify-center text-sm">
                  Course Image
                </div>
                <div>
                  <div className="text-lg font-medium">{course.title}</div>
                  <div className="text-sm text-[#737373] mt-1">
                    {course.subtitle}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-[#525252] mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#171717]" />
                      <span>{course.instructor}</span>
                    </div>
                    <div>Created: {course.createdAt}</div>
                    <div>Duration: {course.duration}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/teacher/edit-course`)}
                >
                  <Edit2 className="mr-2" /> Edit Course
                </Button>
                <Button>Preview</Button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-8">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Card>
                    <CardContent>
                      <div className="text-sm text-[#8A8A8A]">
                        Total Students
                      </div>
                      <div className="text-xl font-semibold">
                        {course.totalStudents}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent>
                      <div className="text-sm text-[#8A8A8A]">
                        Completion Rate
                      </div>
                      <div className="text-xl font-semibold">
                        {course.completionRate}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Course Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#404040]">
                      {course.description}
                    </p>

                    <div className="mt-4 text-sm text-[#404040]">
                      <div className="font-medium mb-2">
                        Learning Objectives:
                      </div>
                      <ul className="list-disc pl-5 text-sm">
                        <li>Master React and component-based architecture</li>
                        <li>Build RESTful APIs with Node.js and Express</li>
                        <li>Implement database design and management</li>
                        <li>Deploy applications to cloud platforms</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Curriculum</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <details className="border rounded p-3">
                        <summary className="cursor-pointer font-medium">
                          Module 1: Introduction to React
                        </summary>
                        <div className="mt-2 text-sm text-[#404040]">
                          5 lessons • 2 hours
                        </div>
                      </details>

                      <details className="border rounded p-3">
                        <summary className="cursor-pointer font-medium">
                          Module 2: State Management
                        </summary>
                        <div className="mt-2 text-sm text-[#404040]">
                          4 lessons • 1.5 hours
                        </div>
                      </details>

                      <details className="border rounded p-3">
                        <summary className="cursor-pointer font-medium">
                          Module 3: Backend Development
                        </summary>
                        <div className="mt-2 text-sm text-[#404040]">
                          6 lessons • 3 hours
                        </div>
                      </details>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <aside className="col-span-12 lg:col-span-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-[#404040]">
                        <div className="flex justify-between">
                          <span>Status</span>
                          <span>Published</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price</span>
                          <span>$299</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Category</span>
                          <span>Web Development</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Level</span>
                          <span>Intermediate</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Instructor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#D9D9D9]" />
                        <div>
                          <div className="font-medium">John Smith</div>
                          <div className="text-sm text-[#737373]">
                            Senior Developer
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button variant="outline">View Profile</Button>
                            <Button>Message</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-[#404040] list-disc pl-5">
                        <li>New student enrolled • 2 hours ago</li>
                        <li>Assignment submitted • 5 hours ago</li>
                        <li>Course updated • 1 day ago</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
