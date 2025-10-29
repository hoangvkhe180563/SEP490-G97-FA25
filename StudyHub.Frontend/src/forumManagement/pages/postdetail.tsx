// StudyHub.Frontend/src/forumManagement/pages/postdetail.tsx
import React, { useState, useEffect } from "react";
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
  X,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  Eye,
} from "lucide-react";

interface Reply {
  id: number;
  author: string;
  initials: string;
  time: string;
  text: string;
}

interface Comment {
  id: number;
  author: string;
  initials: string;
  time: string;
  text: string;
  replies: Reply[];
}

interface Post {
  id: number;
  author: string;
  authorInitials: string;
  class: string;
  timestamp: string;
  subject: string;
  flair: string;
  title: string;
  content: string;
  views: number;
  comments: Comment[];
}

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(
    new Set()
  );
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [commentSort, setCommentSort] = useState("newest");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const posts: Post[] = [
    {
      id: 1,
      author: "Nguyễn Minh An",
      authorInitials: "AN",
      class: "10A1",
      timestamp: "2 giờ trước",
      subject: "Toán",
      flair: "Câu hỏi",
      title: "Cách giải phương trình bậc hai có dễ không?",
      content:
        "Mình đang học về phương trình bậc hai nhưng vẫn chưa hiểu rõ cách tính delta và các trường hợp nghiệm. Các bạn có thể giải thích chi tiết hơn được không? Đặc biệt là khi nào thì phương trình vô nghiệm ạ?",
      views: 127,
      comments: [
        {
          id: 1,
          author: "Trần Bảo Hân",
          initials: "BH",
          time: "1 giờ trước",
          text: "Delta = b² - 4ac nha bạn. Nếu delta < 0 thì phương trình vô nghiệm, delta = 0 thì có nghiệm kép, delta > 0 thì có 2 nghiệm phân biệt!",
          replies: [
            {
              id: 11,
              author: "Nguyễn Minh An",
              initials: "AN",
              time: "50 phút trước",
              text: "Cảm ơn bạn nhiều nha! Giờ mình hiểu rồi 😊",
            },
          ],
        },
        {
          id: 2,
          author: "Lê Tuấn",
          initials: "TL",
          time: "45 phút trước",
          text: "Mình có công thức nghiệm: x = (-b ± √Δ) / 2a. Bạn cứ tính delta trước rồi xét các trường hợp là được nhé!",
          replies: [],
        },
        {
          id: 3,
          author: "Phạm Mai Hương",
          initials: "MH",
          time: "30 phút trước",
          text: "Mình thấy cô giáo giải trên lớp rất dễ hiểu. Bạn có thể xem lại bài giảng hoặc làm thêm bài tập để quen thuộc công thức hơn 😊",
          replies: [],
        },
      ],
    },
    {
      id: 2,
      author: "Hoàng Đức Long",
      authorInitials: "DL",
      class: "11B2",
      timestamp: "5 giờ trước",
      subject: "Vật Lý",
      flair: "Câu hỏi",
      title: "Ai giải thích định luật Newton thứ ba giúp mình với!",
      content:
        "Mình không hiểu tại sao khi tác dụng một lực lên vật thì vật lại tác dụng trở lại một lực bằng nhau và ngược chiều. Có ví dụ thực tế nào dễ hiểu không các bạn? Cảm ơn nhiều!",
      views: 289,
      comments: [
        {
          id: 4,
          author: "Vũ Khánh An",
          initials: "KA",
          time: "3 giờ trước",
          text: "Ví dụ đơn giản nhất là khi bạn đẩy tường, tường cũng đẩy ngược lại bạn với lực bằng nhau. Hoặc khi bạn nhảy, bạn đạp xuống đất và đất đẩy bạn lên trên!",
          replies: [
            {
              id: 41,
              author: "Hoàng Đức Long",
              initials: "DL",
              time: "2 giờ trước",
              text: "Ví dụ hay quá! Giờ mình hình dung được rồi",
            },
          ],
        },
        {
          id: 5,
          author: "Ngô Thanh Tùng",
          initials: "NT",
          time: "2 giờ trước",
          text: "Thêm ví dụ nữa: khi chèo thuyền, bạn dùng mái chèo đẩy nước về phía sau, nước đẩy thuyền về phía trước. Đây chính là định luật 3 Newton đấy!",
          replies: [],
        },
      ],
    },
  ];

  const post = posts.find((p) => p.id === Number(postId));

  if (!post) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-lg mb-4">Không tìm thấy bài viết</p>
          <Button onClick={() => navigate("/forum")}>Quay lại</Button>
        </div>
      </div>
    );
  }

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      Toán: "bg-blue-500",
      "Vật Lý": "bg-purple-500",
      "Tiếng Anh": "bg-green-500",
      "Hóa học": "bg-orange-500",
      Văn: "bg-pink-500",
      "Sinh học": "bg-teal-500",
      "Lịch sử": "bg-yellow-600",
    };
    return colors[subject] || "bg-gray-500";
  };

  const getFlairColor = (flair: string) => {
    const colors: Record<string, string> = {
      "Câu hỏi": "bg-red-100 text-red-700 border-red-300",
      "Kiến thức": "bg-blue-100 text-blue-700 border-blue-300",
      "Thảo luận": "bg-green-100 text-green-700 border-green-300",
    };
    return colors[flair] || "bg-gray-100 text-gray-700 border-gray-300";
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

  const handleClose = () => {
    navigate("/forum");
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const getSortedComments = (comments: Comment[]) => {
    switch (commentSort) {
      case "newest":
        return [...comments].reverse();
      case "oldest":
        return [...comments];
      default:
        return comments;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold">Chi tiết bài viết</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                      {post.authorInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-lg">{post.author}</div>
                    <div className="text-sm text-gray-500">
                      {post.timestamp} • {post.class}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge
                    className={`${getSubjectColor(post.subject)} text-white`}
                  >
                    {post.subject}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getFlairColor(post.flair)}
                  >
                    {post.flair}
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
                  <span>{post.comments.length} bình luận</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{post.views} lượt xem</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <h3 className="font-bold text-lg">
                    Tất cả bình luận ({post.comments.length})
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
                  const isRepliesExpanded = expandedReplies.has(comment.id);
                  return (
                    <div key={comment.id}>
                      <div className="flex gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-pink-400 to-orange-400 text-white text-sm font-bold">
                            {comment.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-gray-100 rounded-2xl px-4 py-3 hover:bg-gray-200 transition-colors">
                            <div className="font-semibold text-sm">
                              {comment.author}
                            </div>
                            <p className="text-sm mt-1">{comment.text}</p>
                          </div>
                          <div className="flex gap-4 px-4 mt-2">
                            <button
                              className="text-xs text-gray-600 hover:text-purple-600 hover:underline font-semibold transition-colors"
                              onClick={() =>
                                setReplyingTo(
                                  replyingTo === comment.id ? null : comment.id
                                )
                              }
                            >
                              Phản hồi
                            </button>
                            <span className="text-xs text-gray-500">
                              {comment.time}
                            </span>
                          </div>

                          {comment.replies.length > 0 && (
                            <button
                              onClick={() => toggleReplies(comment.id)}
                              className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-purple-600 hover:underline mt-3 ml-4 transition-colors"
                            >
                              {isRepliesExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                              {comment.replies.length} phản hồi
                            </button>
                          )}

                          {isRepliesExpanded &&
                            comment.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className="flex gap-3 mt-3 ml-10 animate-in slide-in-from-top-2 duration-200"
                              >
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs font-bold">
                                    {reply.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="bg-gray-100 rounded-2xl px-4 py-2 hover:bg-gray-200 transition-colors">
                                    <div className="font-semibold text-xs">
                                      {reply.author}
                                    </div>
                                    <p className="text-xs mt-1">{reply.text}</p>
                                  </div>
                                  <div className="flex gap-4 px-4 mt-1">
                                    <button className="text-xs text-gray-600 hover:text-purple-600 hover:underline font-semibold transition-colors">
                                      Phản hồi
                                    </button>
                                    <span className="text-xs text-gray-500">
                                      {reply.time}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}

                          {replyingTo === comment.id && (
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
  );
};

export default PostDetail;
