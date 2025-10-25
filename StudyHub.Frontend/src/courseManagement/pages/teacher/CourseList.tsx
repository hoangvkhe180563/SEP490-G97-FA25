import React, { useEffect, useMemo } from "react";
import CourseItem from "../../components/CourseItem";
import type { CourseListDto as CourseType } from "@/courseManagement/interfaces/types";
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
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/common/components/ui/pagination";
import CourseFilterTeacher from "@/courseManagement/components/CourseFilterTeacher";

import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import type { CourseListDto } from "@/courseManagement/types/api";

const CourseList: React.FC = () => {
  const courses = useCourseStore((s) => s.courses);
  const fetchCourses = useCourseStore((s) => s.fetchCourses);
  const totalCourses = useCourseStore((s) => s.total);
  const page = useCourseStore((s) => s.page);
  const pageSize = useCourseStore((s) => s.pageSize);

  const totalPages = useMemo(() => {
    if (totalCourses && pageSize) {
      return Math.ceil(totalCourses / pageSize);
    }
    return 1;
  }, [totalCourses, pageSize]);

  const paginationRange = useMemo(() => {
    const currentPage = page || 1;
    const range: number[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
      return range;
    }

    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }

    if (range[0] > 1) {
      if (range[0] > 2) range.unshift(-1);
      range.unshift(1);
    }

    if (range[range.length - 1] < totalPages) {
      if (range[range.length - 1] < totalPages - 1) range.push(-1);
      if (range[range.length - 1] !== totalPages) range.push(totalPages);
    }

    const finalRange = range.filter(
      (item, index) => item !== -1 || range[index - 1] !== -1
    );

    return finalRange;
  }, [page, totalPages]);

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      fetchCourses({ page: p, pageSize: pageSize || 10 });
    }
  };

  useEffect(() => {
    (async () => {
      try {
        fetchCourses({ page: 1, pageSize: pageSize || 10 });
      } catch (err) {
        console.error("Failed to load courses", err);
      }
    })();
  }, [fetchCourses, pageSize]);

  const shown: CourseType[] = (courses ?? []).map((c: CourseListDto) => ({
    id: c.id,
    name: c.name,
    information: c.information ?? null,
    imageUrl: c.imageUrl ?? null,
    price: c.price,
    grade: c.grade,
    subjectId: c.subjectId,
    schoolId: c.schoolId ?? null,
    isFeatured: c.isFeatured,
    status: c.status,
    createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "",
    startAt: c.startAt ? new Date(c.startAt).toLocaleDateString() : "",
    endAt: c.endAt ? new Date(c.endAt).toLocaleDateString() : "",
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : null,
    updatedBy: c.updatedBy ?? null,
    createdBy: c.createdBy,
    chapters: c.chapters ?? [],
  }));

  const startRange = page && pageSize ? (page - 1) * pageSize + 1 : 0;
  const countOnPage = shown.length;
  const endRange = startRange + countOnPage - 1;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <CourseFilterTeacher />

      <div className="overflow-hidden rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khóa học
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giảng viên
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chủ đề
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khối lớp
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trường
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày bắt đầu
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày kết thúc
              </TableHead>
              <TableHead className="w-36 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((c: CourseType) => (
              <CourseItem key={c.id} course={c} />
            ))}
            {shown.length < 3 && (
              <TableRow>
                <TableCell colSpan={9} className="h-20" />
              </TableRow>
            )}
            {shown.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-20 text-center text-gray-500"
                >
                  Không tìm thấy khóa học nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4 px-2">
        <span className="text-sm text-gray-600">
          {totalCourses > 0
            ? `Hiển thị từ ${startRange} đến ${endRange} trong tổng số ${totalCourses} kết quả`
            : "Không tìm thấy kết quả nào"}
        </span>

        {totalPages > 1 && (
          <div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e: any) => {
                      e.preventDefault();
                      goToPage((page || 1) - 1);
                    }}
                    className={
                      (page || 1) === 1
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>

                {paginationRange.map((p) =>
                  p === -1 ? (
                    <PaginationItem key="ellipsis">
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === (page || 1)}
                        onClick={(e: any) => {
                          e.preventDefault();
                          goToPage(p);
                        }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e: any) => {
                      e.preventDefault();
                      goToPage((page || 1) + 1);
                    }}
                    className={
                      (page || 1) === totalPages
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;
