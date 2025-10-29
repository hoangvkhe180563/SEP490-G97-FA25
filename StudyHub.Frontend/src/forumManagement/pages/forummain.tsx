// StudyHub.Frontend/src/forumManagement/pages/forummain.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import { Search, ChevronDown, X, Filter, Users } from "lucide-react";
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
import PostCard from "../components/PostCard";
import type { Post, Subject, Flair } from "../interfaces/forum";

const ForumMain = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [selectedFlairs, setSelectedFlairs] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [visiblePosts, setVisiblePosts] = useState(5);

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

  const subjects: Subject[] = [
    { id: 1, name: "Toán" },
    { id: 2, name: "Vật Lý" },
    { id: 3, name: "Tiếng Anh" },
    { id: 4, name: "Hóa học" },
    { id: 5, name: "Văn" },
    { id: 6, name: "Sinh học" },
    { id: 7, name: "Lịch sử" },
  ];

  const flairs: Flair[] = [
    { id: 1, name: "Câu hỏi" },
    { id: 2, name: "Kiến thức" },
    { id: 3, name: "Thảo luận" },
  ];

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

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((s) => s !== subjectId)
        : [...prev, subjectId]
    );
  };

  const toggleFlair = (flairId: number) => {
    setSelectedFlairs((prev) =>
      prev.includes(flairId)
        ? prev.filter((f) => f !== flairId)
        : [...prev, flairId]
    );
  };

  const sortPosts = (posts: Post[]) => {
    switch (sortBy) {
      case "newest":
        return [...posts].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return [...posts].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "mostCommented":
        return [...posts].sort((a, b) => b.comment_count - a.comment_count);
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
        selectedSubjects.includes(post.subject_id);
      const matchesFlair =
        selectedFlairs.length === 0 || selectedFlairs.includes(post.flair_id);
      return matchesSearch && matchesSubject && matchesFlair;
    })
  );

  const handleLoadMore = () => {
    setVisiblePosts((prev) => prev + 5);
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
                          key={subject.id}
                          checked={selectedSubjects.includes(subject.id)}
                          onCheckedChange={() => toggleSubject(subject.id)}
                        >
                          {subject.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {selectedSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedSubjects.map((subjectId) => {
                        const subject = subjects.find(
                          (s) => s.id === subjectId
                        );
                        return (
                          <Badge
                            key={subjectId}
                            className={`${getSubjectColor(
                              subject?.name || ""
                            )} text-white cursor-pointer hover:opacity-80 transition-opacity`}
                            onClick={() => toggleSubject(subjectId)}
                          >
                            {subject?.name}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        );
                      })}
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
                          key={flair.id}
                          checked={selectedFlairs.includes(flair.id)}
                          onCheckedChange={() => toggleFlair(flair.id)}
                        >
                          {flair.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {selectedFlairs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedFlairs.map((flairId) => {
                        const flair = flairs.find((f) => f.id === flairId);
                        return (
                          <Badge
                            key={flairId}
                            variant="outline"
                            className={`${getFlairColor(
                              flair?.name || ""
                            )} cursor-pointer hover:opacity-80 transition-opacity`}
                            onClick={() => toggleFlair(flairId)}
                          >
                            {flair?.name}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        );
                      })}
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
            <div className="space-y-6">
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

              {filteredPosts.slice(0, visiblePosts).map((post) => (
                <PostCard key={post.post_id} post={post} />
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
            </div>
          </main>

          <aside className="col-span-3 space-y-4">
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

export default ForumMain;
