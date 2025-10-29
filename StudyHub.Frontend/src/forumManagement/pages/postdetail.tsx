// StudyHub.Frontend/src/forumManagement/pages/postdetail.tsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CardContent, CardHeader } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import {
  ArrowLeft,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  Eye,
} from "lucide-react";
import type { Post } from "../interfaces/forum";

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(
    new Set()
  );
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [commentSort, setCommentSort] = useState("newest");

  const posts: Post[] = [
    {
      post_id: 1,
      subject_id: 1,
      subject_name: "Toán",
      flair_id: 1,
      flair_name: "Câu hỏi",
      title: "Cách giải phương trình bậc hai có dễ không?",
      content:
        "Mình đang học về phương trình bậc hai nhưng vẫn chưa hiểu rõ cách tính delta và các trường hợp nghiệm. Các bạn có thể giải thích chi tiết hơn được không? Đặc biệt là khi nào thì phương trình vô nghiệm ạ?",
      created_at: "2024-10-23T10:00:00",
      created_by: "user-001",
      author_name: "Nguyễn Minh An",
      author_initials: "AN",
      author_class: "10A1",
      comment_count: 3,
      comments: [
        {
          comment_id: 1,
          post_id: 1,
          parent_comment_id: null,
          content:
            "Delta = b² - 4ac nha bạn. Nếu delta < 0 thì phương trình vô nghiệm, delta = 0 thì có nghiệm kép, delta > 0 thì có 2 nghiệm phân biệt!",
          created_at: "2024-10-23T11:00:00",
          created_by: "user-002",
          author_name: "Trần Bảo Hân",
          author_initials: "BH",
          replies: [
            {
              comment_id: 11,
              post_id: 1,
              parent_comment_id: 1,
              content: "Cảm ơn bạn nhiều nha! Giờ mình hiểu rồi 😊",
              created_at: "2024-10-23T11:10:00",
              created_by: "user-001",
              author_name: "Nguyễn Minh An",
              author_initials: "AN",
            },
          ],
        },
        {
          comment_id: 2,
          post_id: 1,
          parent_comment_id: null,
          content:
            "Mình có công thức nghiệm: x = (-b ± √Δ) / 2a. Bạn cứ tính delta trước rồi xét các trường hợp là được nhé!",
          created_at: "2024-10-23T11:15:00",
          created_by: "user-003",
          author_name: "Lê Tuấn",
          author_initials: "TL",
          replies: [],
        },
        {
          comment_id: 3,
          post_id: 1,
          parent_comment_id: null,
          content:
            "Mình thấy cô giáo giải trên lớp rất dễ hiểu. Bạn có thể xem lại bài giảng hoặc làm thêm bài tập để quen thuộc công thức hơn 😊",
          created_at: "2024-10-23T11:30:00",
          created_by: "user-004",
          author_name: "Phạm Mai Hương",
          author_initials: "MH",
          replies: [],
        },
      ],
    },
    {
      post_id: 2,
      subject_id: 2,
      subject_name: "Vật Lý",
      flair_id: 1,
      flair_name: "Câu hỏi",
      title: "Ai giải thích định luật Newton thứ ba giúp mình với!",
      content:
        "Mình không hiểu tại sao khi tác dụng một lực lên vật thì vật lại tác dụng trở lại một lực bằng nhau và ngược chiều. Có ví dụ thực tế nào dễ hiểu không các bạn? Cảm ơn nhiều!",
      created_at: "2024-10-23T07:00:00",
      created_by: "user-005",
      author_name: "Hoàng Đức Long",
      author_initials: "DL",
      author_class: "11B2",
      comment_count: 2,
      comments: [
        {
          comment_id: 4,
          post_id: 2,
          parent_comment_id: null,
          content:
            "Ví dụ đơn giản nhất là khi bạn đẩy tường, tường cũng đẩy ngược lại bạn với lực bằng nhau. Hoặc khi bạn nhảy, bạn đạp xuống đất và đất đẩy bạn lên trên!",
          created_at: "2024-10-23T09:00:00",
          created_by: "user-006",
          author_name: "Vũ Khánh An",
          author_initials: "KA",
          replies: [
            {
              comment_id: 41,
              post_id: 2,
              parent_comment_id: 4,
              content: "Ví dụ hay quá! Giờ mình hình dung được rồi",
              created_at: "2024-10-23T10:00:00",
              created_by: "user-005",
              author_name: "Hoàng Đức Long",
              author_initials: "DL",
            },
          ],
        },
        {
          comment_id: 5,
          post_id: 2,
          parent_comment_id: null,
          content:
            "Thêm ví dụ nữa: khi chèo thuyền, bạn dùng mái chèo đẩy nước về phía sau, nước đẩy thuyền về phía trước. Đây chính là định luật 3 Newton đấy!",
          created_at: "2024-10-23T10:00:00",
          created_by: "user-007",
          author_name: "Ngô Thanh Tùng",
          author_initials: "NT",
          replies: [],
        },
      ],
    },
  ];

  const post = posts.find((p) => p.post_id === Number(postId));

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ngày trước`;
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg p-8 text-center shadow-2xl">
          <p className="text-lg mb-4">Không tìm thấy bài viết</p>
          <Button onClick={() => navigate("/forum/student/forums")}>
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const getSubjectColor = (subjectName: string) => {
    const colors: Record<string, string> = {
      Toán: "bg-blue-500",
      "Vật Lý": "bg-purple-500",
      "Tiếng Anh": "bg-green-500",
      "Hóa học": "bg-orange-500",
      Văn: "bg-pink-500",
      "Sinh học": "bg-teal-500",
      "Lịch sử": "bg-yellow-600",
    };
    return colors[subjectName] || "bg-gray-500";
  };

  const getFlairColor = (flairName: string) => {
    const colors: Record<string, string> = {
      "Câu hỏi": "bg-red-100 text-red-700 border-red-300",
      "Kiến thức": "bg-blue-100 text-blue-700 border-blue-300",
      "Thảo luận": "bg-green-100 text-green-700 border-green-300",
    };
    return colors[flairName] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const toggleReplies = (commentId: number) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const getSortedComments = (comments: typeof post.comments) => {
    const topLevelComments = comments.filter((c) => !c.parent_comment_id);
    switch (commentSort) {
      case "newest":
        return [...topLevelComments].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return [...topLevelComments].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      default:
        return topLevelComments;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/forum/student/forums")}
          className="mb-4 text-white hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                      {post.author_initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-lg">
                      {post.author_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTimestamp(post.created_at)} • {post.author_class}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge
                    className={`${getSubjectColor(
                      post.subject_name
                    )} text-white`}
                  >
                    {post.subject_name}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getFlairColor(post.flair_name)}
                  >
                    {post.flair_name}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-0">
              <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
              <p className="text-gray-700 mb-6 leading-relaxed">
                {post.content}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pt-4 border-t">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{post.comment_count} bình luận</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <h3 className="font-bold text-lg">
                    Tất cả bình luận ({post.comment_count})
                  </h3>
                  <Select value={commentSort} onValueChange={setCommentSort}>
                    <SelectTrigger className="w-32 h-9 text-sm hover:border-purple-300 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Mới nhất</SelectItem>
                      <SelectItem value="oldest">Cũ nhất</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {getSortedComments(post.comments).map((comment) => {
                  const isRepliesExpanded = expandedReplies.has(
                    comment.comment_id
                  );
                  const replies = comment.replies || [];
                  return (
                    <div key={comment.comment_id}>
                      <div className="flex gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-pink-400 to-orange-400 text-white text-sm font-bold">
                            {comment.author_initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-gray-100 rounded-2xl px-4 py-3 hover:bg-gray-200 transition-colors">
                            <div className="font-semibold text-sm">
                              {comment.author_name}
                            </div>
                            <p className="text-sm mt-1">{comment.content}</p>
                          </div>
                          <div className="flex gap-4 px-4 mt-2">
                            <button
                              className="text-xs text-gray-600 hover:text-purple-600 hover:underline font-semibold transition-colors"
                              onClick={() =>
                                setReplyingTo(
                                  replyingTo === comment.comment_id
                                    ? null
                                    : comment.comment_id
                                )
                              }
                            >
                              Phản hồi
                            </button>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(comment.created_at)}
                            </span>
                          </div>

                          {replies.length > 0 && (
                            <button
                              onClick={() => toggleReplies(comment.comment_id)}
                              className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-purple-600 hover:underline mt-3 ml-4 transition-colors"
                            >
                              {isRepliesExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                              {replies.length} phản hồi
                            </button>
                          )}

                          {isRepliesExpanded &&
                            replies.map((reply) => (
                              <div
                                key={reply.comment_id}
                                className="flex gap-3 mt-3 ml-10 animate-in slide-in-from-top-2 duration-200"
                              >
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs font-bold">
                                    {reply.author_initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="bg-gray-100 rounded-2xl px-4 py-2 hover:bg-gray-200 transition-colors">
                                    <div className="font-semibold text-xs">
                                      {reply.author_name}
                                    </div>
                                    <p className="text-xs mt-1">
                                      {reply.content}
                                    </p>
                                  </div>
                                  <div className="flex gap-4 px-4 mt-1">
                                    <button className="text-xs text-gray-600 hover:text-purple-600 hover:underline font-semibold transition-colors">
                                      Phản hồi
                                    </button>
                                    <span className="text-xs text-gray-500">
                                      {formatTimestamp(reply.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}

                          {replyingTo === comment.comment_id && (
                            <div className="flex gap-2 mt-3 ml-10 animate-in slide-in-from-top-2 duration-200">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                                  U
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex gap-2">
                                <Input
                                  placeholder="Viết phản hồi..."
                                  className="rounded-full text-sm hover:border-purple-300 focus:border-purple-500 transition-colors"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  className="rounded-full px-4 hover:scale-105 transition-transform"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </div>

          <div className="border-t p-4 bg-gray-50">
            <div className="flex gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold">
                  U
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Viết bình luận công khai..."
                  className="rounded-full hover:border-purple-300 focus:border-purple-500 transition-colors"
                />
                <Button className="rounded-full px-6 hover:scale-105 transition-transform">
                  <Send className="w-4 h-4 mr-2" />
                  Gửi
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
