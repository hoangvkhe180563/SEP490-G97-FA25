import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { Switch } from "@/common/components/ui/switch";
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
  DialogFooter,
} from "@/common/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Power,
  Loader2,
  MoreVertical,
  X,
  AlertTriangle,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";
import { useRuleStore } from "../stores/useRuleStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { toast } from "sonner";
import { Textarea } from "@/common/components/ui/textarea";

const SEVERITY_LEVELS = [
  { value: "Medium", label: "Trung bình", color: "bg-yellow-500" },
  { value: "High", label: "Cao", color: "bg-orange-500" },
  { value: "Critical", label: "Nghiêm trọng", color: "bg-red-500" },
];

const ForumRuleManagement = () => {
  const { user } = useAuthStore();
  const {
    rules,
    isLoading,
    getRules,
    getRuleById,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleStatus,
    createPattern,
    deletePattern,
    togglePatternStatus,
  } = useRuleStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [ruleTypeFilter, setRuleTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPatternDialog, setShowPatternDialog] = useState(false);
  const [newPattern, setNewPattern] = useState("");
  const pageSize = 10;

  const [formData, setFormData] = useState({
    ruleName: "",
    ruleType: "",
    severity: "Medium",
    violationScore: 5,
    description: "",
    patterns: [] as string[],
  });

  const [patternInput, setPatternInput] = useState("");

  useEffect(() => {
    if (user?.schoolId) {
      loadRules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId]);

  const loadRules = useCallback(async () => {
    if (!user?.schoolId) return;
    await getRules(user.schoolId);
  }, [user?.schoolId, getRules]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const availableRuleTypes = useMemo(() => {
    const types = new Set(rules.map((r) => r.rule_type));
    return Array.from(types);
  }, [rules]);

  const filteredAndSortedRules = useMemo(() => {
    const filtered = rules.filter((rule) => {
      const matchesSearch =
        rule.rule_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.rule_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false;

      const matchesRuleType =
        ruleTypeFilter === "all" || rule.rule_type === ruleTypeFilter;

      const matchesSeverity =
        severityFilter === "all" || rule.severity === severityFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && rule.is_active) ||
        (statusFilter === "inactive" && !rule.is_active);

      return (
        matchesSearch && matchesRuleType && matchesSeverity && matchesStatus
      );
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
        case "name":
          return a.rule_name.localeCompare(b.rule_name);
        case "severity": {
          const severityOrder: Record<string, number> = {
            Critical: 3,
            High: 2,
            Medium: 1,
          };
          return (
            (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
          );
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    rules,
    searchQuery,
    ruleTypeFilter,
    severityFilter,
    statusFilter,
    sortBy,
  ]);

  const paginatedRules = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedRules.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedRules, currentPage]);

  const pagination = {
    currentPage,
    totalPages: Math.ceil(filteredAndSortedRules.length / pageSize),
    totalCount: filteredAndSortedRules.length,
    pageSize,
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

  const getSeverityColor = (severity: string) => {
    const level = SEVERITY_LEVELS.find((s) => s.value === severity);
    return level?.color || "bg-gray-500";
  };

  const getSeverityLabel = (severity: string) => {
    const level = SEVERITY_LEVELS.find((s) => s.value === severity);
    return level?.label || severity;
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setRuleTypeFilter("all");
    setSeverityFilter("all");
    setStatusFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const handleAddPattern = () => {
    if (patternInput.trim()) {
      setFormData({
        ...formData,
        patterns: [...formData.patterns, patternInput.trim()],
      });
      setPatternInput("");
    }
  };

  const handleRemovePattern = (index: number) => {
    setFormData({
      ...formData,
      patterns: formData.patterns.filter((_, i) => i !== index),
    });
  };

  const handleEdit = (rule: any) => {
    setSelectedRule(rule);
    setFormData({
      ruleName: rule.rule_name,
      ruleType: rule.rule_type,
      severity: rule.severity,
      violationScore: rule.violation_score,
      description: rule.description || "",
      patterns: [],
    });
    setShowEditDialog(true);
  };

  const handleCreate = async () => {
    if (!user?.schoolId) return;
    if (!formData.ruleName.trim()) {
      toast.error("Vui lòng nhập tên rule");
      return;
    }
    if (!formData.ruleType.trim()) {
      toast.error("Vui lòng nhập loại rule");
      return;
    }

    setActionLoading(true);
    const result = await createRule({
      schoolId: user.schoolId,
      ruleName: formData.ruleName,
      ruleType: formData.ruleType,
      severity: formData.severity,
      violationScore: formData.violationScore,
      description: formData.description || undefined,
      patterns: formData.patterns,
    });
    setActionLoading(false);

    if (result?.success) {
      toast.success("Tạo luật thành công");
      setShowCreateDialog(false);
      setFormData({
        ruleName: "",
        ruleType: "",
        severity: "Medium",
        violationScore: 5,
        description: "",
        patterns: [],
      });
      setPatternInput("");
      loadRules();
    } else {
      toast.error(result?.message || "Có lỗi xảy ra");
    }
  };

  const handleUpdate = async () => {
    if (!selectedRule) return;
    if (!formData.ruleName.trim()) {
      toast.error("Vui lòng nhập tên rule");
      return;
    }
    if (!formData.ruleType.trim()) {
      toast.error("Vui lòng nhập loại rule");
      return;
    }

    setActionLoading(true);
    const result = await updateRule(selectedRule.id, {
      ruleName: formData.ruleName,
      ruleType: formData.ruleType,
      severity: formData.severity,
      violationScore: formData.violationScore,
      description: formData.description || undefined,
    });
    setActionLoading(false);

    if (result?.success) {
      toast.success("Cập nhật rule thành công");
      setShowEditDialog(false);
      setSelectedRule(null);
      setFormData({
        ruleName: "",
        ruleType: "",
        severity: "Medium",
        violationScore: 5,
        description: "",
        patterns: [],
      });
      loadRules();
    } else {
      toast.error(result?.message || "Có lỗi xảy ra");
    }
  };

  const handleToggleStatus = async (rule: any) => {
    setActionLoading(true);
    const result = await toggleRuleStatus(rule.id);
    setActionLoading(false);

    if (result?.success) {
      toast.success(
        rule.is_active ? "Đã vô hiệu hóa rule" : "Đã kích hoạt rule"
      );
      loadRules();
    } else {
      toast.error(result?.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async () => {
    if (!selectedRule) return;

    setActionLoading(true);
    const result = await deleteRule(selectedRule.id);
    setActionLoading(false);

    if (result?.success) {
      toast.success("Xóa rule thành công");
      setShowDeleteDialog(false);
      setSelectedRule(null);
      loadRules();
    } else {
      toast.error(result?.message || "Có lỗi xảy ra");
    }
  };

  const handleAddNewPattern = async () => {
    if (!selectedRule || !newPattern.trim()) return;

    setActionLoading(true);
    const result = await createPattern({
      ruleId: selectedRule.id,
      pattern: newPattern.trim(),
    });

    if (result?.success) {
      const updatedRuleData = await getRuleById(selectedRule.id);
      setActionLoading(false);

      if (updatedRuleData?.success) {
        setSelectedRule(updatedRuleData.data);
        toast.success("Thêm pattern thành công");
        setNewPattern("");
        loadRules();
      }
    } else {
      setActionLoading(false);
      toast.error(result?.message || "Có lỗi xảy ra");
    }
  };

  const handleDeletePattern = async (patternId: number) => {
    setActionLoading(true);
    const result = await deletePattern(patternId);
    setActionLoading(false);

    if (result?.success) {
      toast.success("Xóa pattern thành công");
      loadRules();
    } else {
      toast.error(result?.message || "Có lỗi xảy ra");
    }
  };

  const handleTogglePatternStatus = async (patternId: number) => {
    if (!selectedRule) return;

    setActionLoading(true);
    const result = await togglePatternStatus(patternId);

    if (result?.success) {
      const updatedRuleData = await getRuleById(selectedRule.id);
      setActionLoading(false);

      if (updatedRuleData?.success && updatedRuleData.data) {
        setSelectedRule(updatedRuleData.data);
        toast.success("Đã cập nhật trạng thái pattern");
        loadRules();
      }
    } else {
      setActionLoading(false);
      toast.error(result?.message || "Có lỗi xảy ra");
    }
  };

  return (
    <div className="w-full h-full overflow-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý luật</h1>
            <p className="text-gray-600 mt-1">
              Quản lý các quy tắc kiểm duyệt trong forum
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              setFormData({
                ruleName: "",
                ruleType: "",
                severity: "Medium",
                violationScore: 5,
                description: "",
                patterns: [],
              });
              setPatternInput("");
              setShowCreateDialog(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Tạo luật mới
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên, loại hoặc mô tả..."
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
                  value={ruleTypeFilter}
                  onValueChange={(value) => {
                    setRuleTypeFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Loại rule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả loại</SelectItem>
                    {availableRuleTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
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
                    <SelectItem value="all">Tất cả mức độ</SelectItem>
                    {SEVERITY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Vô hiệu</SelectItem>
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
                    <SelectItem value="name">Theo tên</SelectItem>
                    <SelectItem value="severity">Theo mức độ</SelectItem>
                  </SelectContent>
                </Select>

                {(searchQuery ||
                  ruleTypeFilter !== "all" ||
                  severityFilter !== "all" ||
                  statusFilter !== "all" ||
                  sortBy !== "newest") && (
                  <Button variant="ghost" onClick={handleClearFilters}>
                    Xóa bộ lọc
                  </Button>
                )}
              </div>

              <div className="text-sm text-gray-600">
                Tìm thấy <strong>{filteredAndSortedRules.length}</strong> rule
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : paginatedRules.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên Rule</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Mức độ</TableHead>
                      <TableHead>Điểm vi phạm</TableHead>
                      <TableHead>Mẫu vi phạm</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div className="font-medium">{rule.rule_name}</div>
                          {rule.description && (
                            <p className="text-sm text-gray-600 truncate max-w-xs">
                              {rule.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.rule_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getSeverityColor(
                              rule.severity
                            )} text-white`}
                          >
                            {getSeverityLabel(rule.severity)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {rule.violation_score}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRule(rule);
                              setShowPatternDialog(true);
                            }}
                          >
                            {rule.pattern_count} mẫu
                          </Button>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={rule.is_active} />
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(rule.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={actionLoading}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEdit(rule)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedRule(rule);
                                    setShowPatternDialog(true);
                                  }}
                                >
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Quản lý Mẫu
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(rule)}
                                >
                                  <Power className="w-4 h-4 mr-2" />
                                  {rule.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedRule(rule);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Xóa
                                </DropdownMenuItem>
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
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Không tìm thấy rule nào</p>
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

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo luật mới</DialogTitle>
            <DialogDescription>
              Tạo quy tắc kiểm duyệt mới cho forum
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên Rule *</label>
              <Input
                placeholder="Nhập tên rule..."
                value={formData.ruleName}
                onChange={(e) =>
                  setFormData({ ...formData, ruleName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Loại Rule *</label>
              <Input
                placeholder="VD: profanity, spam, sensitive..."
                value={formData.ruleType}
                onChange={(e) =>
                  setFormData({ ...formData, ruleType: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Mức độ nghiêm trọng *
                </label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) =>
                    setFormData({ ...formData, severity: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Điểm vi phạm *</label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.violationScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      violationScore: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                placeholder="Nhập mô tả..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mẫu (tùy chọn)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập mẫu..."
                  value={patternInput}
                  onChange={(e) => setPatternInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPattern();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddPattern}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.patterns.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.patterns.map((pattern, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {pattern}
                      <button
                        type="button"
                        onClick={() => handleRemovePattern(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={actionLoading}
            >
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={actionLoading}>
              {actionLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Tạo luật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          {selectedRule && (
            <>
              <DialogHeader>
                <DialogTitle>Chỉnh sửa Rule</DialogTitle>
                <DialogDescription>Cập nhật thông tin rule</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tên Rule *</label>
                  <Input
                    value={formData.ruleName}
                    onChange={(e) =>
                      setFormData({ ...formData, ruleName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Loại Rule *</label>
                  <Input
                    value={formData.ruleType}
                    onChange={(e) =>
                      setFormData({ ...formData, ruleType: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Mức độ nghiêm trọng *
                    </label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value) =>
                        setFormData({ ...formData, severity: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEVERITY_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Điểm vi phạm *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.violationScore}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          violationScore: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Mô tả</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  disabled={actionLoading}
                >
                  Hủy
                </Button>
                <Button onClick={handleUpdate} disabled={actionLoading}>
                  {actionLoading && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Lưu thay đổi
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPatternDialog} onOpenChange={setShowPatternDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedRule && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Quản lý mẫu - {selectedRule.rule_name}
                </DialogTitle>
                <DialogDescription>
                  Thêm hoặc quản lý các mẫu cho rule này
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập pattern mới..."
                    value={newPattern}
                    onChange={(e) => setNewPattern(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNewPattern();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddNewPattern}
                    disabled={actionLoading || !newPattern.trim()}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="border rounded-lg">
                  {selectedRule.patterns && selectedRule.patterns.length > 0 ? (
                    <div className="divide-y">
                      {selectedRule.patterns.map((pattern: any) => {
                        return (
                          <div
                            key={pattern.pattern_id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Switch
                                checked={pattern.is_active}
                                onCheckedChange={() =>
                                  handleTogglePatternStatus(pattern.pattern_id)
                                }
                                disabled={actionLoading}
                              />
                              {/* <span className="text-xs text-gray-500">
                                {pattern.is_active ? "Active" : "Inactive"}
                              </span> */}
                              <span
                                className={`${
                                  pattern.is_active
                                    ? "text-gray-900"
                                    : "text-gray-400"
                                }`}
                              >
                                {pattern.pattern}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeletePattern(pattern.pattern_id)
                              }
                              disabled={actionLoading}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Chưa có pattern nào
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPatternDialog(false);
                    setNewPattern("");
                  }}
                >
                  Đóng
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa rule "{selectedRule?.rule_name}"? Hành
              động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={actionLoading}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ForumRuleManagement;
