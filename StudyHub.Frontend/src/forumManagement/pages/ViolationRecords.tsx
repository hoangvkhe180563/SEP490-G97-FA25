// StudyHub.Frontend/src/forumManagement/moderator/pages/ViolationRecords.tsx
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import { Search, Eye } from "lucide-react";
import type { ViolationRecord } from "../interfaces/moderator";
import type { PaginationInfo } from "@/documentManagement/interfaces/document";
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";

const ViolationRecords = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const violations: ViolationRecord[] = useMemo(
    () => [
      {
        id: 1,
        user_id: "user-001",
        user_name: "Nguyễn Văn A",
        school_id: 1,
        post_id: 1,
        matched_rule_id: 1,
        rule_name: "Ngôn từ không phù hợp",
        pattern: "từ ngữ thô tục",
        violation_score: 20,
        source_type: "auto",
        created_at: "2024-10-23T10:00:00",
      },
      {
        id: 2,
        user_id: "user-002",
        user_name: "Trần Thị B",
        school_id: 1,
        comment_id: 5,
        matched_rule_id: 2,
        rule_name: "Spam nội dung",
        violation_score: 15,
        source_type: "report",
        reported_by: "user-010",
        reporter_name: "Phạm Văn K",
        created_at: "2024-10-23T09:30:00",
      },
      {
        id: 3,
        user_id: "user-003",
        user_name: "Lê Văn C",
        school_id: 1,
        post_id: 3,
        matched_rule_id: 3,
        rule_name: "Nội dung không liên quan",
        violation_score: 10,
        source_type: "manual",
        created_at: "2024-10-22T15:20:00",
      },
    ],
    []
  );

  const filteredAndSortedViolations = useMemo(() => {
    const filtered = violations.filter((violation) => {
      const matchesSearch =
        violation.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        violation.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        violation.rule_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSource =
        sourceFilter === "all" || violation.source_type === sourceFilter;

      const matchesSeverity =
        severityFilter === "all" ||
        (severityFilter === "high" && violation.violation_score >= 20) ||
        (severityFilter === "medium" &&
          violation.violation_score >= 10 &&
          violation.violation_score < 20) ||
        (severityFilter === "low" && violation.violation_score < 10);

      return matchesSearch && matchesSource && matchesSeverity;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "score-desc":
          return b.violation_score - a.violation_score;
        case "score-asc":
          return a.violation_score - b.violation_score;
        default:
          return 0;
      }
    });

    return filtered;
  }, [violations, searchQuery, sourceFilter, severityFilter, sortBy]);

  const paginatedViolations = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedViolations.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedViolations, currentPage]);

  const pagination: PaginationInfo = {
    currentPage,
    totalPages: Math.ceil(filteredAndSortedViolations.length / pageSize),
    totalCount: filteredAndSortedViolations.length,
    pageSize,
  };

  const getSourceBadge = (source: string) => {
    const badges = {
      auto: <Badge className="bg-blue-500 text-white">Tự động</Badge>,
      report: <Badge className="bg-orange-500 text-white">Báo cáo</Badge>,
      manual: <Badge className="bg-purple-500 text-white">Thủ công</Badge>,
    };
    return badges[source as keyof typeof badges] || <Badge>Unknown</Badge>;
  };

  const getSeverityBadge = (score: number) => {
    if (score >= 20)
      return <Badge className="bg-red-500 text-white">Cao</Badge>;
    if (score >= 10)
      return <Badge className="bg-orange-500 text-white">Trung bình</Badge>;
    return <Badge className="bg-yellow-500 text-white">Thấp</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSourceFilter("all");
    setSeverityFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  return (
    <div className="w-full h-full overflow-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lịch sử Vi phạm</h1>
            <p className="text-gray-600 mt-1">
              Xem lịch sử các vi phạm đã ghi nhận
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên, ID hoặc quy tắc vi phạm..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Select
                  value={sourceFilter}
                  onValueChange={(value) => {
                    setSourceFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Nguồn phát hiện" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="auto">Tự động</SelectItem>
                    <SelectItem value="report">Báo cáo</SelectItem>
                    <SelectItem value="manual">Thủ công</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={severityFilter}
                  onValueChange={(value) => {
                    setSeverityFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Mức độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="high">Cao (≥20)</SelectItem>
                    <SelectItem value="medium">Trung bình (10-19)</SelectItem>
                    <SelectItem value="low">Thấp (&lt;10)</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    setSortBy(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="oldest">Cũ nhất</SelectItem>
                    <SelectItem value="score-desc">Điểm cao nhất</SelectItem>
                    <SelectItem value="score-asc">Điểm thấp nhất</SelectItem>
                  </SelectContent>
                </Select>

                {(searchQuery ||
                  sourceFilter !== "all" ||
                  severityFilter !== "all" ||
                  sortBy !== "newest") && (
                  <Button variant="ghost" onClick={handleClearFilters}>
                    Xóa bộ lọc
                  </Button>
                )}
              </div>

              <div className="text-sm text-gray-600">
                Tìm thấy <strong>{filteredAndSortedViolations.length}</strong>{" "}
                vi phạm
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedViolations.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người vi phạm</TableHead>
                      <TableHead>Quy tắc</TableHead>
                      <TableHead>Điểm</TableHead>
                      <TableHead>Mức độ</TableHead>
                      <TableHead>Nguồn</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedViolations.map((violation) => (
                      <TableRow key={violation.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white text-xs">
                                {violation.user_name
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {violation.user_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {violation.user_id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {violation.rule_name}
                          </div>
                          {violation.pattern && (
                            <div className="text-xs text-gray-500">
                              {violation.pattern}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-lg">
                            {violation.violation_score}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getSeverityBadge(violation.violation_score)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getSourceBadge(violation.source_type)}
                            {violation.reporter_name && (
                              <div className="text-xs text-gray-500">
                                Báo cáo: {violation.reporter_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(violation.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <DocumentPagination
                  pagination={pagination}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  Không tìm thấy vi phạm nào
                </p>
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={handleClearFilters}
                >
                  Xóa bộ lọc
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViolationRecords;
