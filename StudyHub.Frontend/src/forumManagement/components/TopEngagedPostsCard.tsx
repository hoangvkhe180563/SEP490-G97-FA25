// TopEngagedPostsCard.tsx
import React from "react";
import { useForumDashboardStore } from "../stores/useForumDashboardStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const TopEngagedPostsCard: React.FC = () => {
  const { topEngagedPosts } = useForumDashboardStore();
  const navigate = useNavigate();

  if (!topEngagedPosts || topEngagedPosts.length === 0) return null;

  const handlePostClick = (postId: number) => {
    navigate(`/forum/forums/details/${postId}`);
  };

  return (
    <Card className="bg-white border-sky-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-sky-500" />
          Bài viết có nhiều bình luận nhất
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topEngagedPosts.map((post, idx) => (
            <div
              key={idx}
              onClick={() => handlePostClick(post.postId)}
              className="p-3 rounded-lg bg-sky-50 border border-sky-100 hover:bg-sky-100 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sky-900 text-sm line-clamp-2 mb-1">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-sky-600">
                    <span>Bởi {post.creatorName}</span>
                    <span>•</span>
                    <span>
                      {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 bg-sky-600 text-white px-3 py-1 rounded-full">
                    <MessageCircle className="h-3 w-3" />
                    <span className="text-sm font-bold">
                      {post.commentCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
