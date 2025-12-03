import React, { useEffect, useMemo } from "react";
import { formatDate } from "@/courseManagement/utils/formatDate";
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
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";
import CourseFilterTeacher from "@/courseManagement/components/CourseFilterTeacher";

import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import type { CourseListDto } from "@/courseManagement/types/api";
import { useAuthStore } from "@/auth/stores/useAuthStore";

const CourseList: React.FC = () => {
  const courses = useCourseStore((s) => s.courses);
  const fetchCourses = useCourseStore((s) => s.fetchCourses);
  const totalCourses = useCourseStore((s) => s.total);
  const page = useCourseStore((s) => s.page);
  const pageSize = useCourseStore((s) => s.pageSize);
  const authUser = useAuthStore((s) => s.user);

  const totalPages = useMemo(() => {
    if (totalCourses && pageSize) {
      return Math.ceil(totalCourses / pageSize);
    }
    return 1;
  }, [totalCourses, pageSize]);

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      if (authUser?.schoolId)
        fetchCourses({
          page: p,
          pageSize: pageSize || 10,
          schoolId: authUser?.schoolId,
        });
    }
  };

  useEffect(() => {
    (async () => {
      try {
        if (authUser?.schoolId)
          fetchCourses({
            page: 1,
            pageSize: pageSize || 10,
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
    subjectName: c.subject?.name ?? "",
    schoolId: c.schoolId ?? null,
    isFeatured: c.isFeatured,
    status: c.status,
    createdAt: c.createdAt ? formatDate(c.createdAt) : "",
    startAt: c.startAt ? formatDate(c.startAt) : "",
    endAt: c.endAt ? formatDate(c.endAt) : "",
    updatedAt: c.updatedAt ? formatDate(c.updatedAt) : null,
    updatedBy: c.updatedBy ?? null,
    createdBy: c.createdBy ?? null,
    teacherCreatedName: c.teacherCreatedName ?? "Giáo viên",
    teacherUpdatedName: c.teacherUpdatedName ?? null,
    chapters: c.chapters ?? [],
    isApproved: c.isApproved,
    difficulty: c.difficulty,
    length: c.length,
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
                Giáo viên
              </TableHead>
              <TableHead className="px-3 py-2 min-w-[100px]">Chủ đề</TableHead>
              <TableHead className="px-3 py-2 min-w-[80px]">Khối lớp</TableHead>
              <TableHead className="px-3 py-2 min-w-[100px]">
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

        <DocumentPagination
          pagination={{
            currentPage: page || 1,
            totalPages,
            totalCount: totalCourses || 0,
            pageSize: pageSize || 10,
          }}
          onPageChange={(p: number) => goToPage(p)}
        />
      </div>
    </div>
  );
};

export default CourseList;
