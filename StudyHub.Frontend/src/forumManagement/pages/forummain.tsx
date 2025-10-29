// StudyHub.Frontend/src/forumManagement/pages/forummain.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/common/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import {
  Search,
  MessageSquare,
  Eye,
  ChevronDown,
  X,
  Filter,
  TrendingUp,
  Calendar,
  Users,
  ChevronUp,
  Send,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { useNavigate } from "react-router-dom";

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
  date: Date;
  subject: string;
  flair: string;
  title: string;
  content: string;
  views: number;
  comments: Comment[];
  isMyPost: boolean;
}

const App = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedFlairs, setSelectedFlairs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [visiblePosts, setVisiblePosts] = useState(5);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedComments, setExpandedComments] = useState<Set<number>>(
    new Set()
  );
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(
    new Set()
  );
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [commentSort, setCommentSort] = useState<{ [key: number]: string }>({});

  const posts: Post[] = [
    {
      id: 1,
      author: "Nguyễn Minh An",
      authorInitials: "AN",
      class: "10A1",
      timestamp: "2 giờ trước",
      date: new Date("2024-10-23T10:00:00"),
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
      isMyPost: true,
    },
    {
      id: 2,
      author: "Hoàng Đức Long",
      authorInitials: "DL",
      class: "11B2",
      timestamp: "5 giờ trước",
      date: new Date("2024-10-23T07:00:00"),
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
      isMyPost: false,
    },
    {
      id: 3,
      author: "Lý Thảo Phương",
      authorInitials: "TP",
      class: "12A3",
      timestamp: "1 ngày trước",
      date: new Date("2024-10-22T12:00:00"),
      subject: "Tiếng Anh",
      flair: "Câu hỏi",
      title: "Phân biệt present perfect và past simple như thế nào?",
      content:
        "Mình hay bị nhầm lẫn giữa hai thì này. Khi nào thì dùng present perfect và khi nào dùng past simple? Các bạn có thể cho mình vài ví dụ cụ thể được không ạ?",
      views: 534,
      comments: [
        {
          id: 6,
          author: "Đỗ Quỳnh Hoa",
          initials: "QH",
          time: "20 giờ trước",
          text: "Present perfect dùng khi hành động xảy ra trong quá khứ nhưng liên quan đến hiện tại. Past simple dùng khi hành động đã hoàn toàn kết thúc trong quá khứ!",
          replies: [],
        },
        {
          id: 7,
          author: "Phan Duy Khánh",
          initials: "DK",
          time: "18 giờ trước",
          text: 'Ví dụ: "I have lived here for 5 years" (vẫn đang sống) - Present Perfect. "I lived there for 5 years" (không sống nữa) - Past Simple.',
          replies: [
            {
              id: 71,
              author: "Lý Thảo Phương",
              initials: "TP",
              time: "17 giờ trước",
              text: "Ví dụ rất rõ ràng, thanks bạn!",
            },
          ],
        },
        {
          id: 8,
          author: "Nguyễn Linh Anh",
          initials: "LA",
          time: "15 giờ trước",
          text: 'Dấu hiệu nhận biết: Present Perfect có "already, yet, just, ever, never, since, for". Past Simple có "yesterday, ago, last week, in 2020".',
          replies: [],
        },
        {
          id: 9,
          author: "Trương Minh Bảo",
          initials: "MB",
          time: "10 giờ trước",
          text: "Mình thi thử thấy câu này hay ra lắm. Bạn nên học thuộc các từ nhận biết và làm nhiều bài tập để quen nhé!",
          replies: [],
        },
      ],
      isMyPost: false,
    },
    {
      id: 4,
      author: "Nguyễn Minh An",
      authorInitials: "AN",
      class: "10A1",
      timestamp: "3 ngày trước",
      date: new Date("2024-10-20T15:00:00"),
      subject: "Hóa học",
      flair: "Kiến thức",
      title: "Tổng hợp kiến thức về bảng tuần hoàn",
      content:
        "Mình làm bảng tổng hợp các nguyên tố hóa học theo chu kỳ, chia sẻ cho các bạn tham khảo. Bảng tuần hoàn gồm 7 chu kỳ và 18 nhóm, các nguyên tố được sắp xếp theo số hiệu nguyên tử tăng dần.",
      views: 756,
      comments: [
        {
          id: 10,
          author: "Võ Minh Tâm",
          initials: "MT",
          time: "2 ngày trước",
          text: "Cảm ơn bạn nhiều! Bảng này rất hữu ích cho việc học thuộc các nguyên tố.",
          replies: [],
        },
        {
          id: 11,
          author: "Lê Hải Yến",
          initials: "HY",
          time: "2 ngày trước",
          text: "Bạn có thể chia sẻ thêm về cách ghi nhớ các nguyên tố không?",
          replies: [
            {
              id: 111,
              author: "Nguyễn Minh An",
              initials: "AN",
              time: "1 ngày trước",
              text: "Mình sẽ làm thêm một bài về các mẹo ghi nhớ nhé!",
            },
          ],
        },
      ],
      isMyPost: true,
    },
    {
      id: 5,
      author: "Trần Quốc Khánh",
      authorInitials: "QK",
      class: "11A5",
      timestamp: "4 ngày trước",
      date: new Date("2024-10-19T09:00:00"),
      subject: "Văn",
      flair: "Thảo luận",
      title: "Bàn về nhân vật Tràng trong Vợ nhặt",
      content:
        "Theo các bạn, nhân vật Tràng có những nét tính cách gì nổi bật? Mình thấy Tràng vừa nghèo khổ nhưng lại rất nhân hậu và tốt bụng.",
      views: 398,
      comments: [
        {
          id: 12,
          author: "Phạm Thu Hà",
          initials: "TH",
          time: "3 ngày trước",
          text: "Mình nghĩ Tràng là hiện thân của người nông dân Việt Nam truyền thống - chất phác, nghèo khổ nhưng giàu lòng nhân ái.",
          replies: [
            {
              id: 121,
              author: "Trần Quốc Khánh",
              initials: "QK",
              time: "3 ngày trước",
              text: "Đồng ý với bạn! Nhân vật này rất điển hình",
            },
          ],
        },
      ],
      isMyPost: false,
    },
  ];

  const subjects = [
    "Toán",
    "Vật Lý",
    "Tiếng Anh",
    "Hóa học",
    "Văn",
    "Sinh học",
    "Lịch sử",
  ];
  const flairs = ["Câu hỏi", "Kiến thức", "Thảo luận"];

  const trendingTopics = [
    { title: "Phương trình bậc hai", count: 45, trending: true },
    { title: "Định luật Newton", count: 38, trending: true },
    { title: "Present Perfect", count: 52, trending: true },
    { title: "Bảng tuần hoàn", count: 31, trending: false },
    { title: "Công thức lượng giác", count: 29, trending: false },
  ];

  const upcomingEvents = [
    { title: "Kiểm tra giữa kỳ Toán", date: "25/10/2024" },
    { title: "Thi học kỳ Vật Lý", date: "28/10/2024" },
    { title: "Nộp bài tập lớn Hóa", date: "30/10/2024" },
  ];

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

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const toggleFlair = (flair: string) => {
    setSelectedFlairs((prev) =>
      prev.includes(flair) ? prev.filter((f) => f !== flair) : [...prev, flair]
    );
  };

  const toggleComments = (postId: number) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
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

  const sortPosts = (posts: Post[]) => {
    switch (sortBy) {
      case "newest":
        return [...posts].sort((a, b) => b.date.getTime() - a.date.getTime());
      case "oldest":
        return [...posts].sort((a, b) => a.date.getTime() - b.date.getTime());
      case "mostViewed":
        return [...posts].sort((a, b) => b.views - a.views);
      case "mostCommented":
        return [...posts].sort((a, b) => b.comments.length - a.comments.length);
      default:
        return posts;
    }
  };

  const getSortedComments = (comments: Comment[], postId: number) => {
    const sort = commentSort[postId] || "newest";
    switch (sort) {
      case "newest":
        return [...comments].reverse();
      case "oldest":
        return [...comments];
      default:
        return comments;
    }
  };

  const filteredPosts = sortPosts(
    posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject =
        selectedSubjects.length === 0 ||
        selectedSubjects.includes(post.subject);
      const matchesFlair =
        selectedFlairs.length === 0 || selectedFlairs.includes(post.flair);
      return matchesSearch && matchesSubject && matchesFlair;
    })
  );

  const myPosts = posts.filter((post) => post.isMyPost);

  const handleLoadMore = () => {
    setVisiblePosts((prev) => prev + 5);
  };

  const handlePostClick = (postId: number) => {
    navigate(`/forum/student/forums/details/${postId}`);
  };

  const PostCard = ({ post }: { post: Post }) => {
    const isCommentsExpanded = expandedComments.has(post.id);
    const previewComments = post.comments.slice(0, 2);
    const hasMoreComments = post.comments.length > 2;

    return (
      <Card className="mb-4 hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
                  {post.authorInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{post.author}</div>
                <div className="text-xs text-gray-500">
                  {post.timestamp} • {post.class}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={`${getSubjectColor(post.subject)} text-white`}>
                {post.subject}
              </Badge>
              <Badge variant="outline" className={getFlairColor(post.flair)}>
                {post.flair}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div
            onClick={() => handlePostClick(post.id)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <h2 className="text-xl font-bold mb-2">{post.title}</h2>
            <p className="text-gray-700 mb-4">{post.content}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 pt-2 border-t">
            <button
              onClick={() => toggleComments(post.id)}
              className="flex items-center gap-1 hover:text-purple-600 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{post.comments.length} bình luận</span>
            </button>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{post.views} lượt xem</span>
            </div>
          </div>

          {!isCommentsExpanded && post.comments.length > 0 && (
            <div className="space-y-2 mb-3">
              {previewComments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-2 pl-2 border-l-2 border-gray-200"
                >
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-orange-400 text-white text-xs font-bold">
                      {comment.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-xs">
                      <span className="font-semibold">{comment.author}</span>
                      <span className="text-gray-600 ml-2">{comment.text}</span>
                    </div>
                  </div>
                </div>
              ))}

              {hasMoreComments && (
                <button
                  onClick={() => toggleComments(post.id)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 ml-2 hover:underline transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                  Xem thêm {post.comments.length - 2} bình luận
                </button>
              )}
            </div>
          )}

          {isCommentsExpanded && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm font-semibold text-gray-700">
                  {post.comments.length} bình luận
                </span>
                <Select
                  value={commentSort[post.id] || "newest"}
                  onValueChange={(value) =>
                    setCommentSort((prev) => ({ ...prev, [post.id]: value }))
                  }
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="oldest">Cũ nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {getSortedComments(post.comments, post.id).map((comment) => {
                const isRepliesExpanded = expandedReplies.has(comment.id);
                return (
                  <div key={comment.id}>
                    <div className="flex gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-pink-400 to-orange-400 text-white text-xs font-bold">
                          {comment.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-2xl px-3 py-2 hover:bg-gray-200 transition-colors">
                          <div className="font-semibold text-sm">
                            {comment.author}
                          </div>
                          <p className="text-sm">{comment.text}</p>
                        </div>
                        <div className="flex gap-3 px-3 mt-1">
                          <button
                            className="text-xs text-gray-600 hover:underline font-semibold hover:text-purple-600 transition-colors"
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
                            className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-purple-600 hover:underline mt-2 ml-3 transition-colors"
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
                              className="flex gap-2 mt-2 ml-8"
                            >
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs font-bold">
                                  {reply.initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-gray-100 rounded-2xl px-3 py-2 hover:bg-gray-200 transition-colors">
                                  <div className="font-semibold text-xs">
                                    {reply.author}
                                  </div>
                                  <p className="text-xs">{reply.text}</p>
                                </div>
                                <div className="flex gap-3 px-3 mt-1">
                                  <button className="text-xs text-gray-600 hover:underline font-semibold hover:text-purple-600 transition-colors">
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
                onClick={() => toggleComments(post.id)}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            📚 Forum Học Tập
          </h1>
          <p className="text-gray-600">
            Nơi học sinh chia sẻ và giải đáp thắc mắc
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-lg">Bộ lọc</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm">
                          Môn học{" "}
                          {selectedSubjects.length > 0 &&
                            `(${selectedSubjects.length})`}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {subjects.map((subject) => (
                        <DropdownMenuCheckboxItem
                          key={subject}
                          checked={selectedSubjects.includes(subject)}
                          onCheckedChange={() => toggleSubject(subject)}
                        >
                          {subject}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {selectedSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedSubjects.map((subject) => (
                        <Badge
                          key={subject}
                          className={`${getSubjectColor(
                            subject
                          )} text-white cursor-pointer hover:opacity-80 transition-opacity`}
                          onClick={() => toggleSubject(subject)}
                        >
                          {subject}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm">
                          Loại bài viết{" "}
                          {selectedFlairs.length > 0 &&
                            `(${selectedFlairs.length})`}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {flairs.map((flair) => (
                        <DropdownMenuCheckboxItem
                          key={flair}
                          checked={selectedFlairs.includes(flair)}
                          onCheckedChange={() => toggleFlair(flair)}
                        >
                          {flair}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {selectedFlairs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedFlairs.map((flair) => (
                        <Badge
                          key={flair}
                          variant="outline"
                          className={`${getFlairColor(
                            flair
                          )} cursor-pointer hover:opacity-80 transition-opacity`}
                          onClick={() => toggleFlair(flair)}
                        >
                          {flair}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {(selectedSubjects.length > 0 || selectedFlairs.length > 0) && (
                  <Button
                    variant="ghost"
                    className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => {
                      setSelectedSubjects([]);
                      setSelectedFlairs([]);
                    }}
                  >
                    Xóa tất cả bộ lọc
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>

          <main className="col-span-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <div className="bg-white rounded-lg shadow-md p-1">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all"
                  >
                    Tất cả bài viết
                  </TabsTrigger>
                  <TabsTrigger
                    value="my"
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all"
                  >
                    Bài viết của tôi
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm bài viết..."
                    className="pl-10 hover:border-purple-300 focus:border-purple-500 transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Tìm thấy <strong>{filteredPosts.length}</strong> bài viết
                  </span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48 hover:border-purple-300 transition-colors">
                      <SelectValue placeholder="Sắp xếp theo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Mới nhất</SelectItem>
                      <SelectItem value="oldest">Cũ nhất</SelectItem>
                      <SelectItem value="mostViewed">Xem nhiều nhất</SelectItem>
                      <SelectItem value="mostCommented">
                        Nhiều bình luận nhất
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="all" className="space-y-6 mt-0">
                {filteredPosts.slice(0, visiblePosts).map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
                {visiblePosts < filteredPosts.length && (
                  <div className="flex justify-center">
                    <Button
                      onClick={handleLoadMore}
                      className="bg-white text-purple-600 hover:bg-gray-50 shadow-md hover:shadow-lg transition-all"
                      size="lg"
                    >
                      Xem thêm bài viết
                    </Button>
                  </div>
                )}
                {filteredPosts.length === 0 && (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <p className="text-gray-500 text-lg">
                      Không tìm thấy bài viết nào phù hợp
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="my" className="space-y-6 mt-0">
                {myPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
                {myPosts.length === 0 && (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <p className="text-gray-500 text-lg">
                      Bạn chưa có bài viết nào
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </main>

          <aside className="col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold text-lg">Chủ đề nổi bật</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {topic.trending && (
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                      )}
                      <span className="text-sm font-medium">{topic.title}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {topic.count}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-lg">Sự kiện sắp tới</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div
                    key={index}
                    className="p-3 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-sm text-blue-900">
                      {event.title}
                    </div>
                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {event.date}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" />
                  <h3 className="font-bold text-lg">Thống kê</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                  <span className="text-sm text-gray-600">Tổng bài viết</span>
                  <span className="font-bold text-lg text-purple-600">248</span>
                </div>
                <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                  <span className="text-sm text-gray-600">
                    Thành viên hoạt động
                  </span>
                  <span className="font-bold text-lg text-green-600">156</span>
                </div>
                <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                  <span className="text-sm text-gray-600">
                    Bình luận hôm nay
                  </span>
                  <span className="font-bold text-lg text-orange-600">89</span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default App;
