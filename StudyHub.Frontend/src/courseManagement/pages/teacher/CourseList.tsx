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
import { documentService } from "@/documentManagement/services/documentService";
import type { CourseListDto } from "@/courseManagement/types/api";

const CourseList: React.FC = () => {
  const courses = useCourseStore((s) => s.courses);
  const fetchCourses = useCourseStore((s) => s.fetchCourses);
  const totalCourses = useCourseStore((s) => s.total);
  const page = useCourseStore((s) => s.page);
  const pageSize = useCourseStore((s) => s.pageSize);

  // Khởi tạo/fetch dữ liệu lần đầu
  useEffect(() => {
    // Đảm bảo fetch đúng pageSize đã cấu hình trong store (mặc định là 10 ở đây)
    fetchCourses({ page: 1, pageSize: pageSize || 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tính toán tổng số trang
  const totalPages = useMemo(() => {
    if (totalCourses && pageSize) {
      return Math.ceil(totalCourses / pageSize);
    }
    return 1;
  }, [totalCourses, pageSize]);

  // Tính toán các trang hiển thị (chỉ hiển thị 3 trang gần trang hiện tại)
  const paginationRange = useMemo(() => {
    const currentPage = page || 1;
    const range: number[] = [];
    const maxPagesToShow = 5; // Số trang tối đa muốn hiển thị (ví dụ: [1...4, 5, 6...9])

    // Trường hợp ít trang, hiển thị tất cả
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
      return range;
    }

    // Trường hợp nhiều trang
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, currentPage + 1);

    // Xây dựng dãy trang, đảm bảo có ít nhất 3 trang (hoặc nhiều hơn)
    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }

    // Nếu trang đầu tiên không phải là 1, thêm dấu "..."
    if (range[0] > 1) {
      if (range[0] > 2) range.unshift(-1); // Sử dụng -1 để đại diện cho Ellipsis
      range.unshift(1); // Thêm trang 1
    }

    // Nếu trang cuối cùng không phải là totalPages, thêm dấu "..."
    if (range[range.length - 1] < totalPages) {
      if (range[range.length - 1] < totalPages - 1) range.push(-1); // Sử dụng -1 cho Ellipsis
      if (range[range.length - 1] !== totalPages) range.push(totalPages); // Thêm trang cuối
    }

    // Loại bỏ các Ellipsis trùng lặp nếu có
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

  // Subjects fetched from backend (used instead of static CATEGORY_OPTIONS)
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await documentService.getSubjects();
        if (mounted && Array.isArray(res)) {
          // normalize to { id, name }
          setSubjects(res.map((s: any) => ({ id: s.id, name: s.name })));
        }
      } catch (err) {
        // ignore for now
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const categoryLabel = (id?: string | number | null) => {
    if (id === undefined || id === null) return undefined;
    const sid = Number(id);
    const found = subjects.find((s) => s.id === sid);
    return found ? found.name : String(id);
  };

  const shown = (courses ?? []).map(
    (c: CourseListDto) =>
      ({
        id: c.id,
        name: c.name,
        information: c.information ?? null,
        imageUrl: c.imageUrl ?? null,
        price: c.price,
        instructorName: c.instructorName ?? null,
        category: categoryLabel(c.category),
        grade: c.grade,
        status: c.status,
        createdAt: c.createdAt
          ? new Date(c.createdAt).toLocaleDateString()
          : undefined,
      } as CourseType)
  );

  // Tính toán phạm vi hiển thị hiện tại cho hiển thị "Showing X to Y of Z results"
  const startRange = page && pageSize ? (page - 1) * pageSize + 1 : 0;
  // Số khóa học thực tế đang hiển thị trên trang hiện tại
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
                Course
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Instructor
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
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
            {shown.map((c: CourseType) => (
              <CourseItem key={c.id} course={c} />
            ))}
            {shown.length < 3 && (
              <TableRow>
                <TableCell colSpan={9} className="h-20" />
              </TableRow>
            )}
            {/* Thêm thông báo "Không có dữ liệu" nếu shown rỗng và đã fetch xong */}
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
          {/* Hiển thị số lượng khóa học thực tế */}
          {totalCourses > 0
            ? `Showing ${startRange} to ${endRange} of ${totalCourses} results`
            : "No results found"}
        </span>

        {/* Chỉ hiển thị Pagination nếu có nhiều hơn 1 trang */}
        {totalPages > 1 && (
          <div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    // Disable nếu đang ở trang 1
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
                    // Dấu 3 chấm
                    <PaginationItem key="ellipsis">
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    // Các nút trang
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
                    // Disable nếu đang ở trang cuối
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
