import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { Card, CardContent } from "@/common/components/ui/card";
import {
  ArrowLeft,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  Share2,
  Bookmark,
  MoreHorizontal,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { Post } from "../interfaces/forum";

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(
    new Set()
  );
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [commentSort, setCommentSort] = useState("newest");
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [imageZoom, setImageZoom] = useState(1);

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
      image_urls: "",
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
          image_urls: "",
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
              image_urls: "",
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
          image_urls: "",
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
          image_urls: "",
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
      image_urls:
        "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop",
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
          image_urls: "",
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
              image_urls: "",
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
          image_urls: "",
          replies: [],
        },
      ],
    },
  ];

  const relatedPosts = [
    {
      id: 3,
      title: "Phương trình bậc nhất giải như thế nào?",
      subject: "Toán",
    },
    { id: 4, title: "Bài tập về phương trình bậc hai khó", subject: "Toán" },
    { id: 5, title: "Công thức nghiệm thu gọn là gì?", subject: "Toán" },
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

  const handleBack = () => {
    if (location.state?.fromModal) {
      navigate("/forum/student/forums", { state: { fromModal: true } });
    } else {
      navigate("/forum/student/forums");
    }
  };

  const handleImageClick = (images: string[], idx: number) => {
    setDetailImages(images);
    setSelectedImageIndex(idx);
    setImageZoom(1);
    setShowImageModal(true);
  };

  const handleCloseImageModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowImageModal(false);
    setImageZoom(1);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  if (!post) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="bg-white rounded-lg p-8 text-center border">
          <p className="text-lg mb-4">Không tìm thấy bài viết</p>
          <Button onClick={handleBack}>Quay lại</Button>
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
    setExpandedReplies((prev: Set<number>) => {
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
    <>
      <div className="w-full h-full overflow-auto bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10 px-6 py-3">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại Forum
          </Button>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8">
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
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
                          {post.author_class} •{" "}
                          {formatTimestamp(post.created_at)}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="flex gap-2 mb-4">
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

                  <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    {post.content}
                  </p>

                  {post.image_urls &&
                    (() => {
                      const images = post.image_urls
                        .split(",")
                        .filter((url) => url.trim());
                      return (
                        images.length > 0 && (
                          <div
                            className={`mb-6 ${
                              images.length === 1
                                ? ""
                                : "grid grid-cols-2 gap-3"
                            }`}
                          >
                            {images.map((img, idx) => (
                              <div
                                key={idx}
                                className={`rounded-lg overflow-hidden border cursor-pointer hover:opacity-95 transition-opacity ${
                                  images.length === 1 ? "h-96" : "h-60"
                                }`}
                                onClick={() => handleImageClick(images, idx)}
                              >
                                <img
                                  src={img}
                                  alt={`${post.title} ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )
                      );
                    })()}

                  <div className="flex items-center gap-4 pt-4 border-t">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageSquare className="w-4 h-4" />
                      {post.comment_count}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Share2 className="w-4 h-4" />
                      Chia sẻ
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Bookmark className="w-4 h-4" />
                      Lưu
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-xl">
                      Bình luận ({post.comment_count})
                    </h3>
                    <Select value={commentSort} onValueChange={setCommentSort}>
                      <SelectTrigger className="w-36 h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Mới nhất</SelectItem>
                        <SelectItem value="oldest">Cũ nhất</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 mb-6 pb-6 border-b">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                        U
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Viết bình luận của bạn..."
                        className="rounded-lg"
                      />
                      <Button className="rounded-lg px-6">
                        <Send className="w-4 h-4 mr-2" />
                        Gửi
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {getSortedComments(post.comments).map((comment) => {
                      const isRepliesExpanded = expandedReplies.has(
                        comment.comment_id
                      );
                      const replies = comment.replies || [];
                      return (
                        <div
                          key={comment.comment_id}
                          className="border-l-2 border-gray-200 pl-4"
                        >
                          <div className="flex gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-orange-400 text-white font-bold">
                                {comment.author_initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">
                                    {comment.author_name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatTimestamp(comment.created_at)}
                                  </span>
                                </div>
                                <p className="text-gray-700 mb-2">
                                  {comment.content}
                                </p>
                                <div className="flex gap-3">
                                  <button
                                    className="text-sm text-gray-600 hover:text-purple-600 font-semibold"
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
                                  {replies.length > 0 && (
                                    <button
                                      onClick={() =>
                                        toggleReplies(comment.comment_id)
                                      }
                                      className="text-sm text-gray-600 hover:text-purple-600 font-semibold flex items-center gap-1"
                                    >
                                      {isRepliesExpanded ? (
                                        <ChevronUp className="w-3 h-3" />
                                      ) : (
                                        <ChevronDown className="w-3 h-3" />
                                      )}
                                      {replies.length} phản hồi
                                    </button>
                                  )}
                                </div>
                              </div>

                              {isRepliesExpanded && (
                                <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-200">
                                  {replies.map((reply) => (
                                    <div
                                      key={reply.comment_id}
                                      className="flex gap-3"
                                    >
                                      <Avatar className="w-8 h-8">
                                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs font-bold">
                                          {reply.author_initials}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-semibold text-sm">
                                            {reply.author_name}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {formatTimestamp(reply.created_at)}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-700 mb-1">
                                          {reply.content}
                                        </p>
                                        <button className="text-xs text-gray-600 hover:text-purple-600 font-semibold">
                                          Phản hồi
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {replyingTo === comment.comment_id && (
                                <div className="flex gap-2 mt-4 pl-6">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                                      U
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 flex gap-2">
                                    <Input
                                      placeholder="Viết phản hồi..."
                                      className="rounded-lg text-sm"
                                      autoFocus
                                    />
                                    <Button size="sm" className="rounded-lg">
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
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="col-span-4 space-y-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-bold mb-4">Thông tin chi tiết</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Môn học</span>
                      <Badge
                        className={`${getSubjectColor(
                          post.subject_name
                        )} text-white`}
                      >
                        {post.subject_name}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loại bài viết</span>
                      <Badge
                        variant="outline"
                        className={getFlairColor(post.flair_name)}
                      >
                        {post.flair_name}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lớp</span>
                      <span className="font-medium">{post.author_class}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thời gian</span>
                      <span className="font-medium">
                        {formatTimestamp(post.created_at)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-bold mb-4">Bài viết liên quan</h3>
                  <div className="space-y-3">
                    {relatedPosts.map((related) => (
                      <button
                        key={related.id}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() =>
                          navigate(
                            `/forum/student/forums/details/${related.id}`
                          )
                        }
                      >
                        <p className="font-medium text-sm mb-1 line-clamp-2">
                          {related.title}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {related.subject}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-bold mb-3">Quy tắc Forum</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex gap-2">
                      <span className="text-purple-600">•</span>
                      <span>Tôn trọng mọi người</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-600">•</span>
                      <span>Không spam</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-600">•</span>
                      <span>Nội dung phù hợp học tập</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>

      {showImageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-[100] flex items-center justify-center p-4"
          onClick={handleCloseImageModal}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 w-12 h-12 flex items-center justify-center"
            onClick={handleCloseImageModal}
          >
            ×
          </button>

          <div className="absolute top-4 left-4 flex gap-2">
            <button
              className="text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
              onClick={handleZoomIn}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              className="text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
              onClick={handleZoomOut}
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-white bg-black bg-opacity-50 rounded-full px-3 h-10 flex items-center">
              {Math.round(imageZoom * 100)}%
            </span>
          </div>

          {detailImages.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white text-4xl hover:text-gray-300 w-12 h-12 flex items-center justify-center bg-black bg-opacity-50 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev === 0 ? detailImages.length - 1 : prev - 1
                  );
                }}
              >
                ‹
              </button>
              <button
                className="absolute right-20 text-white text-4xl hover:text-gray-300 w-12 h-12 flex items-center justify-center bg-black bg-opacity-50 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev === detailImages.length - 1 ? 0 : prev + 1
                  );
                }}
              >
                ›
              </button>
              <div className="absolute bottom-4 text-white text-sm">
                {selectedImageIndex + 1} / {detailImages.length}
              </div>
            </>
          )}

          <img
            src={detailImages[selectedImageIndex]}
            alt="Full size"
            className="object-contain transition-transform duration-200"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              transform: `scale(${imageZoom})`,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default PostDetail;
