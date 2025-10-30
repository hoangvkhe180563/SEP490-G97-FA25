import React, { useEffect, useMemo, useState } from "react";
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
import { documentService } from "@/documentManagement/services/documentService";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";

const CourseList: React.FC = () => {
  const courses = useCourseStore((s) => s.courses);
  const fetchCourses = useCourseStore((s) => s.fetchCourses);
  const totalCourses = useCourseStore((s) => s.total);
  const page = useCourseStore((s) => s.page);
  const pageSize = useCourseStore((s) => s.pageSize);
  const filterAppUsers = useAppUserStore((s) => s.filterAppUsers);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const authUser = useAuthStore((s) => s.user);

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
      if (authUser?.schoolId)
        fetchCourses({
          page: p,
          pageSize: pageSize || 10,
          isApproved: true,
          schoolId: authUser?.schoolId,
        });
    }
  };

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

  useEffect(() => {
    (async () => {
      try {
        if (authUser?.schoolId)
          fetchCourses({
            page: 1,
            pageSize: pageSize || 10,
            isApproved: true,
            schoolId: authUser?.schoolId,
          });
      } catch (err) {
        console.error("Failed to load courses", err);
      }
    })();
  }, [fetchCourses, pageSize, authUser?.schoolId]);

  const shown: CourseType[] = (courses ?? []).map((c: CourseListDto) => ({
    id: c.id,
    name: c.name,
    information: c.information ?? null,
    imageUrl: c.imageUrl ?? null,
    price: c.price,
    grade: c.grade,
    subjectId: c.subjectId,
    subjectName: subjects.find((s) => s.id === c.subjectId)?.name || "",
    schoolId: c.schoolId ?? null,
    isFeatured: c.isFeatured,
    status: c.status,
    createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "",
    startAt: c.startAt ? new Date(c.startAt).toLocaleDateString() : "",
    endAt: c.endAt ? new Date(c.endAt).toLocaleDateString() : "",
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : null,
    updatedBy: teachers.find((t) => t.id === c.updatedBy)?.fullname || "",
    createdBy: teachers.find((t) => t.id === c.createdBy)?.fullname || "",
    chapters: c.chapters ?? [],
    isApproved: c.isApproved,
  }));

  const startRange = page && pageSize ? (page - 1) * pageSize + 1 : 0;
  const countOnPage = shown.length;
  const endRange = startRange + countOnPage - 1;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <CourseFilterTeacher />

      <div className="w-full overflow-x-auto rounded-md border border-gray-200">
        <Table className="min-w-full text-sm">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="px-3 py-2 min-w-[180px]">
                Khóa học
              </TableHead>
              <TableHead className="px-3 py-2 min-w-[120px]">
                Giảng viên
              </TableHead>
              <TableHead className="px-3 py-2 min-w-[100px]">Chủ đề</TableHead>
              <TableHead className="px-3 py-2 min-w-[80px]">Khối lớp</TableHead>
              <TableHead className="px-3 py-2 min-w-[90px]">
                Trạng thái
              </TableHead>
              <TableHead className="px-3 py-2 min-w-[100px]">
                Ngày tạo
              </TableHead>
              <TableHead className="px-3 py-2 min-w-[100px]">
                Ngày bắt đầu
              </TableHead>
              <TableHead className="px-3 py-2 min-w-[100px]">
                Ngày kết thúc
              </TableHead>
              <TableHead className="px-3 py-2 text-center min-w-[90px]">
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
                <TableCell colSpan={10} className="h-12" />
              </TableRow>
            )}

            {shown.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-16 text-center text-gray-500"
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
