// forummain.tsx - Full code
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import {
  Search,
  ChevronDown,
  X,
  Filter,
  Users,
  ArrowUp,
  ExternalLink,
  ZoomIn,
  ZoomOut,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import PostCard from "../components/PostCard";
import type { Post, Subject, Flair } from "../interfaces/forum";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import { MessageSquare, Send, ChevronUp } from "lucide-react";

const ForumMain = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const observerTarget = useRef<HTMLDivElement>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [imageZoom, setImageZoom] = useState(1);

  const getInitialState = () => {
    const saved = sessionStorage.getItem("forumMainState");
    if (saved && location.state?.fromModal) {
      const parsed = JSON.parse(saved);
      return parsed;
    }
    return {
      searchQuery: searchParams.get("q") || "",
      selectedSubjects: searchParams.get("subjects")
        ? searchParams.get("subjects")!.split(",").map(Number)
        : [],
      selectedFlairs: searchParams.get("flairs")
        ? searchParams.get("flairs")!.split(",").map(Number)
        : [],
      sortBy: searchParams.get("sort") || "newest",
      visiblePosts: 10,
      scrollPosition: 0,
    };
  };

  const initialState = getInitialState();

  const [searchQuery, setSearchQuery] = useState<string>(
    initialState.searchQuery
  );
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>(
    initialState.selectedSubjects
  );
  const [selectedFlairs, setSelectedFlairs] = useState<number[]>(
    initialState.selectedFlairs
  );
  const [sortBy, setSortBy] = useState<string>(initialState.sortBy);
  const [visiblePosts, setVisiblePosts] = useState(initialState.visiblePosts);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(
    new Set()
  );
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [commentSort, setCommentSort] = useState("newest");
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const modalPostId = searchParams.get("postId");
  const isModalOpen = !!modalPostId;

  useEffect(() => {
    const state = {
      searchQuery,
      selectedSubjects,
      selectedFlairs,
      sortBy,
      visiblePosts,
      scrollPosition: window.scrollY,
    };
    sessionStorage.setItem("forumMainState", JSON.stringify(state));
  }, [searchQuery, selectedSubjects, selectedFlairs, sortBy, visiblePosts]);

  useEffect(() => {
    if (location.state?.fromModal && initialState.scrollPosition) {
      window.scrollTo(0, initialState.scrollPosition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    if (searchQuery) newSearchParams.set("q", searchQuery);
    if (selectedSubjects.length > 0)
      newSearchParams.set("subjects", selectedSubjects.join(","));
    if (selectedFlairs.length > 0)
      newSearchParams.set("flairs", selectedFlairs.join(","));
    if (sortBy !== "newest") newSearchParams.set("sort", sortBy);
    if (modalPostId) newSearchParams.set("postId", modalPostId);

    setSearchParams(newSearchParams, { replace: true });
  }, [
    searchQuery,
    selectedSubjects,
    selectedFlairs,
    sortBy,
    modalPostId,
    setSearchParams,
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoadingMore &&
          visiblePosts < filteredPosts.length
        ) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisiblePosts((prev: number) => prev + 5);
            setIsLoadingMore(false);
          }, 500);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(observerTarget.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingMore, visiblePosts]);

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
          replies: [],
          image_urls: "",
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
          image_urls: "",
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjects((prev: number[]) =>
      prev.includes(subjectId)
        ? prev.filter((s) => s !== subjectId)
        : [...prev, subjectId]
    );
  };

  const toggleFlair = (flairId: number) => {
    setSelectedFlairs((prev: number[]) =>
      prev.includes(flairId)
        ? prev.filter((f) => f !== flairId)
        : [...prev, flairId]
    );
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedSubjects([]);
    setSelectedFlairs([]);
    setSortBy("newest");
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

  const handleOpenModal = (postId: number) => {
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set("postId", postId.toString());
    navigate(`?${currentParams.toString()}`, { replace: false });
  };

  const handleCloseModal = () => {
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.delete("postId");
    navigate(`?${currentParams.toString()}`, { replace: false });
  };

  const handleViewDetails = (postId: number) => {
    navigate(`/forum/student/forums/details/${postId}`);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setHasNewPosts(false);
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

  const getSortedComments = (comments: Post["comments"]) => {
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

  const handleImageClick = (
    e: React.MouseEvent,
    images: string[],
    idx: number
  ) => {
    e.stopPropagation();
    setModalImages(images);
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

  const modalPost = isModalOpen
    ? posts.find((p) => p.post_id === Number(modalPostId))
    : null;

  return (
    <div className="w-full h-full overflow-auto p-2">
      <div className="max-w mx-auto">
        <div className="bg-white rounded-2xl p-8 mb-8 border">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Forum Học Tập
          </h1>
          <p className="text-gray-600">
            Nơi học sinh chia sẻ và giải đáp thắc mắc
          </p>
        </div>

        {hasNewPosts && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-2 duration-300">
            <Button
              onClick={handleScrollToTop}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              Có bài viết mới
            </Button>
          </div>
        )}

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
                    onClick={handleClearFilters}
                  >
                    Xóa tất cả bộ lọc
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>

          <main className="col-span-6">
            <div className="space-y-6">
              <div className="bg-white rounded-lg border p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm bài viết..."
                    className="pl-10 hover:border-purple-300 focus:border-purple-500 transition-colors"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Tìm thấy <strong>{filteredPosts.length}</strong> bài viết
                  </span>
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-48 hover:border-purple-300 transition-colors">
                      <SelectValue placeholder="Sắp xếp theo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Mới nhất</SelectItem>
                      <SelectItem value="oldest">Cũ nhất</SelectItem>
                      <SelectItem value="mostCommented">
                        Nhiều bình luận nhất
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredPosts.slice(0, visiblePosts).map((post) => (
                <div
                  key={post.post_id}
                  onDoubleClick={() => handleViewDetails(post.post_id)}
                >
                  <PostCard
                    post={post}
                    onOpenComments={() => handleOpenModal(post.post_id)}
                    onViewDetails={() => handleViewDetails(post.post_id)}
                  />
                </div>
              ))}

              <div
                ref={observerTarget}
                className="h-10 flex items-center justify-center"
              >
                {isLoadingMore && visiblePosts < filteredPosts.length && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    <span className="text-sm">Đang tải...</span>
                  </div>
                )}
              </div>

              {filteredPosts.length === 0 && (
                <div className="bg-white rounded-lg border p-12 text-center">
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

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="!max-w-[95vw] !w-[60vw] h-[90vh] p-0 flex flex-col">
          {modalPost && (
            <>
              <DialogHeader className="p-4 border-b flex-shrink-0">
                <DialogTitle className="sr-only">{modalPost.title}</DialogTitle>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => handleViewDetails(modalPost.post_id)}
                    className="w-fit hover:bg-gray-100 transition-colors gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Xem chi tiết
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                          {modalPost.author_initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-lg">
                          {modalPost.author_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTimestamp(modalPost.created_at)} •{" "}
                          {modalPost.author_class}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        className={`${getSubjectColor(
                          modalPost.subject_name
                        )} text-white`}
                      >
                        {modalPost.subject_name}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getFlairColor(modalPost.flair_name)}
                      >
                        {modalPost.flair_name}
                      </Badge>
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold mb-4">{modalPost.title}</h1>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    {modalPost.content}
                  </p>

                  {modalPost.image_urls &&
                    (() => {
                      const images = modalPost.image_urls
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
                                className={`rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity ${
                                  images.length === 1 ? "h-96" : "h-60"
                                }`}
                                onClick={(e) =>
                                  handleImageClick(e, images, idx)
                                }
                              >
                                <img
                                  src={img}
                                  alt={`${modalPost.title} ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )
                      );
                    })()}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pt-4 border-t">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{modalPost.comment_count} bình luận</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b">
                      <h3 className="font-bold text-lg">
                        Bình luận ({modalPost.comment_count})
                      </h3>
                      <Select
                        value={commentSort}
                        onValueChange={setCommentSort}
                      >
                        <SelectTrigger className="w-32 h-9 text-sm hover:border-purple-300 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Mới nhất</SelectItem>
                          <SelectItem value="oldest">Cũ nhất</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {getSortedComments(modalPost.comments).map((comment) => {
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
                                <p className="text-sm mt-1">
                                  {comment.content}
                                </p>
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
                                  onClick={() =>
                                    toggleReplies(comment.comment_id)
                                  }
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
                </div>
              </div>

              <div className="border-t p-4 bg-gray-50 flex-shrink-0">
                <div className="flex gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold">
                      U
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Viết bình luận..."
                      className="rounded-full hover:border-purple-300 focus:border-purple-500 transition-colors"
                    />
                    <Button className="rounded-full px-6 hover:scale-105 transition-transform">
                      <Send className="w-4 h-4 mr-2" />
                      Gửi
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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

          {modalImages.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white text-4xl hover:text-gray-300 w-12 h-12 flex items-center justify-center bg-black bg-opacity-50 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev === 0 ? modalImages.length - 1 : prev - 1
                  );
                }}
              >
                ‹
              </button>
              <button
                className="absolute right-4 text-white text-4xl hover:text-gray-300 w-12 h-12 flex items-center justify-center bg-black bg-opacity-50 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev === modalImages.length - 1 ? 0 : prev + 1
                  );
                }}
              >
                ›
              </button>
              <div className="absolute bottom-4 text-white text-sm">
                {selectedImageIndex + 1} / {modalImages.length}
              </div>
            </>
          )}

          <img
            src={modalImages[selectedImageIndex]}
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
    </div>
  );
};

export default ForumMain;
