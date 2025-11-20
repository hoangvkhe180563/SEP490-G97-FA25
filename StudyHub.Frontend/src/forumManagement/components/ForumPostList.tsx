// src/forumManagement/components/ForumPostList.tsx
import { useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import PostCard from "./PostCard";
import type { Post } from "../interfaces/forum";

interface ForumPostListProps {
  posts: Post[];
  visiblePosts: number;
  isLoading: boolean;
  onOpenModal: (postId: number) => void;
  onViewDetails: (postId: number) => void;
  onLoadMore: () => void;
}

export const ForumPostList = ({
  posts,
  visiblePosts,
  isLoading,
  onOpenModal,
  onViewDetails,
  onLoadMore,
}: ForumPostListProps) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentTarget = observerTarget.current;

    if (visiblePosts >= posts.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [visiblePosts, posts.length, isLoading, onLoadMore]);

  if (isLoading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (posts.length === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-lg border p-12 text-center">
        <p className="text-gray-500 text-lg">
          Không tìm thấy bài viết nào phù hợp
        </p>
      </div>
    );
  }

  return (
    <>
      {posts.slice(0, visiblePosts).map((post) => (
        <div
          key={post.post_id}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (
              !target.closest("button") &&
              !target.closest("input") &&
              !target.closest("a") &&
              !target.closest('[role="dialog"]') &&
              !target.closest(".animate-in")
            ) {
              onOpenModal(post.post_id);
            }
          }}
          onDoubleClick={(e) => {
            const target = e.target as HTMLElement;
            if (
              !target.closest("button") &&
              !target.closest("input") &&
              !target.closest("a") &&
              !target.closest(".animate-in")
            ) {
              onViewDetails(post.post_id);
            }
          }}
        >
          <PostCard
            post={post}
            onOpenComments={() => onOpenModal(post.post_id)}
            onViewDetails={() => onViewDetails(post.post_id)}
          />
        </div>
      ))}
      <div
        ref={observerTarget}
        className="h-10 flex items-center justify-center"
      >
        {visiblePosts < posts.length ? (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-600"></div>
            <span className="text-sm">Đang tải...</span>
          </div>
        ) : (
          posts.length > 0 && (
            <div className="text-sm text-gray-500">
              Đã hiển thị tất cả {posts.length} bài viết
            </div>
          )
        )}
      </div>
    </>
  );
};
