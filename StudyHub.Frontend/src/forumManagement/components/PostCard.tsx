// StudyHub.Frontend/src/forumManagement/components/PostCard.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
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
import { MessageSquare, ChevronDown, ChevronUp, Send, Eye } from "lucide-react";
import type { Post } from "../interfaces/forum";
import type { Comment } from "../interfaces/comment";

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const navigate = useNavigate();
  const [expandedComments, setExpandedComments] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(
    new Set()
  );
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [commentSort, setCommentSort] = useState("newest");

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

  const getSortedComments = (comments: Comment[]) => {
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

  const topLevelComments = post.comments.filter((c) => !c.parent_comment_id);
  const previewComments = topLevelComments.slice(0, 2);
  const hasMoreComments = topLevelComments.length > 2;

  return (
    <Card className="mb-4 hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
                {post.author_initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{post.author_name}</div>
              <div className="text-xs text-gray-500">
                {formatTimestamp(post.created_at)} • {post.author_class}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge
              className={`${getSubjectColor(post.subject_name)} text-white`}
            >
              {post.subject_name}
            </Badge>
            <Badge variant="outline" className={getFlairColor(post.flair_name)}>
              {post.flair_name}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div
          onClick={() =>
            navigate(`/forum/student/forums/details/${post.post_id}`)
          }
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <h2 className="text-xl font-bold mb-2">{post.title}</h2>
          <p className="text-gray-700 mb-4">{post.content}</p>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 pt-2 border-t">
          <button
            onClick={() => setExpandedComments(!expandedComments)}
            className="flex items-center gap-1 hover:text-purple-600 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.comment_count} bình luận</span>
          </button>
        </div>

        {!expandedComments && topLevelComments.length > 0 && (
          <div className="space-y-2 mb-3">
            {previewComments.map((comment) => (
              <div
                key={comment.comment_id}
                className="flex gap-2 pl-2 border-l-2 border-gray-200"
              >
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-gradient-to-br from-pink-400 to-orange-400 text-white text-xs font-bold">
                    {comment.author_initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-xs">
                    <span className="font-semibold">{comment.author_name}</span>
                    <span className="text-gray-600 ml-2">
                      {comment.content}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {hasMoreComments && (
              <button
                onClick={() => setExpandedComments(true)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 ml-2 hover:underline transition-all"
              >
                <ChevronDown className="w-4 h-4" />
                Xem thêm {topLevelComments.length - 2} bình luận
              </button>
            )}
          </div>
        )}

        {expandedComments && (
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-sm font-semibold text-gray-700">
                {post.comment_count} bình luận
              </span>
              <Select value={commentSort} onValueChange={setCommentSort}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="oldest">Cũ nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {getSortedComments(post.comments).map((comment) => {
              const isRepliesExpanded = expandedReplies.has(comment.comment_id);
              const replies = comment.replies || [];
              return (
                <div key={comment.comment_id}>
                  <div className="flex gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-pink-400 to-orange-400 text-white text-xs font-bold">
                        {comment.author_initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-2xl px-3 py-2 hover:bg-gray-200 transition-colors">
                        <div className="font-semibold text-sm">
                          {comment.author_name}
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <div className="flex gap-3 px-3 mt-1">
                        <button
                          className="text-xs text-gray-600 hover:underline font-semibold hover:text-purple-600 transition-colors"
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
                          className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-purple-600 hover:underline mt-2 ml-3 transition-colors"
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
                            className="flex gap-2 mt-2 ml-8"
                          >
                            <Avatar className="w-7 h-7">
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs font-bold">
                                {reply.author_initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-gray-100 rounded-2xl px-3 py-2 hover:bg-gray-200 transition-colors">
                                <div className="font-semibold text-xs">
                                  {reply.author_name}
                                </div>
                                <p className="text-xs">{reply.content}</p>
                              </div>
                              <div className="flex gap-3 px-3 mt-1">
                                <button className="text-xs text-gray-600 hover:underline font-semibold hover:text-purple-600 transition-colors">
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
                        <div className="flex gap-2 mt-2 ml-8 animate-in slide-in-from-top-2 duration-200">
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                              U
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex gap-2">
                            <Input
                              placeholder="Viết phản hồi..."
                              className="rounded-full text-sm"
                            />
                            <Button
                              size="sm"
                              className="rounded-full hover:scale-105 transition-transform"
                            >
                              <Send className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex gap-2 mt-4 pt-3 border-t">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                  U
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Viết bình luận..."
                  className="rounded-full hover:border-purple-300 transition-colors"
                />
                <Button
                  size="sm"
                  className="rounded-full hover:scale-105 transition-transform"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <button
              onClick={() => setExpandedComments(false)}
              className="text-sm text-gray-600 hover:text-purple-600 font-medium flex items-center gap-1 mx-auto hover:underline transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
              Thu gọn bình luận
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;
