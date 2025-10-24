import React, { useState, useRef } from "react";
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
import { Textarea } from "@/common/components/ui/textarea";
import {
  Search,
  MessageSquare,
  Eye,
  Reply,
  Image as ImageIcon,
  Paperclip,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Send,
  TrendingUp,
  Award,
  Users,
  Calendar,
  ChevronDown,
  X,
  Filter,
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

interface Comment {
  id: number;
  author: string;
  initials: string;
  time: string;
  text: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedFlairs, setSelectedFlairs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [visiblePosts, setVisiblePosts] = useState(5);
  const [activeTab, setActiveTab] = useState("all");
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
        },
        {
          id: 2,
          author: "Lê Tuấn",
          initials: "TL",
          time: "45 phút trước",
          text: "Mình có công thức nghiệm: x = (-b ± √Δ) / 2a. Bạn cứ tính delta trước rồi xét các trường hợp là được nhé!",
        },
        {
          id: 3,
          author: "Phạm Mai Hương",
          initials: "MH",
          time: "30 phút trước",
          text: "Mình thấy cô giáo giải trên lớp rất dễ hiểu. Bạn có thể xem lại bài giảng hoặc làm thêm bài tập để quen thuộc công thức hơn 😊",
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
          id: 1,
          author: "Vũ Khánh An",
          initials: "KA",
          time: "3 giờ trước",
          text: "Ví dụ đơn giản nhất là khi bạn đẩy tường, tường cũng đẩy ngược lại bạn với lực bằng nhau. Hoặc khi bạn nhảy, bạn đạp xuống đất và đất đẩy bạn lên trên!",
        },
        {
          id: 2,
          author: "Ngô Thanh Tùng",
          initials: "NT",
          time: "2 giờ trước",
          text: "Thêm ví dụ nữa: khi chèo thuyền, bạn dùng mái chèo đẩy nước về phía sau, nước đẩy thuyền về phía trước. Đây chính là định luật 3 Newton đấy!",
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
          id: 1,
          author: "Đỗ Quỳnh Hoa",
          initials: "QH",
          time: "20 giờ trước",
          text: "Present perfect dùng khi hành động xảy ra trong quá khứ nhưng liên quan đến hiện tại. Past simple dùng khi hành động đã hoàn toàn kết thúc trong quá khứ!",
        },
        {
          id: 2,
          author: "Phan Duy Khánh",
          initials: "DK",
          time: "18 giờ trước",
          text: 'Ví dụ: "I have lived here for 5 years" (vẫn đang sống) - Present Perfect. "I lived there for 5 years" (không sống nữa) - Past Simple.',
        },
        {
          id: 3,
          author: "Nguyễn Linh Anh",
          initials: "LA",
          time: "15 giờ trước",
          text: 'Dấu hiệu nhận biết: Present Perfect có "already, yet, just, ever, never, since, for". Past Simple có "yesterday, ago, last week, in 2020".',
        },
        {
          id: 4,
          author: "Trương Minh Bảo",
          initials: "MB",
          time: "10 giờ trước",
          text: "Mình thi thử thấy câu này hay ra lắm. Bạn nên học thuộc các từ nhận biết và làm nhiều bài tập để quen nhé!",
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
          id: 1,
          author: "Võ Minh Tâm",
          initials: "MT",
          time: "2 ngày trước",
          text: "Cảm ơn bạn nhiều! Bảng này rất hữu ích cho việc học thuộc các nguyên tố.",
        },
        {
          id: 2,
          author: "Lê Hải Yến",
          initials: "HY",
          time: "2 ngày trước",
          text: "Bạn có thể chia sẻ thêm về cách ghi nhớ các nguyên tố không?",
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
          id: 1,
          author: "Phạm Thu Hà",
          initials: "TH",
          time: "3 ngày trước",
          text: "Mình nghĩ Tràng là hiện thân của người nông dân Việt Nam truyền thống - chất phác, nghèo khổ nhưng giàu lòng nhân ái.",
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

  const topContributors = [
    { name: "Nguyễn Minh An", points: 1250, badge: "gold" },
    { name: "Đặng Minh Tuấn", points: 980, badge: "silver" },
    { name: "Lý Thảo Phương", points: 856, badge: "bronze" },
    { name: "Hoàng Đức Long", points: 734, badge: "none" },
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

  const handleCommentChange = (postId: number, value: string) => {
    setCommentTexts((prev) => ({ ...prev, [postId]: value }));
  };

  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const insertFormatting = (postId: number, format: string) => {
    const textarea = document.getElementById(
      `comment-${postId}`
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = commentTexts[postId] || "";
    const selectedText = text.substring(start, end);

    let formattedText = "";
    let cursorOffset = 0;

    switch (format) {
      case "bold":
        formattedText = `**${selectedText || "text"}**`;
        cursorOffset = selectedText ? 0 : -2;
        break;
      case "italic":
        formattedText = `*${selectedText || "text"}*`;
        cursorOffset = selectedText ? 0 : -1;
        break;
      case "list":
        formattedText = `\n- ${selectedText || "item"}`;
        cursorOffset = selectedText ? 0 : -4;
        break;
      case "link":
        formattedText = `[${selectedText || "text"}](url)`;
        cursorOffset = selectedText ? -4 : -9;
        break;
    }

    const newText =
      text.substring(0, start) + formattedText + text.substring(end);
    setCommentTexts((prev) => ({ ...prev, [postId]: newText }));

    setTimeout(() => {
      const newPosition = start + formattedText.length + cursorOffset;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  const EditorToolbar = ({ postId }: { postId: number }) => (
    <div className="flex items-center gap-1 p-2 border-t bg-gray-50">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => insertFormatting(postId, "bold")}
        type="button"
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => insertFormatting(postId, "italic")}
        type="button"
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => insertFormatting(postId, "list")}
        type="button"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => insertFormatting(postId, "link")}
        type="button"
      >
        <LinkIcon className="w-4 h-4" />
      </Button>
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2"
        onClick={handleImageUpload}
        type="button"
      >
        <ImageIcon className="w-4 h-4 mr-1" />
        Ảnh
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2"
        onClick={handleFileUpload}
        type="button"
      >
        <Paperclip className="w-4 h-4 mr-1" />
        File
      </Button>
      <Button
        size="sm"
        className="h-8 bg-purple-600 hover:bg-purple-700 ml-2"
        type="button"
      >
        <Send className="w-4 h-4 mr-1" />
        Gửi
      </Button>
    </div>
  );

  const PostCard = ({ post }: { post: Post }) => (
    <Card className="mb-6 hover:shadow-xl transition-all duration-300">
      <CardHeader>
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
                {post.class} • {post.timestamp}
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
        <h2 className="text-2xl font-bold mb-3 text-gray-800">{post.title}</h2>
        <p className="text-gray-600 leading-relaxed mb-4">{post.content}</p>

        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <div className="flex items-center gap-2 text-purple-600 font-semibold mb-3">
            <MessageSquare className="w-5 h-5" />
            <span>{post.comments.length} bình luận</span>
          </div>

          <div className="space-y-3 mb-4">
            {post.comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white rounded-lg p-4 border-l-4 border-purple-500"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-orange-400 text-white text-sm font-bold">
                      {comment.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <span className="font-semibold text-sm">
                      {comment.author}
                    </span>
                    <span className="text-gray-500 text-xs ml-2">
                      {comment.time}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setReplyingTo(
                        replyingTo === comment.id ? null : comment.id
                      )
                    }
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    type="button"
                  >
                    <Reply className="w-4 h-4 mr-1" />
                    Trả lời
                  </Button>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {comment.text}
                </p>
                {replyingTo === comment.id && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-300">
                    <div className="border rounded-lg overflow-hidden">
                      <Textarea
                        id={`comment-reply-${comment.id}`}
                        placeholder="Nhập câu trả lời của bạn..."
                        className="border-0 resize-none focus-visible:ring-0"
                        rows={3}
                      />
                      <EditorToolbar postId={comment.id * 1000} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border rounded-lg overflow-hidden bg-white">
            <Textarea
              id={`comment-${post.id}`}
              placeholder="Viết bình luận của bạn..."
              className="border-0 resize-none focus-visible:ring-0"
              rows={4}
              value={commentTexts[post.id] || ""}
              onChange={(e) => handleCommentChange(post.id, e.target.value)}
            />
            <EditorToolbar postId={post.id} />
          </div>
        </div>

        <div className="flex gap-6 mt-4 pt-4 border-t text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {post.views} lượt xem
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {post.comments.length} bình luận
          </span>
        </div>
      </CardContent>
    </Card>
  );

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
            <Card className="sticky top-6 z-10">
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
                        className="w-full justify-between"
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
                          )} text-white cursor-pointer`}
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
                        className="w-full justify-between"
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
                          className={`${getFlairColor(flair)} cursor-pointer`}
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
                    className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
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
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                  >
                    Tất cả bài viết
                  </TabsTrigger>
                  <TabsTrigger
                    value="my"
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
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
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Tìm thấy <strong>{filteredPosts.length}</strong> bài viết
                  </span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
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
                      className="bg-white text-purple-600 hover:bg-gray-50 shadow-md"
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
            <Card className="sticky top-6 z-10">
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
                  <Award className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-bold text-lg">Top Contributor</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {topContributors.map((contributor, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="text-lg font-bold text-gray-400">
                      #{index + 1}
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback
                        className={`
                        ${
                          contributor.badge === "gold"
                            ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                            : ""
                        }
                        ${
                          contributor.badge === "silver"
                            ? "bg-gradient-to-br from-gray-300 to-gray-500"
                            : ""
                        }
                        ${
                          contributor.badge === "bronze"
                            ? "bg-gradient-to-br from-orange-400 to-orange-600"
                            : ""
                        }
                        ${
                          contributor.badge === "none"
                            ? "bg-gradient-to-br from-purple-400 to-pink-400"
                            : ""
                        }
                        text-white font-bold text-sm
                      `}
                      >
                        {contributor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">
                        {contributor.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {contributor.points} điểm
                      </div>
                    </div>
                    {contributor.badge !== "none" && (
                      <Award
                        className={`
                        w-5 h-5
                        ${contributor.badge === "gold" ? "text-yellow-500" : ""}
                        ${contributor.badge === "silver" ? "text-gray-400" : ""}
                        ${
                          contributor.badge === "bronze"
                            ? "text-orange-500"
                            : ""
                        }
                      `}
                      />
                    )}
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
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm text-gray-600">Tổng bài viết</span>
                  <span className="font-bold text-lg text-purple-600">248</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm text-gray-600">
                    Thành viên hoạt động
                  </span>
                  <span className="font-bold text-lg text-green-600">156</span>
                </div>
                <div className="flex justify-between items-center p-2">
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

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
      />
      <input ref={fileInputRef} type="file" className="hidden" />
    </div>
  );
};

export default App;
