import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/common/components/ui/avatar";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/common/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/common/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/common/components/ui/tabs";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreVertical,
  Filter,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import type { PaginationInfo } from "@/documentManagement/interfaces/document";
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";
import { useViolationStore } from "../stores/useViolationStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import { useForumStore } from "../stores/useForumStore";
import { PostDetailModal } from "@/forumManagement/components/PostDetailModal";
import { forumService } from "../services/ForumService";
import { getPostIdFromComment } from "../utils/commentUtils";

const ViolationRecords = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    violations,
    totalCount,
    isLoading,
    error,
    filters,
    fetchViolations,
    setFilters,
    approveReport,
    rejectReport,
  } = useViolationStore();

  const {
    currentPost,
    getPostById,
    getComments,
    isLoading: forumLoading,
  } = useForumStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedView, setSelectedView] = useState<"all" | "reports">("all");
  const [selectedDetectionType, setSelectedDetectionType] = useState<
    "all" | "auto" | "manual"
  >("all");
  const [selectedContentType, setSelectedContentType] = useState<
    "all" | "post" | "comment"
  >("all");
  const [selectedRules, setSelectedRules] = useState<number[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [selectedViolation, setSelectedViolation] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rules, setRules] = useState<
    Array<{ id: number; content: string; ruleType: string; severity?: string }>
  >([]);
  const [modalVisibleComments, setModalVisibleComments] = useState(8);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (user?.schoolId) {
      setFilters({ schoolId: user.schoolId });
      forumService.getRules(user.schoolId).then(setRules);
    }
  }, [user?.schoolId, setFilters]);

  useEffect(() => {
    if (filters.schoolId) {
      fetchViolations();
    }
  }, [filters, fetchViolations]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (selectedPostId) {
      getPostById(selectedPostId);
      getComments(selectedPostId);
    }
  }, [selectedPostId, getPostById, getComments]);

  const handleViewChange = (view: "all" | "reports") => {
    setSelectedView(view);
    setFilters({
      sourceType: view === "reports" ? "report" : undefined,
      pageNumber: 1,
    });
  };

  const handlePageChange = (page: number) => {
    setFilters({ pageNumber: page });
  };

  const handleApprove = async (violation: any) => {
    if (!violation.id) return;

    setActionLoading(true);
    try {
      const success = await approveReport(violation.id);
      if (success) {
        toast.success("Đã chấp nhận báo cáo");
        setSelectedViolation(null);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi duyệt báo cáo");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (violation: any) => {
    if (!violation.id) return;

    setActionLoading(true);
    try {
      const success = await rejectReport(violation.id);
      if (success) {
        toast.success("Đã từ chối báo cáo");
        setSelectedViolation(null);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi từ chối báo cáo");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleRule = (ruleId: number) => {
    setSelectedRules((prev) =>
      prev.includes(ruleId)
        ? prev.filter((r) => r !== ruleId)
        : [...prev, ruleId]
    );
  };

  const toggleSeverity = (severity: string) => {
    setSelectedSeverities((prev) =>
      prev.includes(severity)
        ? prev.filter((s) => s !== severity)
        : [...prev, severity]
    );
  };

  const filteredViolations = violations.filter((violation) => {
    const matchesSearch =
      searchQuery === "" ||
      violation.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      violation.ruleName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      violation.postTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      violation.commentContent
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesDetectionType =
      selectedDetectionType === "all" ||
      (selectedDetectionType === "auto" && violation.sourceType === "auto") ||
      (selectedDetectionType === "manual" && violation.sourceType === "report");

    const matchesContentType =
      selectedContentType === "all" ||
      (selectedContentType === "post" && violation.postId) ||
      (selectedContentType === "comment" && violation.commentId);

    const matchesRule =
      selectedRules.length === 0 ||
      (violation.matchedRuleId &&
        selectedRules.includes(violation.matchedRuleId));

    const violationRule = rules.find((r) => r.id === violation.matchedRuleId);
    const violationSeverity = violationRule?.severity;

    const matchesSeverity =
      selectedSeverities.length === 0 ||
      (violationSeverity && selectedSeverities.includes(violationSeverity)) ||
      (!violationSeverity && selectedSeverities.includes("na"));

    return (
      matchesSearch &&
      matchesDetectionType &&
      matchesContentType &&
      matchesRule &&
      matchesSeverity
    );
  });

  const sortedViolations = [...filteredViolations].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "score-desc":
        return b.violationScore - a.violationScore;
      case "score-asc":
        return a.violationScore - b.violationScore;
      default:
        return 0;
    }
  });

  const pagination: PaginationInfo = {
    currentPage: filters.pageNumber,
    totalPages: Math.ceil(totalCount / filters.pageSize),
    totalCount: totalCount,
    pageSize: filters.pageSize,
  };

  const getSourceBadge = (source: string) => {
    const badges = {
      auto: <Badge className="bg-blue-500 text-white">Tự động</Badge>,
      report: <Badge className="bg-orange-500 text-white">Báo cáo</Badge>,
      manual: <Badge className="bg-purple-500 text-white">Thủ công</Badge>,
    };
    return badges[source as keyof typeof badges] || <Badge>Unknown</Badge>;
  };

  const getSeverityBadge = (ruleId?: number) => {
    const rule = rules.find((r) => r.id === ruleId);
    const severity = rule?.severity;

    if (!severity) return <span className="text-gray-500">Quản trị</span>;

    if (severity === "critical")
      return <span className="text-red-600 font-medium">Nghiêm trọng</span>;
    if (severity === "high")
      return <span className="text-red-500 font-medium">Cao</span>;
    if (severity === "medium")
      return <span className="text-orange-500 font-medium">Trung bình</span>;

    return <span className="text-gray-500">Quản trị</span>;
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
    setSelectedDetectionType("all");
    setSelectedContentType("all");
    setSelectedRules([]);
    setSelectedSeverities([]);
    setSortBy("newest");
  };

  const isReport = (violation: any) => violation.sourceType === "report";
  const getStatus = (violation: any) => {
    if (violation.sourceType === "report") {
      if (!violation.status) {
        return violation.violationScore > 0 ? "approved" : "pending";
      }
      return violation.status;
    }
    return "approved";
  };

  const handleViewPost = async (violation: any) => {
    console.log("handleViewPost called with:", violation);
    let postId = violation.postId;

    if (!postId && violation.commentId) {
      toast.info("Đang tải thông tin bài viết...");
      postId = await getPostIdFromComment(violation.commentId);
      console.log("Got postId from comment:", postId);
    }

    if (postId) {
      console.log("Setting postId:", postId, "commentId:", violation.commentId);
      setSelectedPostId(postId);
      setSelectedCommentId(violation.commentId || null);
    } else {
      toast.error("Không tìm thấy bài viết");
    }
  };

  return (
    <div className="w-full h-full overflow-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Vi phạm & Báo cáo</h1>
            <p className="text-gray-600 mt-1">
              Quản lý vi phạm và xử lý báo cáo từ người dùng
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <Tabs
              value={selectedView}
              onValueChange={(v) => handleViewChange(v as any)}
            >
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="all">Tất cả Vi phạm</TabsTrigger>
                <TabsTrigger value="reports">Báo cáo chờ xử lý</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-4 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên, quy tắc, nội dung..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Select
                  value={selectedDetectionType}
                  onValueChange={(v) => setSelectedDetectionType(v as any)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Loại phát hiện" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="auto">Tự động</SelectItem>
                    <SelectItem value="manual">Thủ công</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedContentType}
                  onValueChange={(v) => setSelectedContentType(v as any)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Loại nội dung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="post">Bài viết</SelectItem>
                    <SelectItem value="comment">Bình luận</SelectItem>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="w-4 h-4" />
                      Quy tắc{" "}
                      {selectedRules.length > 0 && `(${selectedRules.length})`}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {rules.map((rule) => (
                      <DropdownMenuCheckboxItem
                        key={rule.id}
                        checked={selectedRules.includes(rule.id)}
                        onCheckedChange={() => toggleRule(rule.id)}
                      >
                        {rule.content}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="w-4 h-4" />
                      Mức độ{" "}
                      {selectedSeverities.length > 0 &&
                        `(${selectedSeverities.length})`}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuCheckboxItem
                      checked={selectedSeverities.includes("critical")}
                      onCheckedChange={() => toggleSeverity("critical")}
                    >
                      Nghiêm trọng
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={selectedSeverities.includes("high")}
                      onCheckedChange={() => toggleSeverity("high")}
                    >
                      Cao
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={selectedSeverities.includes("medium")}
                      onCheckedChange={() => toggleSeverity("medium")}
                    >
                      Trung bình
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={selectedSeverities.includes("na")}
                      onCheckedChange={() => toggleSeverity("na")}
                    >
                      N/A
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Select value={sortBy} onValueChange={setSortBy}>
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
                  selectedDetectionType !== "all" ||
                  selectedContentType !== "all" ||
                  selectedRules.length > 0 ||
                  selectedSeverities.length > 0 ||
                  sortBy !== "newest") && (
                  <Button variant="ghost" onClick={handleClearFilters}>
                    Xóa bộ lọc
                  </Button>
                )}
              </div>

              <div className="text-sm text-gray-600">
                Tìm thấy <strong>{sortedViolations.length}</strong> vi phạm
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Đang tải...</p>
              </div>
            ) : sortedViolations.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người vi phạm</TableHead>
                      <TableHead>Nội dung</TableHead>
                      <TableHead>Quy tắc</TableHead>
                      <TableHead>Điểm</TableHead>
                      <TableHead>Mức độ</TableHead>
                      <TableHead>Nguồn</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedViolations.map((violation) => (
                      <TableRow key={violation.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              {violation.userAvatar ? (
                                <AvatarImage src={violation.userAvatar} />
                              ) : (
                                <AvatarFallback className="bg-gradient-to-br bg-sky-400 hover:bg-sky-500 text-white text-xs">
                                  {violation.userName
                                    ?.substring(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {violation.userName}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="space-y-1">
                            {violation.postId && (
                              <>
                                <div className="text-xs text-gray-500">
                                  Bài viết
                                </div>
                                <p className="text-sm font-medium truncate">
                                  {violation.postTitle}
                                </p>
                              </>
                            )}
                            {violation.commentId && (
                              <>
                                <div className="text-xs text-gray-500">
                                  Bình luận
                                </div>
                                <p className="text-sm truncate">
                                  {violation.commentContent}
                                </p>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {violation.ruleName || "Quản trị viên"}
                          </div>
                          {violation.pattern && (
                            <div className="text-xs text-gray-500 truncate max-w-[150px]">
                              {violation.pattern}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-lg">
                            {violation.violationScore}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getSeverityBadge(violation.matchedRuleId)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getSourceBadge(violation.sourceType)}
                            {violation.reporterName && (
                              <div className="text-xs text-gray-500">
                                Báo cáo: {violation.reporterName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(violation.createdAt)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={getStatus(violation)}
                            type="report"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    setSelectedViolation(violation)
                                  }
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Chi tiết
                                </DropdownMenuItem>
                                {(violation.postId || violation.commentId) && (
                                  <DropdownMenuItem
                                    onClick={() => handleViewPost(violation)}
                                  >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Xem bài viết
                                  </DropdownMenuItem>
                                )}
                                {isReport(violation) &&
                                  getStatus(violation) === "pending" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => handleApprove(violation)}
                                        disabled={actionLoading}
                                        className="text-green-600"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Chấp nhận
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleReject(violation)}
                                        disabled={actionLoading}
                                        className="text-red-600"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Từ chối
                                      </DropdownMenuItem>
                                    </>
                                  )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <DocumentPagination
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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

      <Dialog
        open={!!selectedViolation}
        onOpenChange={() => setSelectedViolation(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedViolation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Chi tiết Vi phạm #{selectedViolation.id}
                  {getSourceBadge(selectedViolation.sourceType)}
                </DialogTitle>
                <DialogDescription>
                  {isReport(selectedViolation)
                    ? "Xem xét và xử lý báo cáo vi phạm"
                    : "Thông tin chi tiết về vi phạm"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Avatar className="w-12 h-12">
                    {selectedViolation.userAvatar ? (
                      <AvatarImage src={selectedViolation.userAvatar} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white">
                        {selectedViolation.userName
                          ?.substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-semibold text-lg">
                      {selectedViolation.userName}
                    </div>
                    <div className="text-sm text-gray-500">
                      Vi phạm lúc: {formatDate(selectedViolation.createdAt)}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Nội dung vi phạm:</h4>
                  {selectedViolation.postId && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Bài viết</div>
                      <p className="font-medium">
                        {selectedViolation.postTitle}
                      </p>
                    </div>
                  )}
                  {selectedViolation.commentId && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">
                        Bình luận
                      </div>
                      <p className="text-sm">
                        {selectedViolation.commentContent}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Quy tắc vi phạm:</h4>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">
                      {selectedViolation.ruleName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Điểm vi phạm:</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {selectedViolation.violationScore}
                      </span>
                      {getSeverityBadge(selectedViolation.matchedRuleId)}
                    </div>
                  </div>
                </div>

                {selectedViolation.pattern && (
                  <div>
                    <h4 className="font-semibold mb-2">Pattern khớp:</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg font-mono">
                      {selectedViolation.pattern}
                    </p>
                  </div>
                )}

                {isReport(selectedViolation) &&
                  selectedViolation.reportReason && (
                    <div>
                      <h4 className="font-semibold mb-2">Lý do báo cáo:</h4>
                      <p className="text-sm text-gray-700 bg-orange-50 p-4 rounded-lg border border-orange-200">
                        {selectedViolation.reportReason}
                      </p>
                    </div>
                  )}

                {selectedViolation.reporterName && (
                  <div>
                    <h4 className="font-semibold mb-2">Người báo cáo:</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedViolation.reporterName}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="font-semibold">Trạng thái:</span>
                  <StatusBadge
                    status={getStatus(selectedViolation)}
                    type="report"
                  />
                </div>

                {selectedViolation.reviewedAt && (
                  <div className="text-sm text-gray-600">
                    Đã xử lý lúc: {formatDate(selectedViolation.reviewedAt)}
                  </div>
                )}

                {isReport(selectedViolation) &&
                  getStatus(selectedViolation) === "pending" && (
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        className="flex-1 gap-2"
                        variant="default"
                        onClick={() => handleApprove(selectedViolation)}
                        disabled={actionLoading}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Chấp nhận báo cáo
                      </Button>
                      <Button
                        className="flex-1 gap-2"
                        variant="destructive"
                        onClick={() => handleReject(selectedViolation)}
                        disabled={actionLoading}
                      >
                        <XCircle className="w-4 h-4" />
                        Từ chối báo cáo
                      </Button>
                    </div>
                  )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PostDetailModal
        isOpen={!!selectedPostId}
        post={currentPost}
        visibleComments={modalVisibleComments}
        isLoading={forumLoading}
        highlightCommentId={selectedCommentId}
        onClose={() => {
          setSelectedPostId(null);
          setSelectedCommentId(null);
        }}
        onViewDetails={(postId) => navigate(`/forum/posts/${postId}`)}
        onRefreshComments={async () => {
          if (selectedPostId) await getComments(selectedPostId);
        }}
        onLoadMoreComments={() => setModalVisibleComments((prev) => prev + 8)}
        onSubmitComment={async () => {}}
        onImageClick={() => {}}
        onTyping={() => {}}
      />
    </div>
  );
};

export default ViolationRecords;
