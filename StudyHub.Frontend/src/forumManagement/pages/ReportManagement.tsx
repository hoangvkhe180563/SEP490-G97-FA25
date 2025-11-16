// // StudyHub.Frontend/src/forumManagement/moderator/pages/ReportManagement.tsx
// import { useState, useMemo } from "react";
// import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
// import { Input } from "@/common/components/ui/input";
// import { Button } from "@/common/components/ui/button";
// import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/common/components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/common/components/ui/table";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/common/components/ui/dialog";
// import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
// import { StatusBadge } from "../components/StatusBadge";
// import type { Report } from "../interfaces/moderator";
// import type { PaginationInfo } from "@/documentManagement/interfaces/document";
// import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";

// const ReportManagement = () => {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [typeFilter, setTypeFilter] = useState("all");
//   const [sortBy, setSortBy] = useState("newest");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [selectedReport, setSelectedReport] = useState<Report | null>(null);
//   const pageSize = 10;

//   const reports: Report[] = useMemo(
//     () => [
//       {
//         id: 1,
//         user_id: "user-001",
//         user_name: "Nguyễn Văn A",
//         post_id: 1,
//         post_title: "Cách giải phương trình bậc hai",
//         reason: "Nội dung không phù hợp với diễn đàn học tập",
//         status: "pending",
//         created_at: "2024-10-23T10:00:00",
//       },
//       {
//         id: 2,
//         user_id: "user-002",
//         user_name: "Trần Thị B",
//         comment_id: 5,
//         comment_content: "Bình luận có từ ngữ không phù hợp...",
//         reason: "Ngôn từ thô tục, xúc phạm người khác",
//         status: "approved",
//         created_at: "2024-10-23T09:30:00",
//         reviewed_by: "moderator-001",
//         reviewed_at: "2024-10-23T10:15:00",
//       },
//       {
//         id: 3,
//         user_id: "user-003",
//         user_name: "Lê Văn C",
//         post_id: 3,
//         post_title: "Spam quảng cáo khóa học",
//         reason: "Spam nội dung quảng cáo",
//         status: "rejected",
//         created_at: "2024-10-22T15:20:00",
//         reviewed_by: "moderator-002",
//         reviewed_at: "2024-10-22T16:00:00",
//       },
//       {
//         id: 4,
//         user_id: "user-004",
//         user_name: "Phạm Thị D",
//         comment_id: 8,
//         comment_content: "Bình luận không liên quan đến chủ đề...",
//         reason: "Off-topic, không liên quan đến học tập",
//         status: "pending",
//         created_at: "2024-10-23T08:00:00",
//       },
//     ],
//     []
//   );

//   const filteredAndSortedReports = useMemo(() => {
//     const filtered = reports.filter((report) => {
//       const matchesSearch =
//         report.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         report.post_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         false;

//       const matchesStatus =
//         statusFilter === "all" || report.status === statusFilter;

//       const matchesType =
//         typeFilter === "all" ||
//         (typeFilter === "post" && report.post_id) ||
//         (typeFilter === "comment" && report.comment_id);

//       return matchesSearch && matchesStatus && matchesType;
//     });

//     filtered.sort((a, b) => {
//       switch (sortBy) {
//         case "newest":
//           return (
//             new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
//           );
//         case "oldest":
//           return (
//             new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
//           );
//         default:
//           return 0;
//       }
//     });

//     return filtered;
//   }, [reports, searchQuery, statusFilter, typeFilter, sortBy]);

//   const paginatedReports = useMemo(() => {
//     const startIndex = (currentPage - 1) * pageSize;
//     return filteredAndSortedReports.slice(startIndex, startIndex + pageSize);
//   }, [filteredAndSortedReports, currentPage]);

//   const pagination: PaginationInfo = {
//     currentPage,
//     totalPages: Math.ceil(filteredAndSortedReports.length / pageSize),
//     totalCount: filteredAndSortedReports.length,
//     pageSize,
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleString("vi-VN", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   const handleClearFilters = () => {
//     setSearchQuery("");
//     setStatusFilter("all");
//     setTypeFilter("all");
//     setSortBy("newest");
//     setCurrentPage(1);
//   };

//   return (
//     <div className="w-full h-full overflow-auto p-6 bg-gray-50">
//       <div className="max-w-7xl mx-auto space-y-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold">Quản lý Báo cáo</h1>
//             <p className="text-gray-600 mt-1">
//               Xử lý các báo cáo vi phạm từ người dùng
//             </p>
//           </div>
//         </div>

//         <Card>
//           <CardHeader>
//             <div className="space-y-4">
//               <div className="relative">
//                 <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
//                 <Input
//                   placeholder="Tìm kiếm theo người báo cáo, lý do hoặc nội dung..."
//                   className="pl-10"
//                   value={searchQuery}
//                   onChange={(e) => {
//                     setSearchQuery(e.target.value);
//                     setCurrentPage(1);
//                   }}
//                 />
//               </div>

//               <div className="flex flex-wrap gap-3">
//                 <Select
//                   value={typeFilter}
//                   onValueChange={(value) => {
//                     setTypeFilter(value);
//                     setCurrentPage(1);
//                   }}
//                 >
//                   <SelectTrigger className="w-48">
//                     <SelectValue placeholder="Loại báo cáo" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">Tất cả</SelectItem>
//                     <SelectItem value="post">Bài viết</SelectItem>
//                     <SelectItem value="comment">Bình luận</SelectItem>
//                   </SelectContent>
//                 </Select>

//                 <Select
//                   value={statusFilter}
//                   onValueChange={(value) => {
//                     setStatusFilter(value);
//                     setCurrentPage(1);
//                   }}
//                 >
//                   <SelectTrigger className="w-48">
//                     <SelectValue placeholder="Trạng thái" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">Tất cả</SelectItem>
//                     <SelectItem value="pending">Chờ xử lý</SelectItem>
//                     <SelectItem value="approved">Đã duyệt</SelectItem>
//                     <SelectItem value="rejected">Đã từ chối</SelectItem>
//                   </SelectContent>
//                 </Select>

//                 <Select
//                   value={sortBy}
//                   onValueChange={(value) => {
//                     setSortBy(value);
//                     setCurrentPage(1);
//                   }}
//                 >
//                   <SelectTrigger className="w-48">
//                     <SelectValue placeholder="Sắp xếp" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="newest">Mới nhất</SelectItem>
//                     <SelectItem value="oldest">Cũ nhất</SelectItem>
//                   </SelectContent>
//                 </Select>

//                 {(searchQuery ||
//                   statusFilter !== "all" ||
//                   typeFilter !== "all" ||
//                   sortBy !== "newest") && (
//                   <Button variant="ghost" onClick={handleClearFilters}>
//                     Xóa bộ lọc
//                   </Button>
//                 )}
//               </div>

//               <div className="text-sm text-gray-600">
//                 Tìm thấy <strong>{filteredAndSortedReports.length}</strong> báo
//                 cáo
//               </div>
//             </div>
//           </CardHeader>
//           <CardContent>
//             {paginatedReports.length > 0 ? (
//               <>
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Người báo cáo</TableHead>
//                       <TableHead>Nội dung bị báo cáo</TableHead>
//                       <TableHead>Lý do</TableHead>
//                       <TableHead>Thời gian</TableHead>
//                       <TableHead>Trạng thái</TableHead>
//                       <TableHead className="text-right">Thao tác</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {paginatedReports.map((report) => (
//                       <TableRow key={report.id}>
//                         <TableCell>
//                           <div className="flex items-center gap-2">
//                             <Avatar className="w-8 h-8">
//                               <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs">
//                                 {report.user_name.substring(0, 2).toUpperCase()}
//                               </AvatarFallback>
//                             </Avatar>
//                             <div className="font-medium text-sm">
//                               {report.user_name}
//                             </div>
//                           </div>
//                         </TableCell>
//                         <TableCell className="max-w-xs">
//                           <div className="space-y-1">
//                             {report.post_id && (
//                               <>
//                                 <div className="text-xs text-gray-500">
//                                   Bài viết
//                                 </div>
//                                 <p className="text-sm font-medium truncate">
//                                   {report.post_title}
//                                 </p>
//                               </>
//                             )}
//                             {report.comment_id && (
//                               <>
//                                 <div className="text-xs text-gray-500">
//                                   Bình luận
//                                 </div>
//                                 <p className="text-sm truncate">
//                                   {report.comment_content}
//                                 </p>
//                               </>
//                             )}
//                           </div>
//                         </TableCell>
//                         <TableCell className="max-w-xs">
//                           <p className="text-sm text-gray-600 line-clamp-2">
//                             {report.reason}
//                           </p>
//                         </TableCell>
//                         <TableCell className="text-sm text-gray-600">
//                           {formatDate(report.created_at)}
//                         </TableCell>
//                         <TableCell>
//                           <StatusBadge status={report.status} type="report" />
//                         </TableCell>
//                         <TableCell>
//                           <div className="flex justify-end gap-2">
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               className="gap-1"
//                               onClick={() => setSelectedReport(report)}
//                               title="Xem chi tiết"
//                             >
//                               <Eye className="w-4 h-4" />
//                             </Button>
//                             {report.status === "pending" && (
//                               <>
//                                 <Button
//                                   size="sm"
//                                   variant="ghost"
//                                   className="gap-1 text-green-600 hover:text-green-700"
//                                   title="Chấp nhận báo cáo"
//                                 >
//                                   <CheckCircle className="w-4 h-4" />
//                                 </Button>
//                                 <Button
//                                   size="sm"
//                                   variant="ghost"
//                                   className="gap-1 text-red-600 hover:text-red-700"
//                                   title="Từ chối báo cáo"
//                                 >
//                                   <XCircle className="w-4 h-4" />
//                                 </Button>
//                               </>
//                             )}
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//                 <DocumentPagination
//                   pagination={pagination}
//                   onPageChange={setCurrentPage}
//                 />
//               </>
//             ) : (
//               <div className="text-center py-12">
//                 <p className="text-gray-500 text-lg">
//                   Không tìm thấy báo cáo nào
//                 </p>
//                 <Button
//                   variant="ghost"
//                   className="mt-4"
//                   onClick={handleClearFilters}
//                 >
//                   Xóa bộ lọc
//                 </Button>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Report Detail Dialog */}
//       <Dialog
//         open={!!selectedReport}
//         onOpenChange={() => setSelectedReport(null)}
//       >
//         <DialogContent className="max-w-2xl">
//           {selectedReport && (
//             <>
//               <DialogHeader>
//                 <DialogTitle>Chi tiết Báo cáo #{selectedReport.id}</DialogTitle>
//                 <DialogDescription>
//                   Xem xét và xử lý báo cáo vi phạm
//                 </DialogDescription>
//               </DialogHeader>
//               <div className="space-y-4">
//                 <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
//                   <Avatar className="w-12 h-12">
//                     <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
//                       {selectedReport.user_name.substring(0, 2).toUpperCase()}
//                     </AvatarFallback>
//                   </Avatar>
//                   <div>
//                     <div className="font-semibold text-lg">
//                       {selectedReport.user_name}
//                     </div>
//                     <div className="text-sm text-gray-500">
//                       Báo cáo lúc: {formatDate(selectedReport.created_at)}
//                     </div>
//                   </div>
//                 </div>

//                 <div>
//                   <h4 className="font-semibold mb-2">Nội dung bị báo cáo:</h4>
//                   {selectedReport.post_id && (
//                     <div className="bg-gray-50 p-4 rounded-lg">
//                       <div className="text-xs text-gray-500 mb-1">Bài viết</div>
//                       <p className="font-medium">{selectedReport.post_title}</p>
//                     </div>
//                   )}
//                   {selectedReport.comment_id && (
//                     <div className="bg-gray-50 p-4 rounded-lg">
//                       <div className="text-xs text-gray-500 mb-1">
//                         Bình luận
//                       </div>
//                       <p className="text-sm">
//                         {selectedReport.comment_content}
//                       </p>
//                     </div>
//                   )}
//                 </div>

//                 <div>
//                   <h4 className="font-semibold mb-2">Lý do báo cáo:</h4>
//                   <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
//                     {selectedReport.reason}
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <span className="font-semibold">Trạng thái:</span>
//                   <StatusBadge status={selectedReport.status} type="report" />
//                 </div>

//                 {selectedReport.reviewed_at && (
//                   <div className="text-sm text-gray-600">
//                     Đã xử lý lúc: {formatDate(selectedReport.reviewed_at)}
//                   </div>
//                 )}

//                 {selectedReport.status === "pending" && (
//                   <div className="flex gap-3 pt-4 border-t">
//                     <Button className="flex-1 gap-2" variant="default">
//                       <CheckCircle className="w-4 h-4" />
//                       Chấp nhận báo cáo
//                     </Button>
//                     <Button className="flex-1 gap-2" variant="destructive">
//                       <XCircle className="w-4 h-4" />
//                       Từ chối báo cáo
//                     </Button>
//                   </div>
//                 )}
//               </div>
//             </>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };
// export default ReportManagement;
