// src/forumManagement/pages/ForumMain.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import { ArrowUp } from "lucide-react";
import { CreatePostDialog } from "../components/CreatePostDialog";
import { ForumHeader } from "../components/ForumHeader";
import { ForumFilterSidebar } from "../components/ForumFilterSidebar";
import { ForumSearchBar } from "../components/ForumSearchBar";
import { ForumPostList } from "../components/ForumPostList";
import { ForumSidebar } from "../components/ForumSidebar";
import { PostDetailModal } from "../components/PostDetailModal";
import { ImageModal } from "../components/ImageModal";
import { ForumTabs } from "../components/ForumTabs";
import type { Subject } from "../interfaces/forum";
import type { ForumFilters, ImageModalState } from "../interfaces/filter";
import { useForumStore } from "../stores/useForumStore";
import { documentService } from "@/documentManagement/services/documentService";
import { useAuthStore } from "@/auth/stores/useAuthStore";

const ForumMain = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { topPosts, getTopPosts } = useForumStore();
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || 1;

  const {
    posts,
    myPosts,
    currentPost,
    isLoading,
    flairs,
    loadFlairs,
    startForum,
    joinSchoolForum,
    leaveSchoolForum,
    createComment,
    joinPost,
    leavePost,
    getPosts,
    getMyPosts,
    getPostById,
    getComments,
    sendTyping,
  } = useForumStore();

  const [activeTab, setActiveTab] = useState<"all" | "my-posts">("all");
  const [modalVisibleComments, setModalVisibleComments] = useState(8);
  const [imageModalState, setImageModalState] = useState<ImageModalState>({
    isOpen: false,
    images: [],
    selectedIndex: 0,
    zoom: 1,
  });
  const [showCreatePost, setShowCreatePost] = useState(false);

  const getInitialState = (): ForumFilters => {
    const saved = sessionStorage.getItem("forumMainState");
    if (saved && location.state?.fromModal) {
      return JSON.parse(saved);
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

  const [filters, setFilters] = useState<ForumFilters>(initialState);
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const modalPostId = searchParams.get("postId");
  const isModalOpen = !!modalPostId;

  useEffect(() => {
    const initForum = async () => {
      await startForum();
      await new Promise((resolve) => setTimeout(resolve, 200));
      await joinSchoolForum(schoolId);
    };

    initForum();
    documentService.getSubjects().then(setSubjects);
    loadFlairs(schoolId);

    return () => {
      leaveSchoolForum(schoolId);
    };
  }, [startForum, joinSchoolForum, leaveSchoolForum, schoolId, loadFlairs]);

  useEffect(() => {
    getTopPosts(schoolId, 5);
  }, [schoolId, getTopPosts]);

  const fetchPosts = useCallback(() => {
    const subjectId =
      filters.selectedSubjects.length === 1
        ? filters.selectedSubjects[0]
        : undefined;
    const flairId =
      filters.selectedFlairs.length === 1
        ? filters.selectedFlairs[0]
        : undefined;

    if (activeTab === "all") {
      getPosts(
        schoolId,
        subjectId,
        flairId,
        filters.searchQuery,
        filters.sortBy,
        1,
        100
      );
    } else {
      getMyPosts(
        schoolId,
        subjectId,
        flairId,
        filters.searchQuery,
        filters.sortBy,
        1,
        100
      );
    }
  }, [
    schoolId,
    filters.searchQuery,
    filters.selectedSubjects,
    filters.selectedFlairs,
    filters.sortBy,
    activeTab,
    getPosts,
    getMyPosts,
  ]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const handleModalPost = async () => {
      if (modalPostId) {
        setModalVisibleComments(8);
        const postId = parseInt(modalPostId);

        const conn = (window as any).__forumConn;
        if (conn?.state === "Connected") {
          await joinPost(postId);
        } else {
          const retryJoin = setInterval(() => {
            const c = (window as any).__forumConn;
            if (c?.state === "Connected") {
              clearInterval(retryJoin);
              joinPost(postId);
            }
          }, 100);

          setTimeout(() => clearInterval(retryJoin), 3000);
        }

        getPostById(postId);
        getComments(postId);
      }

      return () => {
        if (modalPostId) {
          leavePost(parseInt(modalPostId));
        }
      };
    };

    handleModalPost();
  }, [modalPostId, getPostById, joinPost, getComments, leavePost]);

  useEffect(() => {
    const state = {
      ...filters,
      scrollPosition: window.scrollY,
    };
    sessionStorage.setItem("forumMainState", JSON.stringify(state));
  }, [filters]);

  useEffect(() => {
    if (location.state?.fromModal && initialState.scrollPosition) {
      window.scrollTo(0, initialState.scrollPosition);
    }
  }, [location.state?.fromModal, initialState.scrollPosition]);

  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    if (filters.searchQuery) newSearchParams.set("q", filters.searchQuery);
    if (filters.selectedSubjects.length > 0)
      newSearchParams.set("subjects", filters.selectedSubjects.join(","));
    if (filters.selectedFlairs.length > 0)
      newSearchParams.set("flairs", filters.selectedFlairs.join(","));
    if (filters.sortBy !== "newest")
      newSearchParams.set("sort", filters.sortBy);
    if (modalPostId) newSearchParams.set("postId", modalPostId);

    setSearchParams(newSearchParams, { replace: true });
  }, [
    filters.searchQuery,
    filters.selectedSubjects,
    filters.selectedFlairs,
    filters.sortBy,
    modalPostId,
    setSearchParams,
  ]);

  const handleTabChange = (tab: "all" | "my-posts") => {
    setActiveTab(tab);
    setFilters((prev) => ({ ...prev, visiblePosts: 10 }));
  };

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: value }));
  };

  const toggleSubject = (subjectId: number) => {
    setFilters((prev) => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subjectId)
        ? prev.selectedSubjects.filter((s) => s !== subjectId)
        : [...prev.selectedSubjects, subjectId],
    }));
  };

  const toggleFlair = (flairId: number) => {
    setFilters((prev) => ({
      ...prev,
      selectedFlairs: prev.selectedFlairs.includes(flairId)
        ? prev.selectedFlairs.filter((f) => f !== flairId)
        : [...prev.selectedFlairs, flairId],
    }));
  };

  const handleSortChange = (value: string) => {
    setFilters((prev) => ({ ...prev, sortBy: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      searchQuery: "",
      selectedSubjects: [],
      selectedFlairs: [],
      sortBy: "newest",
      visiblePosts: 10,
      scrollPosition: 0,
    });
  };

  const sortPosts = (postsToSort: typeof posts) => {
    switch (filters.sortBy) {
      case "newest":
        return [...postsToSort].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return [...postsToSort].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "mostCommented":
        return [...postsToSort].sort(
          (a, b) => b.comment_count - a.comment_count
        );
      default:
        return postsToSort;
    }
  };

  const displayPosts = activeTab === "all" ? posts : myPosts;

  const filteredPosts = displayPosts.filter((post) => {
    if (
      filters.selectedSubjects.length > 0 &&
      !filters.selectedSubjects.includes(post.subject_id)
    ) {
      return false;
    }

    if (
      filters.selectedFlairs.length > 0 &&
      !filters.selectedFlairs.includes(post.flair_id)
    ) {
      return false;
    }

    return true;
  });

  const sortedPosts = sortPosts(filteredPosts);

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
    navigate(`/forum/forums/details/${postId}`);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setHasNewPosts(false);
  };

  const handleLoadMore = () => {
    setFilters((prev) => ({
      ...prev,
      visiblePosts: Math.min(prev.visiblePosts + 5, filteredPosts.length),
    }));
  };

  const handleImageClick = (images: string[], idx: number) => {
    setImageModalState({
      isOpen: true,
      images,
      selectedIndex: idx,
      zoom: 1,
    });
  };

  const handleCloseImageModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageModalState((prev) => ({ ...prev, isOpen: false, zoom: 1 }));
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageModalState((prev) => ({
      ...prev,
      zoom: Math.min(prev.zoom + 0.25, 3),
    }));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageModalState((prev) => ({
      ...prev,
      zoom: Math.max(prev.zoom - 0.25, 0.5),
    }));
  };

  const handleSubmitComment = async (content: string, images: File[]) => {
    if (!content.trim() || !currentPost) return;

    const formData = new FormData();
    formData.append("postId", currentPost.post_id.toString());
    formData.append("content", content);
    images.forEach((img) => formData.append("attachments", img));

    const result = await createComment(formData);
    if (!result?.success) {
      alert(result?.message || "Có lỗi xảy ra");
    }
  };

  return (
    <div className="w-full h-full overflow-auto p-2">
      <div className="max-w mx-auto">
        <ForumHeader onCreatePost={() => setShowCreatePost(true)} />

        {hasNewPosts && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-2 duration-300">
            <Button
              onClick={handleScrollToTop}
              className="bg-sky-600 hover:bg-sky-700 text-white shadow-lg"
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              Có bài viết mới
            </Button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-3 space-y-4">
            <ForumFilterSidebar
              subjects={subjects}
              flairs={flairs}
              selectedSubjects={filters.selectedSubjects}
              selectedFlairs={filters.selectedFlairs}
              onToggleSubject={toggleSubject}
              onToggleFlair={toggleFlair}
              onClearFilters={handleClearFilters}
            />
          </aside>
          <main className="col-span-6">
            <div className="space-y-3">
              <ForumTabs activeTab={activeTab} onTabChange={handleTabChange} />

              <ForumSearchBar
                searchQuery={filters.searchQuery}
                sortBy={filters.sortBy}
                totalResults={filteredPosts.length}
                onSearchChange={handleSearchChange}
                onSortChange={handleSortChange}
              />

              <ForumPostList
                posts={sortedPosts}
                visiblePosts={filters.visiblePosts}
                isLoading={isLoading}
                onOpenModal={handleOpenModal}
                onViewDetails={handleViewDetails}
                onLoadMore={handleLoadMore}
              />
            </div>
          </main>
          <aside className="col-span-3">
            <ForumSidebar
              totalPosts={posts.length}
              topPosts={topPosts}
              showStats={true}
              showRules={true}
              showRelatedPosts={false}
            />
          </aside>
        </div>
      </div>

      <PostDetailModal
        isOpen={isModalOpen}
        post={currentPost}
        visibleComments={modalVisibleComments}
        isLoading={isLoading}
        onClose={handleCloseModal}
        onViewDetails={handleViewDetails}
        onRefreshComments={async () => {
          if (modalPostId) {
            await getComments(parseInt(modalPostId));
          }
        }}
        onLoadMoreComments={() => setModalVisibleComments((prev) => prev + 8)}
        onSubmitComment={handleSubmitComment}
        onImageClick={handleImageClick}
        onTyping={sendTyping}
      />

      {imageModalState.isOpen && (
        <ImageModal
          images={imageModalState.images}
          selectedIndex={imageModalState.selectedIndex}
          zoom={imageModalState.zoom}
          onClose={handleCloseImageModal}
          onPrevious={(e) => {
            e.stopPropagation();
            setImageModalState((prev) => ({
              ...prev,
              selectedIndex:
                prev.selectedIndex === 0
                  ? prev.images.length - 1
                  : prev.selectedIndex - 1,
            }));
          }}
          onNext={(e) => {
            e.stopPropagation();
            setImageModalState((prev) => ({
              ...prev,
              selectedIndex:
                prev.selectedIndex === prev.images.length - 1
                  ? 0
                  : prev.selectedIndex + 1,
            }));
          }}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onIndexChange={(index) =>
            setImageModalState((prev) => ({ ...prev, selectedIndex: index }))
          }
        />
      )}

      <CreatePostDialog
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
        schoolId={schoolId}
      />
    </div>
  );
};

export default ForumMain;
