// // StudyHub.Frontend/src/forumManagement/moderator/pages/CommentManagement.tsx
// import { useState, useMemo } from "react";
// import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
// import { Input } from "@/common/components/ui/input";
// import { Button } from "@/common/components/ui/button";
// import { Badge } from "@/common/components/ui/badge";
// import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/common/components/ui/select";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuCheckboxItem,
//   DropdownMenuTrigger,
// } from "@/common/components/ui/dropdown-menu";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/common/components/ui/table";
// import {
//   Search,
//   CheckCircle,
//   XCircle,
//   AlertTriangle,
//   Eye,
//   ChevronDown,
//   Filter,
// } from "lucide-react";
// import type { Comment } from "../interfaces/comment";
// import type { Subject } from "../interfaces/forum";
// import type { PaginationInfo } from "@/documentManagement/interfaces/document";
// import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";

// interface CommentWithPost extends Comment {
//   post_title: string;
//   post_id: number;
//   subject_id: number;
//   subject_name: string;
// }

// const CommentManagement = () => {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
//   const [sortBy, setSortBy] = useState("newest");
//   const [currentPage, setCurrentPage] = useState(1);
//   const pageSize = 10;

//   const comments: CommentWithPost[] = useMemo(
//     () => [
//       {
//         comment_id: 1,
//         post_id: 1,
//         post_title: "Cách giải phương trình bậc hai",
//         parent_comment_id: null,
//         content:
//           "Delta = b² - 4ac nha bạn. Nếu delta < 0 thì phương trình vô nghiệm...",
//         created_at: "2024-10-23T11:00:00",
//         created_by: "user-002",
//         author_name: "Trần Bảo Hân",
//         author_initials: "BH",
//         image_urls: "",
//         subject_id: 1,
//         subject_name: "Toán",
//       },
//       {
//         comment_id: 2,
//         post_id: 1,
//         post_title: "Cách giải phương trình bậc hai",
//         parent_comment_id: null,
//         content:
//           "Mình có công thức nghiệm: x = (-b ± √Δ) / 2a. Bạn cứ tính delta trước rồi xét các trường hợp là được nhé!",
//         created_at: "2024-10-23T11:15:00",
//         created_by: "user-003",
//         author_name: "Lê Tuấn",
//         author_initials: "TL",
//         image_urls: "",
//         subject_id: 1,
//         subject_name: "Toán",
//       },
//       {
//         comment_id: 3,
//         post_id: 2,
//         post_title: "Định luật Newton thứ ba",
//         parent_comment_id: null,
//         content:
//           "Ví dụ đơn giản nhất là khi bạn đẩy tường, tường cũng đẩy ngược lại bạn với lực bằng nhau.",
//         created_at: "2024-10-23T09:00:00",
//         created_by: "user-006",
//         author_name: "Vũ Khánh An",
//         author_initials: "KA",
//         image_urls: "",
//         subject_id: 2,
//         subject_name: "Vật Lý",
//       },
//     ],
//     []
//   );

//   const subjects: Subject[] = useMemo(
//     () => [
//       { id: 1, name: "Toán" },
//       { id: 2, name: "Vật Lý" },
//       { id: 3, name: "Hóa học" },
//       { id: 4, name: "Văn" },
//       { id: 5, name: "Tiếng Anh" },
//     ],
//     []
//   );

//   const toggleSubject = (subjectId: number) => {
//     setSelectedSubjects((prev) =>
//       prev.includes(subjectId)
//         ? prev.filter((s) => s !== subjectId)
//         : [...prev, subjectId]
//     );
//     setCurrentPage(1);
//   };

//   const filteredAndSortedComments = useMemo(() => {
//     const filtered = comments.filter((comment) => {
//       const matchesSearch =
//         comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         comment.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         comment.post_title.toLowerCase().includes(searchQuery.toLowerCase());

//       const matchesSubject =
//         selectedSubjects.length === 0 ||
//         selectedSubjects.includes(comment.subject_id);

//       const matchesStatus = statusFilter === "all" || true;

//       return matchesSearch && matchesSubject && matchesStatus;
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
//   }, [comments, searchQuery, selectedSubjects, statusFilter, sortBy]);

//   const paginatedComments = useMemo(() => {
//     const startIndex = (currentPage - 1) * pageSize;
//     return filteredAndSortedComments.slice(startIndex, startIndex + pageSize);
//   }, [filteredAndSortedComments, currentPage]);

//   const pagination: PaginationInfo = {
//     currentPage,
//     totalPages: Math.ceil(filteredAndSortedComments.length / pageSize),
//     totalCount: filteredAndSortedComments.length,
//     pageSize,
//   };

//   const getStatusBadge = (status: boolean | null) => {
//     if (status === null)
//       return (
//         <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
//           Chờ duyệt
//         </Badge>
//       );
//     if (status === true)
//       return <Badge className="bg-green-500 text-white">Đã duyệt</Badge>;
//     return <Badge className="bg-red-500 text-white">Bị từ chối</Badge>;
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
//     setSelectedSubjects([]);
//     setStatusFilter("all");
//     setSortBy("newest");
//     setCurrentPage(1);
//   };

//   return (
//     <div className="w-full h-full overflow-auto p-6 bg-gray-50">
//       <div className="max-w-7xl mx-auto space-y-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold">Quản lý Bình luận</h1>
//             <p className="text-gray-600 mt-1">
//               Xem và điều hành các bình luận trong forum
//             </p>
//           </div>
//           <div className="flex gap-2">
//             <Button variant="outline" className="gap-2">
//               <CheckCircle className="w-4 h-4" />
//               Duyệt hàng loạt
//             </Button>
//           </div>
//         </div>

//         <Card>
//           <CardHeader>
//             <div className="space-y-4">
//               <div className="flex gap-4">
//                 <div className="relative flex-1">
//                   <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
//                   <Input
//                     placeholder="Tìm kiếm theo nội dung, tác giả, bài viết..."
//                     className="pl-10"
//                     value={searchQuery}
//                     onChange={(e) => {
//                       setSearchQuery(e.target.value);
//                       setCurrentPage(1);
//                     }}
//                   />
//                 </div>
//               </div>

//               <div className="flex flex-wrap gap-3">
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <Button variant="outline" className="gap-2">
//                       <Filter className="w-4 h-4" />
//                       Môn học{" "}
//                       {selectedSubjects.length > 0 &&
//                         `(${selectedSubjects.length})`}
//                       <ChevronDown className="w-4 h-4" />
//                     </Button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent className="w-56">
//                     {subjects.map((subject) => (
//                       <DropdownMenuCheckboxItem
//                         key={subject.id}
//                         checked={selectedSubjects.includes(subject.id)}
//                         onCheckedChange={() => toggleSubject(subject.id)}
//                       >
//                         {subject.name}
//                       </DropdownMenuCheckboxItem>
//                     ))}
//                   </DropdownMenuContent>
//                 </DropdownMenu>

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
//                     <SelectItem value="pending">Chờ duyệt</SelectItem>
//                     <SelectItem value="approved">Đã duyệt</SelectItem>
//                     <SelectItem value="rejected">Đã từ chối</SelectItem>
//                     <SelectItem value="hidden">Bị ẩn</SelectItem>
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
//                   selectedSubjects.length > 0 ||
//                   statusFilter !== "all" ||
//                   sortBy !== "newest") && (
//                   <Button variant="ghost" onClick={handleClearFilters}>
//                     Xóa bộ lọc
//                   </Button>
//                 )}
//               </div>

//               <div className="text-sm text-gray-600">
//                 Tìm thấy <strong>{filteredAndSortedComments.length}</strong>{" "}
//                 bình luận
//               </div>
//             </div>
//           </CardHeader>
//           <CardContent>
//             {paginatedComments.length > 0 ? (
//               <>
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Tác giả</TableHead>
//                       <TableHead>Nội dung</TableHead>
//                       <TableHead>Bài viết</TableHead>
//                       <TableHead>Môn học</TableHead>
//                       <TableHead>Thời gian</TableHead>
//                       <TableHead>Trạng thái</TableHead>
//                       <TableHead className="text-right">Thao tác</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {paginatedComments.map((comment) => (
//                       <TableRow key={comment.comment_id}>
//                         <TableCell>
//                           <div className="flex items-center gap-2">
//                             <Avatar className="w-8 h-8">
//                               <AvatarFallback className="bg-pink-500 text-white text-xs">
//                                 {comment.author_initials}
//                               </AvatarFallback>
//                             </Avatar>
//                             <div className="font-medium text-sm">
//                               {comment.author_name}
//                             </div>
//                           </div>
//                         </TableCell>
//                         <TableCell className="max-w-xs">
//                           <p className="text-sm truncate">{comment.content}</p>
//                         </TableCell>
//                         <TableCell className="max-w-xs">
//                           <p className="text-sm text-gray-600 truncate">
//                             {comment.post_title}
//                           </p>
//                         </TableCell>
//                         <TableCell>
//                           <Badge variant="outline">
//                             {comment.subject_name}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-sm text-gray-600">
//                           {formatDate(comment.created_at)}
//                         </TableCell>
//                         <TableCell>{getStatusBadge(null)}</TableCell>
//                         <TableCell>
//                           <div className="flex justify-end gap-2">
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               className="gap-1"
//                               title="Xem chi tiết"
//                             >
//                               <Eye className="w-4 h-4" />
//                             </Button>
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               className="gap-1 text-green-600 hover:text-green-700"
//                               title="Duyệt"
//                             >
//                               <CheckCircle className="w-4 h-4" />
//                             </Button>
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               className="gap-1 text-red-600 hover:text-red-700"
//                               title="Từ chối"
//                             >
//                               <XCircle className="w-4 h-4" />
//                             </Button>
//                             <Button
//                               size="sm"
//                               variant="ghost"
//                               className="gap-1 text-orange-600 hover:text-orange-700"
//                               title="Ẩn"
//                             >
//                               <AlertTriangle className="w-4 h-4" />
//                             </Button>
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
//                   Không tìm thấy bình luận nào
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
//     </div>
//   );
// };

// export default CommentManagement;
