import React, { useState } from "react";
import CourseItem from "../../components/CourseItem";
import CourseFilterTeacher from "@/ui/components/CourseFilterTeacher";
import type { Course as CourseType, Status } from "../../components/CourseItem";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/common/components/ui/pagination";

const initialCourses: CourseType[] = [
  {
    id: "c1",
    title: "React Development Masterclass",
    description: "Learn modern React development",
    instructor: "John Smith",
    category: "Programming",
    students: "1,234",
    status: "Published" as Status,
    createdAt: "Jan 15, 2025",
  },
  {
    id: "c2",
    title: "UI/UX Design Fundamentals",
    description: "Complete guide to design principles",
    instructor: "Sarah Johnson",
    category: "Design",
    students: "856",
    status: "Draft" as Status,
    createdAt: "Jan 12, 2025",
  },
  {
    id: "c3",
    title: "Business Strategy 101",
    description: "Essential business planning skills",
    instructor: "Michael Brown",
    category: "Business",
    students: "2,341",
    status: "Published" as Status,
    createdAt: "Jan 10, 2025",
  },
];

const CourseList: React.FC = () => {
  const [courses] = useState(initialCourses);
  const shown = courses.slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <CourseFilterTeacher />

      <div className="overflow-hidden rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Instructor
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Students
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </TableHead>
              <TableHead className="w-36 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((c) => (
              <CourseItem key={c.id} course={c} />
            ))}
            {shown.length < 3 && (
              <TableRow>
                <TableCell colSpan={7} className="h-20" />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4 px-2">
        <span className="text-sm text-gray-600">
          Showing 1 to 3 of 24 results
        </span>
        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
};

export default CourseList;
